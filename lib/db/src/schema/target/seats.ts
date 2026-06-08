import { pgTable, text, serial, integer, boolean, unique } from "drizzle-orm/pg-core";
import { eventsTable } from "./events";
import { ticketsTable } from "./tickets";

export const seatSectionsTable = pgTable(
  "seat_sections",
  {
    id: serial("id").primaryKey(),
    eventId: text("event_id")
      .notNull()
      .references(() => eventsTable.id),
    name: text("name").notNull(),
    rowCount: integer("row_count").notNull(),
    seatsPerRow: integer("seats_per_row").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [unique().on(t.eventId, t.name)],
);

export const seatsTable = pgTable(
  "seats",
  {
    id: serial("id").primaryKey(),
    sectionId: integer("section_id")
      .notNull()
      .references(() => seatSectionsTable.id, { onDelete: "cascade" }),
    seatLabel: text("seat_label").notNull(),
    isAvailable: boolean("is_available").notNull().default(true),
    ticketId: integer("ticket_id").references(() => ticketsTable.id),
  },
  (t) => [unique().on(t.sectionId, t.seatLabel)],
);
