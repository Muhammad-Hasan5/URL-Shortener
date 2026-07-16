import { getPool } from "../db/pools.db.js";
import logger from "../observability/pino-logging/index.pino.js";

export const checkIfUserExists = async (email: string) => {
  try {
    const pool = getPool("read");
    const res = await pool.query(`select id from users where email = $1;`, [
      email,
    ]);
    return res.rows[0];
  } catch (error: any) {
    logger.info("unable to query user in database", error);
    throw new Error("unable to query database", error);
  }
};

export const insertNewUser = async (user: any) => {
  try {
    const pool = getPool("write");
    const res = await pool.query(
      `insert into users(first_name, last_name, email, password_hash, email_verification_token, email_verification_expires_at) values($1, $2, $3, $4, $5, $6) returning id;`,
      [
        user.firstName,
        user.lastName,
        user.email,
        user.password,
        user.emailVerificationToken,
        user.emailVerificationTokenExpiry,
      ],
    );
    return res.rows[0];
  } catch (error: any) {
    logger.info("unable to insert new user into database", error);
    throw new Error("unable to insert new user into database", error);
  }
};

export const fetchUserById = async (id: string) => {
  try {
    const pool = getPool("read");
    const res = await pool.query(
      `select * from users where id = $1 and status != 'deleted';`,
      [id],
    );
    return res.rows[0];
  } catch (error: any) {
    logger.info("unable to query user in database", error);
    throw new Error("unable to query database", error);
  }
};

export const fetchUserByEmail = async (email: string) => {
  try {
    const pool = getPool("read");
    const res = await pool.query(
      `select * from users where email = $1 and status != 'deleted';`,
      [email],
    );
    return res.rows[0];
  } catch (error: any) {
    logger.info("unable to query user in database", error);
    throw new Error("unable to query database", error);
  }
};

export const updateVerificationTokens = async (
  email: string,
  token: string,
  tokenExpiry: Date,
) => {
  try {
    const pool = getPool("write");
    const res = await pool.query(
      `update users set email_verification_token = $1, email_verification_expires_at = $2 where email = $3;`,
      [token, tokenExpiry, email],
    );
    return res?.rows[0];
  } catch (error: any) {
    logger.info("unable to update user's token in database", error);
    throw new Error("unable to update user's token in database", error);
  }
};

export const updateUser = async (user: any) => {
  try {
    const pool = getPool("write");
    const res = await pool.query(
      `update users set last_login_at = $1, last_login_ip = $2, failed_login_attempts = $3, locked_until = $4, refresh_token = $5 where email = $6 and status = $7 returning * ;`,
      [
        user.last_login_at,
        user.last_login_ip,
        user.failed_login_attempts,
        user.locked_until,
        user.refresh_token,
        user.email,
        "active",
      ],
    );
    return res?.rows[0];
  } catch (error: any) {
    logger.info("unable to update user's token in database", error);
    throw new Error("unable to update user's token in database", error);
  }
};

export const fetchUserByEmailVerificationToken = async (
  hashedToken: string,
) => {
  try {
    const pool = getPool("read");
    const res = await pool.query(
      `select * from users where email_verification_token = $1 and status != 'deleted';`,
      [hashedToken],
    );
    return res.rows[0];
  } catch (error: any) {
    logger.info("unable to query user by verification token", error);
    throw new Error("unable to query database", error);
  }
};

export const markEmailAsVerified = async (id: string) => {
  try {
    const pool = getPool("write");
    const res = await pool.query(
      `update users set email_verified = true, email_verified_at = now(), email_verification_token = null, email_verification_expires_at = null where id = $1 returning *;`,
      [id],
    );
    return res?.rows[0];
  } catch (error: any) {
    logger.info("unable to mark email as verified", error);
    throw new Error("unable to update database", error);
  }
};

export const setPasswordResetToken = async (
  email: string,
  token: string,
  tokenExpiry: Date,
) => {
  try {
    const pool = getPool("write");
    const res = await pool.query(
      `update users set password_reset_token = $1, password_reset_expires_at = $2 where email = $3 and status != 'deleted' returning *;`,
      [token, tokenExpiry, email],
    );
    return res?.rows[0];
  } catch (error: any) {
    logger.info("unable to set password reset token", error);
    throw new Error("unable to update database", error);
  }
};

export const fetchUserByPasswordResetToken = async (hashedToken: string) => {
  try {
    const pool = getPool("read");
    const res = await pool.query(
      `select * from users where password_reset_token = $1 and status != 'deleted';`,
      [hashedToken],
    );
    return res.rows[0];
  } catch (error: any) {
    logger.info("unable to query user by reset token", error);
    throw new Error("unable to query database", error);
  }
};

export const updateUserPassword = async (
  id: string,
  hashedPassword: string,
) => {
  try {
    const pool = getPool("write");
    const res = await pool.query(
      `update users set password_hash = $1, password_reset_token = null, password_reset_expires_at = null, refresh_token = null where id = $2 returning *;`,
      [hashedPassword, id],
    );
    return res?.rows[0];
  } catch (error: any) {
    logger.info("unable to update user's password", error);
    throw new Error("unable to update database", error);
  }
};

export const softDeleteUser = async (id: string) => {
  try {
    const pool = getPool("write");
    const res = await pool.query(
      `update users set status = 'deleted', deleted_at = now(), refresh_token = null where id = $1 returning *;`,
      [id],
    );
    return res?.rows[0];
  } catch (error: any) {
    logger.info("unable to delete user", error);
    throw new Error("unable to update database", error);
  }
};
