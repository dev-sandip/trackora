import { timestamp } from "drizzle-orm/pg-core";

export const timestamps = {
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "date",
    precision: 3,
  })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true,
    mode: "date",
    precision: 3,
  })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
}