import { index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { users } from "./user";

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull(),
    expiresAt: timestamp("expires_at", {
      withTimezone: true,
      mode: "date",
      precision: 3,
    }).notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
      precision: 3,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("sessions_token_uidx").on(table.token),
    index("sessions_user_id_idx").on(table.userId),
    index("sessions_expires_at_idx").on(table.expiresAt),
  ]
);

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
