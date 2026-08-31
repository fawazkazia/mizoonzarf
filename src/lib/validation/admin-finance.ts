import { z } from "zod";

export const supplierInputSchema = z.object({
  name: z.string().min(2, "Name is required"),
  code: z.string().min(2, "Code is required"),
  contactName: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  gstin: z.string().optional(),
  isActive: z.boolean().default(true),
});
export type SupplierInput = z.infer<typeof supplierInputSchema>;

export const purchaseOrderItemInputSchema = z.object({
  variantId: z.string().min(1),
  quantityOrdered: z.coerce.number().int().min(1),
  unitCost: z.coerce.number().min(0),
});

export const purchaseOrderInputSchema = z.object({
  supplierId: z.string().min(1, "Supplier is required"),
  warehouseId: z.string().min(1, "Warehouse is required"),
  notes: z.string().optional(),
  expectedAt: z.string().optional(),
  items: z.array(purchaseOrderItemInputSchema).min(1, "At least one line item is required"),
});
export type PurchaseOrderInput = z.infer<typeof purchaseOrderInputSchema>;

export const expenseCategoryValues = [
  "RENT",
  "SALARIES",
  "MARKETING",
  "UTILITIES",
  "SOFTWARE_SUBSCRIPTIONS",
  "SHIPPING_LOGISTICS",
  "BANK_FEES",
  "OFFICE_SUPPLIES",
  "PROFESSIONAL_FEES",
  "OTHER",
] as const;

export const expenseInputSchema = z.object({
  category: z.enum(expenseCategoryValues),
  description: z.string().min(2, "Description is required"),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  incurredAt: z.string().min(1, "Date is required"),
  supplierId: z.string().optional().nullable(),
  paidFrom: z.string().optional(),
});
export type ExpenseInput = z.infer<typeof expenseInputSchema>;
