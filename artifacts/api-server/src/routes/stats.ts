import { Router } from "express";
import type { IRouter } from "express";
import { eq, sql, desc } from "drizzle-orm";
import { db, ticketsTable } from "@workspace/db";
import { GetRecentRegistrationsQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

const TICKET_PRICE = 50;
const MAX_CAPACITY = 250;

router.get("/stats/summary", async (_req, res): Promise<void> => {
  const allTickets = await db.select().from(ticketsTable);
  const activeTickets = allTickets.filter(t => t.status !== "cancelled");

  const totalTickets = activeTickets.length;
  const totalRevenue = totalTickets * TICKET_PRICE;
  const checkedIn = activeTickets.filter(t => t.checkedIn).length;
  const remaining = Math.max(0, MAX_CAPACITY - totalTickets);
  const pendingCount = activeTickets.filter(t => !t.checkedIn).length;
  const maleCount = activeTickets.filter(t => t.gender === "Male").length;
  const femaleCount = activeTickets.filter(t => t.gender === "Female").length;

  res.json({
    totalTickets,
    totalRevenue,
    checkedIn,
    remaining,
    pendingCount,
    maleCount,
    femaleCount,
  });
});

router.get("/stats/recent", async (req, res): Promise<void> => {
  const parsed = GetRecentRegistrationsQueryParams.safeParse(req.query);
  const limit = parsed.success ? (parsed.data.limit ?? 10) : 10;

  const tickets = await db
    .select()
    .from(ticketsTable)
    .orderBy(desc(ticketsTable.createdAt))
    .limit(limit);

  res.json(tickets);
});

export default router;
