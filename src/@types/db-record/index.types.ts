import z from "zod"

const newRecordSchema = z.object({
  id: z.string(),
  shortCode: z.string(),
  longURL: z.string(),
  click_count: z.number().int().default(0),
  user_id: z.uuid(),
  created_at: z.coerce.date().optional(),
  expires_at: z.coerce.date().nullable().optional(),
  last_accessed_at: z.coerce.date().nullable().optional(),
  deleted_at: z.coerce.date().nullable().optional(),
});

export type DatabaseRecord = z.infer<typeof newRecordSchema>