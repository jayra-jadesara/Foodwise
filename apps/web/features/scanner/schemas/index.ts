import { z } from "zod";

export const BarcodeInputSchema = z.object({
  barcode: z.string().min(8).max(14).regex(/^\d+$/),
});

export const ManualEntrySchema = z.object({
  barcode: z.string().min(8, "Enter 8-14 digits").regex(/^\d+$/),
});

export const OFFProductSchema = z.object({
  status: z.number(),
  product: z.object({
    product_name: z.string().optional(),
    brands: z.string().optional(),
    image_front_url: z.string().optional(),
    nutriments: z.any().optional(),
    nova_group: z.number().optional(),
    nutriscore_grade: z.string().optional(),
  }).optional(),
});