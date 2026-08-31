"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/admin-auth";
import { FINANCE_ROLES } from "@/lib/admin-permissions";
import { purchaseOrderInputSchema, type PurchaseOrderInput } from "@/lib/validation/admin-finance";

function revalidatePOPaths(id?: string) {
  revalidatePath("/admin/purchase-orders");
  if (id) revalidatePath(`/admin/purchase-orders/${id}`);
}

async function nextPoNumber(): Promise<string> {
  const count = await db.purchaseOrder.count();
  return `PO-${String(count + 1).padStart(6, "0")}`;
}

export async function createPurchaseOrder(raw: PurchaseOrderInput) {
  await requireRole(FINANCE_ROLES);
  const input = purchaseOrderInputSchema.parse(raw);

  const poNumber = await nextPoNumber();
  const po = await db.purchaseOrder.create({
    data: {
      poNumber,
      supplierId: input.supplierId,
      warehouseId: input.warehouseId,
      notes: input.notes || null,
      expectedAt: input.expectedAt ? new Date(input.expectedAt) : null,
      status: "DRAFT",
      items: {
        create: input.items.map((item) => ({
          variantId: item.variantId,
          quantityOrdered: item.quantityOrdered,
          unitCost: item.unitCost,
        })),
      },
    },
  });
  revalidatePOPaths();
  return { id: po.id };
}

export async function sendPurchaseOrder(id: string) {
  await requireRole(FINANCE_ROLES);
  const po = await db.purchaseOrder.findUniqueOrThrow({ where: { id } });
  if (po.status !== "DRAFT") throw new Error("Only draft purchase orders can be sent.");
  await db.purchaseOrder.update({ where: { id }, data: { status: "SENT", sentAt: new Date() } });
  revalidatePOPaths(id);
}

export async function approvePurchaseOrder(id: string) {
  await requireRole(FINANCE_ROLES);
  const po = await db.purchaseOrder.findUniqueOrThrow({ where: { id } });
  if (po.status !== "SENT") throw new Error("Only sent purchase orders can be approved.");
  await db.purchaseOrder.update({ where: { id }, data: { status: "APPROVED", approvedAt: new Date() } });
  revalidatePOPaths(id);
}

export async function cancelPurchaseOrder(id: string) {
  await requireRole(FINANCE_ROLES);
  const po = await db.purchaseOrder.findUniqueOrThrow({ where: { id } });
  if (po.status === "RECEIVED" || po.status === "CLOSED" || po.status === "CANCELLED") {
    throw new Error("This purchase order can no longer be cancelled.");
  }
  await db.purchaseOrder.update({ where: { id }, data: { status: "CANCELLED" } });
  revalidatePOPaths(id);
}

export async function closePurchaseOrder(id: string) {
  await requireRole(FINANCE_ROLES);
  const po = await db.purchaseOrder.findUniqueOrThrow({ where: { id } });
  if (po.status !== "RECEIVED") throw new Error("Only fully-received purchase orders can be closed.");
  await db.purchaseOrder.update({ where: { id }, data: { status: "CLOSED", closedAt: new Date() } });
  revalidatePOPaths(id);
}
