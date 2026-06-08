import {
  pgTable,
  text,
  timestamp,
  integer,
  numeric,
  uuid,
  jsonb,
} from "drizzle-orm/pg-core";
import { eventsTable } from "./events";
import { ticketsTable } from "./tickets";
import { paymentProviderEnum, paymentStatusEnum } from "./enums";

export const paymentsTable = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  ticketId: integer("ticket_id")
    .notNull()
    .references(() => ticketsTable.id, { onDelete: "restrict" }),
  eventId: text("event_id")
    .notNull()
    .references(() => eventsTable.id),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("ZAR"),
  provider: paymentProviderEnum("provider").notNull(),
  status: paymentStatusEnum("status").notNull().default("pending"),
  providerReference: text("provider_reference"),
  providerPayload: jsonb("provider_payload"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
