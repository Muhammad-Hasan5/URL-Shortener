import z from "zod";

const cacheRecordSchema = z.object({
  id: z.string(),
  shortCode: z.string(),
  longURL: z.string(),
  clickCount: z.int(),
  createdAt: z.string(),
  expiresAt: z.string().nullable(),
  lastAccessedAt: z.string().nullable(),
  cachedTtl: z.number(),
});

export type CacheRecord = z.infer<typeof cacheRecordSchema>;
