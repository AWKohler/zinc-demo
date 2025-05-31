import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders, returns, webhookEvents } from "../../../../../drizzle/schema";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const secret = req.nextUrl.searchParams.get("secret");
    if (secret !== process.env.ZINC_WEBHOOK_SECRET) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { slug } = await params;
    const payload = await req.json();
    
    await db.insert(webhookEvents).values({
      source: slug,
      payload,
    });

    if (payload.request_id) {
      await updateOrderFromWebhook(payload, slug);
    }

    return new Response("OK");
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

async function updateOrderFromWebhook(payload: { request_id?: string; _type?: string; code?: string; tracking?: unknown; return_label_url?: string }, source: string) {
  try {
    if (!payload.request_id) return;
    
    const order = await db.select()
      .from(orders)
      .where(eq(orders.zincId, payload.request_id as string))
      .limit(1);

    if (!order.length) {
      console.warn(`Order not found for request_id: ${payload.request_id}`);
      return;
    }

    const orderData = order[0];
    let newStatus = orderData.status;

    switch (source) {
      case "succeeded":
        if (payload._type === "order_response") {
          newStatus = "order_response";
        }
        break;
      case "failed":
        if (payload._type === "error") {
          newStatus = "error";
        }
        break;
      case "tracking":
        if (payload._type === "order_response" && payload.tracking) {
          newStatus = "order_response";
        } else if (payload._type === "error" && payload.code?.includes("tracking")) {
          newStatus = "error";
        }
        break;
    }

    await db.update(orders)
      .set({
        status: newStatus,
        response: payload,
        updatedAt: new Date(),
      })
      .where(eq(orders.zincId, payload.request_id as string));

    if (payload._type === "return_response" && payload.return_label_url) {
      const returnRecord = await db.select()
        .from(returns)
        .where(eq(returns.zincId, payload.request_id as string))
        .limit(1);

      if (returnRecord.length) {
        await db.update(returns)
          .set({
            status: "label_generated",
            labelUrl: payload.return_label_url,
            response: payload,
            updatedAt: new Date(),
          })
          .where(eq(returns.zincId, payload.request_id as string));
      }
    }

  } catch (error) {
    console.error("Error updating order from webhook:", error);
  }
}