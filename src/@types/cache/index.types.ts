import z from "zod";

const cacheRecordSchema = z.object({
  shortCode: z.string(),
  longURL: z.string(),
  clickCount: z.int(),
  createdAt: z.string(),
  expiresAt: z.string().nullable(),
  lastAccessedAt: z.string().nullable(),
  cachedTtl: z.number(),
});

export type CacheRecordType = z.infer<typeof cacheRecordSchema>;
