import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders } from "../../../../../drizzle/schema";
import { zincFetch } from "@/lib/zinc";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    if (orderData.status === "request_processing" && orderData.zincId) {
      try {
        const zincResponse = await zincFetch<{ _type: string }>(`/v1/orders/${orderData.zincId}`);
        
        await db.update(orders)
          .set({
            status: zincResponse._type === "order_response" ? "order_response" : "error",
            response: zincResponse,
            updatedAt: new Date(),
          })
          .where(eq(orders.id, id));

        return NextResponse.json({
          ...orderData,
          status: zincResponse._type === "order_response" ? "order_response" : "error",
          response: zincResponse,
        });
      } catch (error) {
        console.error("Error polling Zinc:", error);
      }
    }

    return NextResponse.json(orderData);

  } catch (error) {
    console.error("Orders API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}