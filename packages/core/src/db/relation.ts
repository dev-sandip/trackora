import { relations } from "drizzle-orm/_relations";
import { sessions } from "./session";
import { agents } from "./agents";
import { users } from "./user";

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