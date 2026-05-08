export {};

import { Logger } from "pino";

declare global {
  namespace Express {
    export interface Request {
      id?: string | any;
      log?: Logger;
    }
  }
}
