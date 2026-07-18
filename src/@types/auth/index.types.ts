import z from "zod";

export const registerUserObject = z.object({
  body: z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string(),
    password: z.string(),
  })
});

// login expects credentials in body
export const loginSchemaObject = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string(),
  })
});

// incomingPassword used where a body with { password } is expected
export const incomingPassword = z.object({
  body: z.object({ password: z.string() })
});

// incomingEmail expects email in the body
export const incomingEmail = z.object({
  body: z.object({ email: z.string().email() })
});

// change password expects old/new in body
export const changePasswordObject = z.object({
  body: z.object({
    oldPassword: z.string(),
    newPassword: z.string(),
  })
});

// reset forgot password expects token and newPassword in body
export const resetForgotPasswordObject = z.object({
  body: z.object({ token: z.string(), newPassword: z.string() })
});

// verify email uses token as query param
export const verifyEmailQuery = z.object({
  query: z.object({ token: z.string() })
});

export type sanitizedUser = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  status: string;
  email_verified: boolean;
  avatar_url: string | null;
  last_login_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

export type registerUserType = z.infer<typeof registerUserObject>;
