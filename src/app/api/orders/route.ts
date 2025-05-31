import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders } from "../../../../drizzle/schema";

export async function GET() {
  try {
    const allOrders = await db.select()
      .from(orders)
      .orderBy(desc(orders.createdAt));

    return NextResponse.json(allOrders);
  } catch (error) {
    console.error("Orders list API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}