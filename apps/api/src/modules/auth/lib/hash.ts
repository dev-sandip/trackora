import { ENV } from "@app/core/lib/env";
import bcrypt from "bcrypt";

export const hashPassword = async (password: string): Promise<string> => {
	const hashedPassword = await bcrypt.hash(password, ENV.BCRYPT_ROUNDS);
	return hashedPassword;
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
	const isMatch = await bcrypt.compare(password, hash);
	return isMatch;
};
