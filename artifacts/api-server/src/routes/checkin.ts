import { Router } from "express";
import type { IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, ticketsTable, checkInsTable } from "@workspace/db";
import { CheckInTicketBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/checkin", async (req, res): Promise<void> => {
  const parsed = CheckInTicketBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { ticketNumber, volunteerName } = parsed.data;

  const [ticket] = await db
    .select()
    .from(ticketsTable)
    .where(eq(ticketsTable.ticketNumber, ticketNumber));

  if (!ticket) {
    res.json({ status: "invalid", message: "Invalid ticket — not found in system", ticket: null });
    return;
  }

  if (ticket.status === "cancelled") {
    res.json({ status: "invalid", message: "This ticket has been cancelled", ticket });
    return;
  }

  if (ticket.checkedIn) {
    res.json({ status: "already_used", message: "This ticket has already been used for check-in", ticket });
    return;
  }

  const now = new Date();
  const [updated] = await db
    .update(ticketsTable)
    .set({ checkedIn: true, checkedInAt: now })
    .where(eq(ticketsTable.id, ticket.id))
    .returning();

  await db.insert(checkInsTable).values({
    ticketId: ticket.id,
    ticketNumber: ticket.ticketNumber,
    attendeeName: `${ticket.firstName} ${ticket.lastName}`,
    volunteerName: volunteerName ?? null,
  });

  req.log.info({ ticketNumber }, "Ticket checked in");
  res.json({ status: "valid", message: `Welcome, ${ticket.firstName} ${ticket.lastName}!`, ticket: updated });
});

router.get("/checkin/list", async (_req, res): Promise<void> => {
  const checkIns = await db.select().from(checkInsTable).orderBy(checkInsTable.checkedInAt);
  res.json(checkIns);
});

export default router;
