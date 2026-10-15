import {
	pgTable,
	uuid,
	text,
	doublePrecision,
	varchar,
	timestamp,
	jsonb,
	index,
} from "drizzle-orm/pg-core";
import { agentStatusEnum } from "./enums/index.js";
import { users } from "./user.js";
import { timestamps } from "./common/index.js";

export const agents = pgTable(
	"agents",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		name: varchar("name", { length: 255 }).notNull(),
		status: agentStatusEnum("status").notNull().default("offline"),

		// Proper numeric types for geo data
		locationLat: doublePrecision("location_lat"),
		locationLng: doublePrecision("location_lng"),
		locationAddress: text("location_address"),
		locationAccuracy: doublePrecision("location_accuracy"), // meters
		locationTimestamp: timestamp("location_timestamp", {
			withTimezone: true,
			mode: "date",
			precision: 3,
		}),

		lastSeen: timestamp("last_seen", {
			withTimezone: true,
			mode: "date",
			precision: 3,
		})
			.notNull()
			.defaultNow(),

		// Typed JSONB
		metadata: jsonb("metadata").$type<Record<string, unknown>>(),

		...timestamps,
	},
	(table) => [
		index("agents_user_id_idx").on(table.userId),
		index("agents_status_idx").on(table.status),
		index("agents_last_seen_idx").on(table.lastSeen),
		// Optional: composite for common queries
		index("agents_user_status_idx").on(table.userId, table.status),
	],
);

export type Agent = typeof agents.$inferSelect;
export type NewAgent = typeof agents.$inferInsert;
