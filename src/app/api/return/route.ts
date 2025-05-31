import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders, returns } from "../../../../drizzle/schema";
import { zincFetch, type ZincReturnRequest } from "@/lib/zinc";

interface ReturnRequest {
  orderId: string;
  quantity: number;
  reason?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ReturnRequest = await request.json();
    
    const order = await db.select()
      .from(orders)
      .where(eq(orders.id, body.orderId))
      .limit(1);

    if (!order.length) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    const orderData = order[0];

    if (orderData.status !== "order_response") {
      return NextResponse.json(
        { error: "Order not eligible for return" },
        { status: 400 }
      );
    }

    const existingReturn = await db.select()
      .from(returns)
      .where(eq(returns.orderId, body.orderId))
      .limit(1);

    if (existingReturn.length) {
      return NextResponse.json(
        { error: "Return already requested for this order" },
        { status: 400 }
      );
    }

    const response = orderData.response as { merchant_order_id?: string };
    const merchantOrderId = response?.merchant_order_id;

    if (!merchantOrderId) {
      return NextResponse.json(
        { error: "Merchant order ID not found" },
        { status: 400 }
      );
    }

    const returnRequest: ZincReturnRequest = {
      merchant_order_id: merchantOrderId,
      products: [{
        product_id: "B002YM4WME",
        quantity: body.quantity,
        reason_code: body.reason || "defective"
      }],
      method_code: "ups_dropoff"
    };

    const zincResponse = await zincFetch<{ request_id: string }>(`/v1/orders/${orderData.zincId}/return`, {
      method: "POST",
      body: returnRequest,
    });

    const returnRow = await db.insert(returns).values({
      orderId: body.orderId,
      zincId: zincResponse.request_id,
      status: "pending",
      response: zincResponse,
    }).returning({ id: returns.id });

    return NextResponse.json({
      return_id: returnRow[0].id,
      zinc_request_id: zincResponse.request_id,
      status: "pending",
    });

  } catch (error) {
    console.error("Return error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}