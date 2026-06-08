import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  numeric,
} from "drizzle-orm/pg-core";

export const eventsTable = pgTable("events", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  venueName: text("venue_name").notNull(),
  venueAddress: text("venue_address"),
  maxCapacity: integer("max_capacity").notNull().default(250),
  ticketPrice: numeric("ticket_price", { precision: 10, scale: 2 })
    .notNull()
    .default("50.00"),
  currency: text("currency").notNull().default("ZAR"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
