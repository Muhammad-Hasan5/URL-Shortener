import type { JwtPayload } from "jsonwebtoken";

export interface JwtTokenPayload extends JwtPayload {
  id?: string;
  email: string;
}
