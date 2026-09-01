"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireStaff, requireSuperAdmin, requireRole } from "@/lib/admin-auth";
import { CUSTOMER_CARE_MANAGER_ROLES } from "@/lib/admin-permissions";
import type { ReliabilityStatus } from "@/generated/prisma/client";

export async function updateCustomerNotes(userId: string, notes: string) {
  await requireSuperAdmin();
  await db.user.update({ where: { id: userId }, data: { notes: notes || null } });
  revalidatePath(`/admin/customers/${userId}`);
}

export async function updateReliabilityOverride(userId: string, override: ReliabilityStatus | null, note: string) {
  const session = await requireStaff();
  await db.user.update({
    where: { id: userId },
    data: {
      reliabilityOverride: override,
      reliabilityOverrideNote: note || null,
      reliabilityOverrideBy: override ? session.user.id : null,
      reliabilityOverrideAt: override ? new Date() : null,
    },
  });
  revalidatePath(`/admin/customers/${userId}`);
  revalidatePath("/admin/customers");
}

/** Timestamped, append-only — never edits or removes a prior entry. Open to any staff member
 * (matches spec: "Add internal notes" is a base Customer Care Employee capability). */
export async function addCustomerNote(userId: string, body: string) {
  const session = await requireStaff();
  if (!body.trim()) throw new Error("Note can't be empty.");
  await db.customerNote.create({ data: { customerId: userId, authorId: session.user.id, body: body.trim() } });
  revalidatePath(`/admin/customers/${userId}`);
}

const customerDetailsSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
});

/** Personal-detail edits are permission-controlled (spec §15) — Super Admin and Customer Care
 * Manager only, not plain Customer Care staff. */
export async function updateCustomerDetails(userId: string, raw: z.infer<typeof customerDetailsSchema>) {
  await requireRole(CUSTOMER_CARE_MANAGER_ROLES);
  const input = customerDetailsSchema.parse(raw);
  await db.user.update({
    where: { id: userId },
    data: {
      name: input.name || undefined,
      phone: input.phone || null,
      dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
      gender: input.gender || null,
    },
  });
  revalidatePath(`/admin/customers/${userId}`);
}

const addressSchema = z.object({
  fullName: z.string().min(1),
  phone: z.string().min(1),
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().min(1),
});

/** Upserts the customer's default address — same permission tier as updateCustomerDetails. */
export async function updateCustomerAddress(userId: string, addressId: string | null, raw: z.infer<typeof addressSchema>) {
  await requireRole(CUSTOMER_CARE_MANAGER_ROLES);
  const input = addressSchema.parse(raw);
  if (addressId) {
    await db.address.update({ where: { id: addressId }, data: input });
  } else {
    await db.address.create({ data: { ...input, userId, isDefault: true } });
  }
  revalidatePath(`/admin/customers/${userId}`);
}

/** Any staff member can tag a customer — matches the pattern for the free-text notes above. */
export async function updateCustomerTags(userId: string, tags: string[]) {
  await requireStaff();
  await db.user.update({ where: { id: userId }, data: { tags } });
  revalidatePath(`/admin/customers/${userId}`);
  revalidatePath("/admin/customers");
}
