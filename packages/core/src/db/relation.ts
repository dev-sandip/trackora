import { relations } from "drizzle-orm/_relations";
import { sessions } from "./session.js";
import { agents } from "./agents.js";
import { users } from "./user.js";

export const usersRelations = relations(users, ({ many }) => ({
	sessions: many(sessions),
	agents: many(agents),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id],
	}),
}));

export const agentsRelations = relations(agents, ({ one }) => ({
	user: one(users, {
		fields: [agents.userId],
		references: [users.id],
	}),
}));
