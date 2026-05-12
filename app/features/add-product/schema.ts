import { z } from "zod";

export const createProductRequestSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().min(1, "Category is required"),
  description: z.string().min(1, "Description is required"),
  cost: z
    .string()
    .min(1, "Cost is required")
    .refine((v) => /^\d*\.?\d*$/.test(v), "Only numbers allowed"),
  comments: z.string().optional(),
});

export type CreateProductRequestFormValues = z.infer<
  typeof createProductRequestSchema
>;
