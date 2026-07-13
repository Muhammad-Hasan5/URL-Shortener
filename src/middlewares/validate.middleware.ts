import type { Request, Response, NextFunction } from "express";
import { z } from "zod";

type AnyZodSchema = z.ZodType<any, any, any>;

export const validateRequest = (schema: AnyZodSchema) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const result = await schema.safeParseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      const issues =
        (result.error as any).issues ?? (result.error as any).errors;

      res.status(400).json({
        status: "fail",
        errors: issues.map((issue: z.core.$ZodIssue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
      return;
    }

    const parsed = result.data as {
      body?: unknown;
      query?: unknown;
      params?: unknown;
    };

    if (parsed.body !== undefined) {
      req.body = parsed.body;
    }

    if (parsed.query !== undefined) {
      for (const key of Object.keys(req.query)) delete (req.query as any)[key];
      Object.assign(req.query as object, parsed.query);
    }

    if (parsed.params !== undefined) {
      for (const key of Object.keys(req.params))
        delete (req.params as any)[key];
      Object.assign(req.params as object, parsed.params);
    }

    next();
  };
};
