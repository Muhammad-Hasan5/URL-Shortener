import z from "zod"

const newRecordSchema = z.object({
    id: z.string(),
    shortCode: z.string(),
    longURL: z.string()
})

export type NewRecordType = z.infer<typeof newRecordSchema>