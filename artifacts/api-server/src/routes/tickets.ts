import { Router } from "express";
import type { IRouter } from "express";
import { eq, ilike, or, sql } from "drizzle-orm";
import { db, ticketsTable } from "@workspace/db";
import {
  RegisterTicketBody,
  UpdateTicketBody,
  UpdateTicketParams,
  GetTicketParams,
  CancelTicketParams,
  GetTicketByNumberParams,
  ListTicketsQueryParams,
} from "@workspace/api-zod";
import { generateTicketNumber, generateSeatNumber } from "../lib/ticketNumber";
import { logger } from "../lib/logger";
import QRCode from "qrcode";

const router: IRouter = Router();

router.get("/tickets", async (req, res): Promise<void> => {
  const parsed = ListTicketsQueryParams.safeParse(req.query);
  const page = parsed.success ? (parsed.data.page ?? 1) : 1;
  const limit = parsed.success ? (parsed.data.limit ?? 50) : 50;
  const status = parsed.success ? parsed.data.status : undefined;
  const search = parsed.success ? parsed.data.search : undefined;

  let query = db.select().from(ticketsTable);

  const conditions = [];
  if (status) conditions.push(eq(ticketsTable.status, status));
  if (search) {
    conditions.push(
      or(
        ilike(ticketsTable.firstName, `%${search}%`),
        ilike(ticketsTable.lastName, `%${search}%`),
        ilike(ticketsTable.ticketNumber, `%${search}%`),
        ilike(ticketsTable.phone, `%${search}%`)
      )!
    );
  }

  const filtered = conditions.length > 0
    ? await db.select().from(ticketsTable).where(conditions.length === 1 ? conditions[0] : sql`${conditions[0]} AND ${conditions[1]}`)
    : await db.select().from(ticketsTable);

  const total = filtered.length;
  const offset = (page - 1) * limit;
  const tickets = filtered.slice(offset, offset + limit);

  res.json({ tickets, total, page, limit });
});

router.post("/tickets", async (req, res): Promise<void> => {
  const parsed = RegisterTicketBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { firstName, lastName, phone, gender, churchAssembly, quantity = 1 } = parsed.data;

  try {
    const ticketNumber = await generateTicketNumber();

    const [existing] = await db.select({ count: sql<number>`count(*)::int` }).from(ticketsTable);
    const seatIndex = existing?.count ?? 0;
    const seatNumber = generateSeatNumber(seatIndex);

    const qrData = JSON.stringify({ ticketNumber, name: `${firstName} ${lastName}`, eventId: "CG2026" });
    const qrCode = await QRCode.toDataURL(qrData);

    const [ticket] = await db.insert(ticketsTable).values({
      ticketNumber,
      firstName,
      lastName,
      phone,
      gender,
      churchAssembly: churchAssembly ?? null,
      status: "active",
      seatNumber,
      qrCode,
    }).returning();

    req.log.info({ ticketNumber }, "Ticket registered");
    res.status(201).json(ticket);
  } catch (err) {
    req.log.error({ err }, "Failed to create ticket");
    res.status(500).json({ error: "Failed to create ticket" });
  }
});

router.get("/tickets/number/:ticketNumber", async (req, res): Promise<void> => {
  const params = GetTicketByNumberParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [ticket] = await db
    .select()
    .from(ticketsTable)
    .where(eq(ticketsTable.ticketNumber, params.data.ticketNumber));

  if (!ticket) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  res.json(ticket);
});

router.get("/tickets/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ticket ID" });
    return;
  }

  const [ticket] = await db
    .select()
    .from(ticketsTable)
    .where(eq(ticketsTable.id, id));

  if (!ticket) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  res.json(ticket);
});

router.patch("/tickets/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ticket ID" });
    return;
  }

  const parsed = UpdateTicketBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [ticket] = await db
    .update(ticketsTable)
    .set(parsed.data)
    .where(eq(ticketsTable.id, id))
    .returning();

  if (!ticket) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  res.json(ticket);
});

router.delete("/tickets/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ticket ID" });
    return;
  }

  const [ticket] = await db
    .update(ticketsTable)
    .set({ status: "cancelled" })
    .where(eq(ticketsTable.id, id))
    .returning();

  if (!ticket) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  res.json(ticket);
});

export default router;
