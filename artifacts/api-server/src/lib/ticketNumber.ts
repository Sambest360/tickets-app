import { db } from "@workspace/db";
import { ticketsTable } from "@workspace/db";
import { sql } from "drizzle-orm";

export async function generateTicketNumber(): Promise<string> {
  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(ticketsTable);
  const count = (result[0]?.count ?? 0) + 1;
  const padded = String(count).padStart(6, "0");
  return `CG2026-${padded}`;
}

export function generateSeatNumber(index: number): string {
  const row = String.fromCharCode(65 + Math.floor(index / 20));
  const seat = (index % 20) + 1;
  return `${row}${seat}`;
}
