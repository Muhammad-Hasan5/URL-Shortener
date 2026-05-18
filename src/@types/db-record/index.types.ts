import z from "zod"

const newRecordSchema = z.object({
  id: z.string(),
  shortCode: z.string(),
  longURL: z.string(),
  click_count: z.int(),
  expires_at: z.coerce.date(),
  last_accessed_at: z.coerce.date(),
  deleted_at: z.coerce.date()
});

export type NewRecordType = z.infer<typeof newRecordSchema>