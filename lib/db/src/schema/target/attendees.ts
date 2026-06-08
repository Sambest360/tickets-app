import { pgTable, text, timestamp, uuid, unique } from "drizzle-orm/pg-core";
import { eventsTable } from "./events";

export const attendeesTable = pgTable(
  "attendees",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: text("event_id")
      .notNull()
      .references(() => eventsTable.id),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    phone: text("phone").notNull(),
    gender: text("gender").notNull(),
    churchAssembly: text("church_assembly"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique().on(t.eventId, t.phone)],
);
