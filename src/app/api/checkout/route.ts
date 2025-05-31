import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders } from "../../../../drizzle/schema";
import { zincFetch, type ZincOrder } from "@/lib/zinc";
import { generateIdempotencyKey, getWebhookUrl } from "@/lib/idempotency";

interface CheckoutRequest {
  mode: "credentials" | "addax";
  address: {
    first_name: string;
    last_name: string;
    address_line1: string;
    address_line2?: string;
    zip_code: string;
    city: string;
    state: string;
    country: string;
  };
  payment?: {
    name_on_card: string;
    number: string;
    security_code: string;
    expiration_month: number;
    expiration_year: number;
  };
  credentials?: {
    email: string;
    password: string;
    totp_2fa_key?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: CheckoutRequest = await request.json();
    
    const idempotencyKey = generateIdempotencyKey();
    
    const orderRow = await db.insert(orders).values({
      mode: body.mode,
      idempotency: idempotencyKey,
      status: "initiated",
      zincId: "",
    }).returning({ id: orders.id });

    const orderId = orderRow[0].id;

    const baseOrder: Partial<ZincOrder> = {
      idempotency_key: idempotencyKey,
      retailer: "amazon",
      products: [{ product_id: "B002YM4WME", quantity: 1 }],
      max_price: 1000000,
      shipping_method: body.mode === "credentials" ? "free" : "cheapest",
      shipping_address: body.address,
      webhooks: {
        request_succeeded: getWebhookUrl("succeeded"),
        request_failed: getWebhookUrl("failed"),
        tracking_obtained: getWebhookUrl("tracking"),
        tracking_updated: getWebhookUrl("tracking"),
      },
    };

    let zincOrder: ZincOrder;

    if (body.mode === "credentials") {
      if (!body.credentials || !body.payment) {
        return NextResponse.json(
          { error: "Credentials and payment required for credential mode" },
          { status: 400 }
        );
      }

      zincOrder = {
        ...baseOrder,
        retailer_credentials: body.credentials,
        payment_method: {
          ...body.payment,
          use_gift: false,
        },
        billing_address: body.address,
      } as ZincOrder;
    } else {
      if (!process.env.ADDAX_ENABLED || process.env.ADDAX_ENABLED !== "true") {
        return NextResponse.json(
          { error: "Addax checkout not enabled" },
          { status: 400 }
        );
      }

      zincOrder = {
        ...baseOrder,
        addax: true,
      } as ZincOrder;
    }

    const zincResponse = await zincFetch<{ request_id: string }>("/v1/orders", {
      method: "POST",
      body: zincOrder,
    });

    await db.update(orders)
      .set({
        status: "request_processing",
        zincId: zincResponse.request_id,
        response: zincResponse,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    return NextResponse.json({
      order_id: orderId,
      zinc_request_id: zincResponse.request_id,
      status: "request_processing",
    });

  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}