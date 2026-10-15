
import { type NewUser, type User, users } from "../../db/user.js";
import { type NewSession, type Session, sessions } from "../../db/session.js";
import { and, eq, gt } from "drizzle-orm";
import db from "../../db/client.js";

/** Provides user and session authentication operations. */

class AuthRepository {
	/**
	 * Creates a new user.
	 *
	 * @param data - The user data to persist.
	 * @returns The created user.
	 * @throws If the user cannot be created.
	 */
	async createUser(data: Pick<User, "email" | "name" | "password">): Promise<NewUser> {
		const role = "user";
		const [user] = await db
			.insert(users)
			.values({ ...data, role })
			.returning();
		if (!user) {
			throw new Error("Failed to create user!");
		}
		return user;
	}

	/**
	 * Finds a user by email address.
	 *
	 * @param email - The email address to search for.
	 * @returns The matching user, or `null` if no user is found.
	 */
	async getUserByEmail(email: string): Promise<User | null> {
		const user = await db.select().from(users).where(eq(users.email, email)).limit(1).execute();
		return user[0] || null;
	}

	/**
	 * Finds a user by ID.
	 *
	 * @param id - The user's ID.
	 * @returns The matching user, or `null` if no user is found.
	 */
	async findUserById(id: string): Promise<User | null> {
		const user = await db.select().from(users).where(eq(users.id, id)).limit(1).execute();
		return user[0] || null;
	}

	/**
	 * Creates a session for a user with a configurable expiration period.
	 *
	 * @param userId - The ID of the user associated with the session.
	 * @param expiresInDays - The number of days until the session expires.
	 * @param token - The token used to authenticate the session.
	 * @returns The created session and its authentication token.
	 */
	async createSession(
		userId: string,
		expiresInDays = 7,
		token: string,
	): Promise<{ session: NewSession; token: string }> {
		const expiresAt = new Date();
		expiresAt.setDate(expiresAt.getDate() + expiresInDays);
		const [session] = await db
			.insert(sessions)
			.values({
				userId,
				token,
				expiresAt,
			})
			.returning();
		if (!session) {
			throw new Error("Failed to create session!");
		}

		return { session, token };
	}

	/**
	 * Validates a session token and retrieves its active user.
	 *
	 * @param token - The session token to validate.
	 * @returns The active user and session, or `null` if the token is invalid,
	 * expired, or belongs to an inactive user.
	 */
	async validateSession(token: string): Promise<{ user: User; session: Session } | null> {
		const now = new Date();
		const [session] = await db
			.select()
			.from(sessions)
			.where(and(eq(sessions.token, token), gt(sessions.expiresAt, now)))
			.limit(1);

		if (!session) return null;

		const user = await this.findUserById(session.userId);
		if (!user?.isActive) return null;

		return { user, session };
	}

	/**
	 * Deletes a session by its token.
	 *
	 * @param token - The session token to delete.
	 */
	async deleteSession(token: string): Promise<void> {
		await db.delete(sessions).where(eq(sessions.token, token));
	}

	/**
	 * Deletes all sessions belonging to a user.
	 *
	 * @param userId - The ID of the user whose sessions should be deleted.
	 */
	async deleteAllUserSessions(userId: string): Promise<void> {
		await db.delete(sessions).where(eq(sessions.userId, userId));
	}

	/** Deletes all expired sessions. */
	async cleanupExpiredSessions(): Promise<void> {
		const now = new Date();
		await db.delete(sessions).where(gt(sessions.expiresAt, now));
	}
}


export default new AuthRepository();