import z from "zod";

export const registerUserObject = z.object({
  body: z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string(),
    password: z.string(),
  }),
});

export const loginSchemaObject = z.object({
  body: z.object({
    email: z.string(),
    password: z.string(),
  }),
});

export const incomingPassword = z.object({
  body: z.object({
    password: z.string(),
  }),
});

export const incomingEmail = z.object({
  body: z.object({
    email: z.string(),
  }),
});

export const changePasswordObject = z.object({
  body: z.object({
    oldPassword: z.string(),
    newPassword: z.string(),
  }),
});


export const resetForgotPasswordObject = z.object({
  body: z.object({
    token: z.string(),
    newPassword: z.string(),
  }),
});
;

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

export type registerUserType = z.infer<typeof registerUserObject>["body"];
