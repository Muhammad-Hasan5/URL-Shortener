import { getPool } from "../db/pools.db.js";
import logger from "../observability/pino-logging/index.pino.js";

const UNIQUE_VIOLATION = "23505";

export const checkIfUserExists = async (email: string) => {
  try {
    const pool = getPool("read");
  
    const res = await pool.query(
      `select id from users where email = $1 and status != 'deleted';`,
      [email],
    );
    return res.rows[0];
  } catch (error: any) {
    logger.error("unable to query user in database", error);
    throw new Error("unable to query database");
  }
};

export const insertNewUser = async (user: any) => {
  try {
    const pool = getPool("write");
  
    const res = await pool.query(
      `insert into users(first_name, last_name, email, password_hash, email_verification_token, email_verification_expires_at)
       values($1, $2, $3, $4, $5, $6)
       returning *;`,
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
    if (error.code === UNIQUE_VIOLATION) {
      const err: any = new Error("user with this email already exists");
      err.code = "USER_EXISTS";
      throw err;
    }
    logger.error("unable to insert new user into database", error);
    throw new Error("unable to insert new user into database");
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
    logger.error("unable to query user in database", error);
    throw new Error("unable to query database");
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
    logger.error("unable to query user in database", error);
    throw new Error("unable to query database");
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
    logger.error("unable to query user by verification token", error);
    throw new Error("unable to query database");
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
    logger.error("unable to query user by reset token", error);
    throw new Error("unable to query database");
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
      `update users set email_verification_token = $1, email_verification_expires_at = $2 where email = $3 and status != 'deleted' returning *;`,
      [token, tokenExpiry, email],
    );
    return res?.rows[0];
  } catch (error: any) {
    logger.error("unable to update user's verification token", error);
    throw new Error("unable to update database");
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
    logger.error("unable to mark email as verified", error);
    throw new Error("unable to update database");
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
    logger.error("unable to set password reset token", error);
    throw new Error("unable to update database");
  }
};

export const updateUserPassword = async (
  id: string,
  hashedPassword: string,
) => {
  try {
    const pool = getPool("write");
    // Also clears refresh_token_hash so all existing sessions are killed
    // on password change/reset (standard practice).
    const res = await pool.query(
      `update users set password_hash = $1, password_reset_token = null, password_reset_expires_at = null, refresh_token_hash = null where id = $2 returning *;`,
      [hashedPassword, id],
    );
    return res?.rows[0];
  } catch (error: any) {
    logger.error("unable to update user's password", error);
    throw new Error("unable to update database");
  }
};

export const softDeleteUser = async (id: string) => {
  try {
    const pool = getPool("write");
    const res = await pool.query(
      `update users set status = 'deleted', deleted_at = now(), refresh_token_hash = null where id = $1 returning *;`,
      [id],
    );
    return res?.rows[0];
  } catch (error: any) {
    logger.error("unable to delete user", error);
    throw new Error("unable to update database");
  }
};


export const recordFailedLogin = async (
  id: string,
  maxAttempts: number,
  lockoutSeconds: number,
) => {
  try {
    const pool = getPool("write");
    const res = await pool.query(
      `update users
         set failed_login_attempts = failed_login_attempts + 1,
             locked_until = case
               when failed_login_attempts + 1 >= $2
                 then now() + make_interval(secs => $3)
               else locked_until
             end
       where id = $1
       returning *;`,
      [id, maxAttempts, lockoutSeconds],
    );
    return res?.rows[0];
  } catch (error: any) {
    logger.error("unable to record failed login", error);
    throw new Error("unable to update database");
  }
};

export const recordSuccessfulLogin = async (
  id: string,
  hashedIp: string | null,
  refreshTokenHash: string,
) => {
  try {
    const pool = getPool("write");
    const res = await pool.query(
      `update users
         set failed_login_attempts = 0,
             locked_until = null,
             last_login_at = now(),
             last_login_ip = $2,
             refresh_token_hash = $3
       where id = $1
       returning *;`,
      [id, hashedIp, refreshTokenHash],
    );
    return res?.rows[0];
  } catch (error: any) {
    logger.error("unable to record successful login", error);
    throw new Error("unable to update database");
  }
};

export const clearRefreshToken = async (id: string) => {
  try {
    const pool = getPool("write");
    const res = await pool.query(
      `update users set refresh_token_hash = null where id = $1 returning *;`,
      [id],
    );
    return res?.rows[0];
  } catch (error: any) {
    logger.error("unable to clear refresh token", error);
    throw new Error("unable to update database");
  }
};


export const rotateRefreshToken = async (
  id: string,
  oldHashedToken: string,
  newHashedToken: string,
) => {
  try {
    const pool = getPool("write");
    const res = await pool.query(
      `update users
         set refresh_token_hash = $3
       where id = $1 and refresh_token_hash = $2
       returning *;`,
      [id, oldHashedToken, newHashedToken],
    );
    return res?.rows[0] ?? null;
  } catch (error: any) {
    logger.error("unable to rotate refresh token", error);
    throw new Error("unable to update database");
  }
};
