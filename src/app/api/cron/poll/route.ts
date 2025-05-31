import { NextRequest, NextResponse } from "next/server";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders, returns } from "../../../../../drizzle/schema";
import { zincFetch } from "@/lib/zinc";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response("Unauthorized", { status: 401 });
    }

    console.log("Starting background poll job...");

    const pendingOrders = await db.select()
      .from(orders)
      .where(inArray(orders.status, ["request_processing", "initiated"]));

    console.log(`Found ${pendingOrders.length} pending orders to poll`);

    for (const order of pendingOrders) {
      if (!order.zincId) continue;

      try {
        console.log(`Polling order ${order.id} (Zinc ID: ${order.zincId})`);
        
        const zincResponse = await zincFetch<{ _type: string }>(`/v1/orders/${order.zincId}`);
        
        let newStatus = order.status;
        if (zincResponse._type === "order_response") {
          newStatus = "order_response";
        } else if (zincResponse._type === "error") {
          newStatus = "error";
        }

        await db.update(orders)
          .set({
            status: newStatus,
            response: zincResponse,
            updatedAt: new Date(),
          })
          .where(eq(orders.id, order.id));

        console.log(`Updated order ${order.id} status to ${newStatus}`);

      } catch (error) {
        console.error(`Error polling order ${order.id}:`, error);
      }
    }

    const pendingReturns = await db.select()
      .from(returns)
      .where(inArray(returns.status, ["pending", "in_progress"]));

    console.log(`Found ${pendingReturns.length} pending returns to poll`);

    for (const returnRecord of pendingReturns) {
      try {
        console.log(`Polling return ${returnRecord.id} (Zinc ID: ${returnRecord.zincId})`);
        
        const zincResponse = await zincFetch<{ _type: string; return_label_url?: string; status?: string }>(`/v1/returns/${returnRecord.zincId}`);
        
        let newStatus = returnRecord.status;
        let labelUrl = returnRecord.labelUrl;

        if (zincResponse._type === "return_response") {
          if (zincResponse.return_label_url) {
            newStatus = "label_generated";
            labelUrl = zincResponse.return_label_url;
          } else if (zincResponse.status) {
            newStatus = zincResponse.status;
          }
        }

        await db.update(returns)
          .set({
            status: newStatus,
            labelUrl,
            response: zincResponse,
            updatedAt: new Date(),
          })
          .where(eq(returns.id, returnRecord.id));

        console.log(`Updated return ${returnRecord.id} status to ${newStatus}`);

      } catch (error) {
        console.error(`Error polling return ${returnRecord.id}:`, error);
      }
    }

    console.log("Background poll job completed");

    return NextResponse.json({
      message: "Poll completed",
      orders_polled: pendingOrders.length,
      returns_polled: pendingReturns.length,
    });

  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}