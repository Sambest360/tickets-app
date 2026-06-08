/**
 * Target system schema — not yet wired into drizzle.config.ts exports.
 * Mirrors lib/db/schema.sql. Adopt tables incrementally via lib/db/src/schema/index.ts.
 */
export * from "./enums";
export * from "./events";
export * from "./users";
export * from "./attendees";
export * from "./tickets";
export * from "./payments";
export * from "./checkins";
export * from "./seats";
export * from "./notifications";
export * from "./audit";
