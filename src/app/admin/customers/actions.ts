"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { requirePermission } from "@/lib/permissions/require-permission";
import { logStaffActivity } from "@/lib/permissions/log-activity";
import type { ReliabilityStatus } from "@/generated/prisma/client";

export async function updateCustomerNotes(userId: string, notes: string) {
  await requireSuperAdmin();
  await db.user.update({ where: { id: userId }, data: { notes: notes || null } });
  revalidatePath(`/admin/customers/${userId}`);
}

export async function updateReliabilityOverride(userId: string, override: ReliabilityStatus | null, note: string) {
  const session = await requirePermission("customers.edit");
  await db.user.update({
    where: { id: userId },
    data: {
      reliabilityOverride: override,
      reliabilityOverrideNote: note || null,
      reliabilityOverrideBy: override ? session.user.id : null,
      reliabilityOverrideAt: override ? new Date() : null,
    },
  });
  await logStaffActivity({ actorId: session.user.id, action: "CUSTOMER_RELIABILITY_OVERRIDDEN", module: "customers", entityType: "User", entityId: userId, after: { override, note } });
  revalidatePath(`/admin/customers/${userId}`);
  revalidatePath("/admin/customers");
}

/** Timestamped, append-only — never edits or removes a prior entry. A base Customer Care
 * Employee capability, gated on "customers.edit" — see the note on CUSTOMER_SUPPORT's default
 * permission set in src/lib/permissions/legacy-role-map.ts for why that role still has it. */
export async function addCustomerNote(userId: string, body: string) {
  const session = await requirePermission("customers.edit");
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

/** Personal-detail edits are permission-controlled (spec §15) — gated on the granular
 * "customers.edit" permission (Staff & Roles module) rather than a hardcoded role list, so a
 * custom role can be given exactly this capability. Every account that previously qualified via
 * CUSTOMER_CARE_MANAGER_ROLES (Super Admin, Customer Support Manager) already has this
 * permission through its bridged system StaffRole — see src/lib/permissions/legacy-role-map.ts. */
export async function updateCustomerDetails(userId: string, raw: z.infer<typeof customerDetailsSchema>) {
  const session = await requirePermission("customers.edit");
  const input = customerDetailsSchema.parse(raw);

  const before = await db.user.findUnique({
    where: { id: userId },
    select: { name: true, phone: true, dateOfBirth: true, gender: true },
  });

  const after = await db.user.update({
    where: { id: userId },
    data: {
      name: input.name || undefined,
      phone: input.phone || null,
      dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
      gender: input.gender || null,
    },
    select: { name: true, phone: true, dateOfBirth: true, gender: true },
  });

  await logStaffActivity({
    actorId: session.user.id,
    action: "CUSTOMER_DETAILS_EDITED",
    module: "customers",
    entityType: "User",
    entityId: userId,
    before,
    after,
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
  const session = await requirePermission("customers.edit");
  const input = addressSchema.parse(raw);

  const before = addressId ? await db.address.findUnique({ where: { id: addressId } }) : null;
  if (addressId) {
    await db.address.update({ where: { id: addressId }, data: input });
  } else {
    await db.address.create({ data: { ...input, userId, isDefault: true } });
  }

  await logStaffActivity({
    actorId: session.user.id,
    action: "CUSTOMER_ADDRESS_EDITED",
    module: "customers",
    entityType: "User",
    entityId: userId,
    before,
    after: input,
  });

  revalidatePath(`/admin/customers/${userId}`);
}

/** Same "customers.edit" tier as the free-text notes above. */
export async function updateCustomerTags(userId: string, tags: string[]) {
  const session = await requirePermission("customers.edit");
  await db.user.update({ where: { id: userId }, data: { tags } });
  await logStaffActivity({ actorId: session.user.id, action: "CUSTOMER_TAGS_UPDATED", module: "customers", entityType: "User", entityId: userId, after: { tags } });
  revalidatePath(`/admin/customers/${userId}`);
  revalidatePath("/admin/customers");
}
