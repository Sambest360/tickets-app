import { pgTable, text, timestamp, boolean, uuid } from "drizzle-orm/pg-core";
import { userRoleEnum } from "./enums";

export const usersTable = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: text("username").unique(),
  email: text("email").unique(),
  phone: text("phone"),
  displayName: text("display_name").notNull(),
  passwordHash: text("password_hash"),
  role: userRoleEnum("role").notNull().default("volunteer"),
  isActive: boolean("is_active").notNull().default(true),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
