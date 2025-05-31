import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders } from "../../../../../../drizzle/schema";
import { zincFetch } from "@/lib/zinc";

interface RetryRequest {
  verification_code: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body: RetryRequest = await request.json();
    const { id } = await params;
    
    const order = await db.select()
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);

    if (!order.length) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    const orderData = order[0];

    if (!orderData.zincId) {
      return NextResponse.json(
        { error: "No Zinc request ID found" },
        { status: 400 }
      );
    }

    const zincResponse = await zincFetch<unknown>(`/v1/orders/${orderData.zincId}/retry`, {
      method: "POST",
      body: {
        retailer_credentials: {
          verification_code: body.verification_code,
        },
      },
    });

    await db.update(orders)
      .set({
        status: "request_processing",
        response: zincResponse,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id));

    return NextResponse.json({
      message: "Retry request submitted successfully",
      zinc_response: zincResponse,
    });

  } catch (error) {
    console.error("Retry error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}