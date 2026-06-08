import {
  pgTable,
  text,
  serial,
  timestamp,
  integer,
  boolean,
  uuid,
} from "drizzle-orm/pg-core";
import { eventsTable } from "./events";
import { attendeesTable } from "./attendees";
import { ticketStatusEnum } from "./enums";

export const ticketsTable = pgTable("tickets", {
  id: serial("id").primaryKey(),
  eventId: text("event_id")
    .notNull()
    .default("CG2026")
    .references(() => eventsTable.id),
  attendeeId: uuid("attendee_id").references(() => attendeesTable.id),
  ticketNumber: text("ticket_number").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone").notNull(),
  gender: text("gender").notNull(),
  churchAssembly: text("church_assembly"),
  status: ticketStatusEnum("status").notNull().default("active"),
  seatNumber: text("seat_number").notNull(),
  qrCode: text("qr_code").notNull(),
  checkedIn: boolean("checked_in").notNull().default(false),
  checkedInAt: timestamp("checked_in_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
