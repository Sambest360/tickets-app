import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const checkInsTable = pgTable("check_ins", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").notNull(),
  ticketNumber: text("ticket_number").notNull(),
  attendeeName: text("attendee_name").notNull(),
  volunteerName: text("volunteer_name"),
  checkedInAt: timestamp("checked_in_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCheckInSchema = createInsertSchema(checkInsTable).omit({
  id: true,
  checkedInAt: true,
});
export type InsertCheckIn = z.infer<typeof insertCheckInSchema>;
export type CheckIn = typeof checkInsTable.$inferSelect;
