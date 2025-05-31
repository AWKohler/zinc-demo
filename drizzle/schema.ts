import { pgTable, uuid, text, timestamp, jsonb } from "drizzle-orm/pg-core";

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  zincId: text("zinc_id").notNull(),
  mode: text("mode").notNull(),
  idempotency: text("idempotency").notNull().unique(),
  status: text("status").notNull(),
  response: jsonb("response"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const returns = pgTable("returns", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").references(() => orders.id),
  zincId: text("zinc_id").notNull(),
  status: text("status").notNull(),
  labelUrl: text("label_url"),
  response: jsonb("response"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const webhookEvents = pgTable("webhook_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  source: text("source").notNull(),
  payload: jsonb("payload").notNull(),
  handledAt: timestamp("handled_at").defaultNow()
});