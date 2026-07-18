import type { Request, Response, NextFunction } from "express";
import { z } from "zod";

type AnyZodSchema = z.ZodType<any, any, any>;

// validateRequest.middleware.ts
export function validateRequest(schema: AnyZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      return res.status(400).json({
        status: "fail",
        errors: result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    req.body = result.data.body;
    req.query = result.data.query;
    req.params = result.data.params;

    next();
  };
}
