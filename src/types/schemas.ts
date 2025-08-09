import { z } from 'zod';

export const LineItemSchema = z.object({
  qty: z.number().positive(),
  description: z.string().min(2),
  unitPrice: z.number().nonnegative(),
  taxable: z.boolean().default(true),
  kind: z.enum(['material', 'labor']).optional(),
});

export const AddressSchema = z.object({
  line1: z.string().min(3),
  line2: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  zip: z.string().min(3),
});

export const CustomerSchema = z.object({
  name: z.string().min(2),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  serviceAddress: AddressSchema.partial().optional(),
  billingAddress: AddressSchema.partial().optional(),
  notes: z.string().optional(),
});

export const DraftSchema = z.object({
  docType: z.enum(['quote', 'invoice']),
  customer: CustomerSchema,
  address: AddressSchema.partial(),
  items: z.array(LineItemSchema).min(1),
  discount: z.object({
    type: z.enum(['percent', 'flat']),
    value: z.number(),
  }).optional(),
  taxRate: z.number().min(0).max(0.25).default(0.07),
  notes: z.string().optional(),
});

export const BusinessProfileSchema = z.object({
  name: z.string().min(2),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  logo: z.string().optional(),
  defaultTaxRate: z.number().min(0).max(0.25).default(0.07),
  defaultLaborRate: z.number().positive().default(125),
  defaultTerms: z.string().default('Net 30'),
});

export type LineItemSchemaType = z.infer<typeof LineItemSchema>;
export type CustomerSchemaType = z.infer<typeof CustomerSchema>;
export type DraftSchemaType = z.infer<typeof DraftSchema>;
export type BusinessProfileSchemaType = z.infer<typeof BusinessProfileSchema>;
