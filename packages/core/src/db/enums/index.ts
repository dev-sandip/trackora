import { pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const agentStatusEnum = pgEnum("agent_status", ["online", "offline", "busy", "away"]);

export type UserRole = (typeof userRoleEnum.enumValues)[number];
export type AgentStatus = (typeof agentStatusEnum.enumValues)[number];
