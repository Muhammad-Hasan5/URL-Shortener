import z from "zod";

const cacheRecordSchema = z.object({
  shortCode: z.string(),
  longURL: z.string(),
});

export type CacheRecordType = z.infer<typeof cacheRecordSchema>;
