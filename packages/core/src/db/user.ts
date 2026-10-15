import { boolean, index, pgTable, text, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { userRoleEnum } from "./enums/index.js";
import { timestamps } from "./common/index.js";

export const users = pgTable(
	"users",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		email: varchar("email", { length: 320 }).notNull(),
		password: text("password_hash").notNull(),
		name: varchar("name", { length: 255 }).notNull(),
		role: userRoleEnum("role").notNull().default("user"),
		avatarUrl: text("avatar_url"),
		isActive: boolean("is_active").notNull().default(true),
		...timestamps,
	},
	(table) => [
		uniqueIndex("users_email_uidx").on(table.email),
		index("users_role_idx").on(table.role),
		index("users_is_active_idx").on(table.isActive),
	],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
