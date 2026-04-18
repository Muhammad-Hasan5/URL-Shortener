import type { Request, Response } from "express";
export declare const shortURL: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const redirect: (req: Request, res: Response) => Promise<void | Response<any, Record<string, any>>>;
//# sourceMappingURL=url.controller.d.ts.map