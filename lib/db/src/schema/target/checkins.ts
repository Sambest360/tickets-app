import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { ticketsTable } from "./tickets";
import { checkinResultEnum } from "./enums";

export const checkInsTable = pgTable("check_ins", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id")
    .notNull()
    .references(() => ticketsTable.id, { onDelete: "cascade" }),
  ticketNumber: text("ticket_number").notNull(),
  attendeeName: text("attendee_name").notNull(),
  volunteerName: text("volunteer_name"),
  result: checkinResultEnum("result").notNull().default("valid"),
  deviceInfo: text("device_info"),
  checkedInAt: timestamp("checked_in_at", { withTimezone: true }).notNull().defaultNow(),
});
