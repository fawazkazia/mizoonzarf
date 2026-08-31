"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/admin/FormField";
import { Button } from "@/components/ui/Button";
import { recordSupplierPayment } from "./payment-actions";

export function RecordPaymentForm({ invoiceId, outstanding }: { invoiceId: string; outstanding: number }) {
  const router = useRouter();
  const [amount, setAmount] = useState(String(outstanding));
  const [loading, setLoading] = useState(false);

  async function handlePay() {
    const value = Number(amount);
    if (!value || value <= 0) {
      toast.error("Enter an amount greater than zero.");
      return;
    }
    setLoading(true);
    try {
      await recordSupplierPayment(invoiceId, value);
      toast.success("Payment recorded.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't record payment.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <Input type="number" step="0.01" min={0.01} max={outstanding} value={amount} onChange={(e) => setAmount(e.target.value)} className="w-24 !py-1.5" />
      <Button size="sm" disabled={loading} onClick={handlePay}>
        Pay
      </Button>
    </div>
  );
}
