import * as argon2 from "argon2";
import logger from "../../observability/pino-logging/index.pino.js";

export const hashPassword = async (password: string): Promise<string> => {
  try {
    const hashedPassword = await argon2.hash(password);
    return hashedPassword;
  } catch (error: any) {
    logger.info("unable to hash password", error);
    throw new Error("unable to hash password", error);
  }
};

export const verifyPassword = async (
  hashedPass: string,
  password: string,
): Promise<boolean> => {
  try {
    const valid = await argon2.verify(hashedPass, password);
    return valid;
  } catch (error: any) {
    logger.info("unable to verify password", error);
    throw new Error("unable to verify hashed password", error);
  }
};
