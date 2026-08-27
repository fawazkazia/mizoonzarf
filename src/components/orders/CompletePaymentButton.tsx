"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Lock, Loader2 } from "lucide-react";

interface RazorpayHandlerResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

let razorpayScriptPromise: Promise<void> | null = null;

function loadRazorpayScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  if (razorpayScriptPromise) return razorpayScriptPromise;

  razorpayScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => {
      razorpayScriptPromise = null;
      reject(new Error("Failed to load Razorpay checkout script."));
    };
    document.body.appendChild(script);
  });
  return razorpayScriptPromise;
}

/** Re-runs payment for an order that's already placed but never got paid — closed
 * popup, declined card, etc. Reuses the existing order rather than creating a new one. */
export function CompletePaymentButton({ orderId, orderNumber, gradient }: { orderId: string; orderNumber: string; gradient: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleClick() {
    setLoading(true);
    const res = await fetch(`/api/orders/${orderId}/retry-payment`, { method: "POST" });
    const data = await res.json();

    if (!res.ok) {
      setLoading(false);
      toast.error(data.error ?? "Couldn't start payment. Please try again.");
      return;
    }

    if (data.redirectUrl) {
      window.location.href = data.redirectUrl;
      return;
    }

    if (data.clientAction?.type === "razorpay_checkout") {
      try {
        await loadRazorpayScript();
      } catch {
        setLoading(false);
        toast.error("Couldn't load the payment window. Please try again.");
        return;
      }

      const action = data.clientAction;
      const rzp = new window.Razorpay({
        key: action.keyId,
        amount: action.amount,
        currency: action.currency,
        name: action.name,
        description: `Order ${orderNumber}`,
        order_id: action.razorpayOrderId,
        handler: async (response: RazorpayHandlerResponse) => {
          const verifyRes = await fetch("/api/checkout/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId, ...response }),
          });
          const verifyData = await verifyRes.json();
          setLoading(false);
          if (verifyData.ok) {
            toast.success("Payment successful!");
            router.refresh();
          } else {
            toast.error("We couldn't confirm your payment. If you were charged, contact support with your order number.");
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            toast.error("Payment cancelled.");
          },
        },
      });
      rzp.open();
      return;
    }

    setLoading(false);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full px-6 text-sm font-medium uppercase tracking-[0.08em] text-paper transition-transform duration-[var(--dur-1)] hover:brightness-105 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-70 sm:w-auto"
      style={{ backgroundImage: gradient }}
    >
      {loading ? <Loader2 size={15} className="animate-spin" /> : <Lock size={14} />}
      {loading ? "Processing..." : "Complete Payment"}
    </button>
  );
}
