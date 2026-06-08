import { pgTable, text, timestamp, integer, uuid } from "drizzle-orm/pg-core";
import { eventsTable } from "./events";
import { ticketsTable } from "./tickets";
import { notificationChannelEnum, notificationStatusEnum } from "./enums";

export const notificationsTable = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  ticketId: integer("ticket_id").references(() => ticketsTable.id, {
    onDelete: "set null",
  }),
  eventId: text("event_id")
    .notNull()
    .references(() => eventsTable.id),
  channel: notificationChannelEnum("channel").notNull(),
  recipient: text("recipient").notNull(),
  templateKey: text("template_key").notNull(),
  status: notificationStatusEnum("status").notNull().default("pending"),
  providerId: text("provider_id"),
  errorMessage: text("error_message"),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
