import z from "zod"

export const registerUserObject = z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.email(),
    password: z.string().min(8, "password must contain atleast 8 characters.")
})

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

export type registerUserType = z.infer<typeof registerUserObject>