import { pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["admin", "volunteer", "attendee"]);

export const ticketStatusEnum = pgEnum("ticket_status", ["active", "cancelled", "used"]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "completed",
  "failed",
  "refunded",
]);

export const paymentProviderEnum = pgEnum("payment_provider", [
  "yoco",
  "payfast",
  "manual",
  "free",
]);

export const checkinResultEnum = pgEnum("checkin_result", [
  "valid",
  "invalid",
  "already_used",
]);

export const notificationChannelEnum = pgEnum("notification_channel", [
  "sms",
  "whatsapp",
  "email",
]);

export const notificationStatusEnum = pgEnum("notification_status", [
  "pending",
  "sent",
  "failed",
  "skipped",
]);
