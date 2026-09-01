"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/admin-auth";
import { CUSTOMER_CARE_MANAGER_ROLES } from "@/lib/admin-permissions";
import { TicketCategory } from "@/generated/prisma/client";

const templateSchema = z.object({
  name: z.string().min(2),
  category: z.nativeEnum(TicketCategory).nullable(),
  body: z.string().min(5),
  isActive: z.boolean(),
});

export async function createTemplate(raw: z.infer<typeof templateSchema>) {
  await requireRole(CUSTOMER_CARE_MANAGER_ROLES);
  const input = templateSchema.parse(raw);
  await db.ticketReplyTemplate.create({ data: input });
  revalidatePath("/admin/customer-care/templates");
}

export async function updateTemplate(id: string, raw: z.infer<typeof templateSchema>) {
  await requireRole(CUSTOMER_CARE_MANAGER_ROLES);
  const input = templateSchema.parse(raw);
  await db.ticketReplyTemplate.update({ where: { id }, data: input });
  revalidatePath("/admin/customer-care/templates");
}

export async function deleteTemplate(id: string) {
  await requireRole(CUSTOMER_CARE_MANAGER_ROLES);
  await db.ticketReplyTemplate.delete({ where: { id } });
  revalidatePath("/admin/customer-care/templates");
}
