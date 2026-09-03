"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/permissions/require-permission";
import { logStaffActivity } from "@/lib/permissions/log-activity";
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
  const session = await requirePermission("accounting.createTransactions");
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
  await logStaffActivity({ actorId: session.user.id, action: "PURCHASE_ORDER_CREATED", module: "accounting", entityType: "PurchaseOrder", entityId: po.id, after: { poNumber } });
  revalidatePOPaths();
  return { id: po.id };
}

export async function sendPurchaseOrder(id: string) {
  const session = await requirePermission("accounting.editTransactions");
  const po = await db.purchaseOrder.findUniqueOrThrow({ where: { id } });
  if (po.status !== "DRAFT") throw new Error("Only draft purchase orders can be sent.");
  await db.purchaseOrder.update({ where: { id }, data: { status: "SENT", sentAt: new Date() } });
  await logStaffActivity({ actorId: session.user.id, action: "PURCHASE_ORDER_SENT", module: "accounting", entityType: "PurchaseOrder", entityId: id, before: { status: po.status }, after: { status: "SENT" } });
  revalidatePOPaths(id);
}

export async function approvePurchaseOrder(id: string) {
  const session = await requirePermission("accounting.editTransactions");
  const po = await db.purchaseOrder.findUniqueOrThrow({ where: { id } });
  if (po.status !== "SENT") throw new Error("Only sent purchase orders can be approved.");
  await db.purchaseOrder.update({ where: { id }, data: { status: "APPROVED", approvedAt: new Date() } });
  await logStaffActivity({ actorId: session.user.id, action: "PURCHASE_ORDER_APPROVED", module: "accounting", entityType: "PurchaseOrder", entityId: id, before: { status: po.status }, after: { status: "APPROVED" } });
  revalidatePOPaths(id);
}

export async function cancelPurchaseOrder(id: string) {
  const session = await requirePermission("accounting.editTransactions");
  const po = await db.purchaseOrder.findUniqueOrThrow({ where: { id } });
  if (po.status === "RECEIVED" || po.status === "CLOSED" || po.status === "CANCELLED") {
    throw new Error("This purchase order can no longer be cancelled.");
  }
  await db.purchaseOrder.update({ where: { id }, data: { status: "CANCELLED" } });
  await logStaffActivity({ actorId: session.user.id, action: "PURCHASE_ORDER_CANCELLED", module: "accounting", entityType: "PurchaseOrder", entityId: id, before: { status: po.status }, after: { status: "CANCELLED" } });
  revalidatePOPaths(id);
}

export async function closePurchaseOrder(id: string) {
  const session = await requirePermission("accounting.editTransactions");
  const po = await db.purchaseOrder.findUniqueOrThrow({ where: { id } });
  if (po.status !== "RECEIVED") throw new Error("Only fully-received purchase orders can be closed.");
  await db.purchaseOrder.update({ where: { id }, data: { status: "CLOSED", closedAt: new Date() } });
  await logStaffActivity({ actorId: session.user.id, action: "PURCHASE_ORDER_CLOSED", module: "accounting", entityType: "PurchaseOrder", entityId: id, before: { status: po.status }, after: { status: "CLOSED" } });
  revalidatePOPaths(id);
}
