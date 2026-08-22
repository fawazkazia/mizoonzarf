"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Img } from "@/components/ui/ArtImage";
import { useCartStore } from "@/stores/cart-store";
import { useSettings } from "@/components/SettingsContext";

interface SavedAddress {
  id: string;
  label: string | null;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string | null;
  country: string;
  postalCode: string | null;
  isDefault: boolean;
}

interface PaymentMethodOption {
  id: string;
  label: string;
  configured: boolean;
}

export function CheckoutClient({
  isSignedIn,
  userEmail,
  addresses,
  paymentMethods,
}: {
  isSignedIn: boolean;
  userEmail: string;
  addresses: SavedAddress[];
  paymentMethods: PaymentMethodOption[];
}) {
  const cart = useCartStore();
  const settings = useSettings();
  const router = useRouter();

  const [email, setEmail] = useState(userEmail);
  const [selectedAddressId, setSelectedAddressId] = useState<string>(addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? "new");
  const [saveAddress, setSaveAddress] = useState(true);
  const [address, setAddress] = useState({ fullName: "", phone: "", line1: "", line2: "", city: "", state: "", country: "AE", postalCode: "" });
  const [deliveryMethod, setDeliveryMethod] = useState<"standard" | "express">("standard");
  const [paymentMethod, setPaymentMethod] = useState(paymentMethods.find((p) => p.configured)?.id ?? "COD");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const usingSaved = selectedAddressId !== "new" && addresses.length > 0;
  const selectedSaved = addresses.find((a) => a.id === selectedAddressId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const finalAddress = usingSaved && selectedSaved
      ? { fullName: selectedSaved.fullName, phone: selectedSaved.phone, line1: selectedSaved.line1, line2: selectedSaved.line2 ?? undefined, city: selectedSaved.city, state: selectedSaved.state ?? undefined, country: selectedSaved.country, postalCode: selectedSaved.postalCode ?? undefined }
      : { ...address, line2: address.line2 || undefined, state: address.state || undefined, postalCode: address.postalCode || undefined };

    setLoading(true);
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        phone: finalAddress.phone,
        address: finalAddress,
        saveAddress: !usingSaved && saveAddress && isSignedIn,
        deliveryMethod,
        paymentMethod,
        notes: notes || undefined,
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      toast.error(data.error ?? "Something went wrong placing your order.");
      return;
    }

    await cart.fetchCart();
    router.push(`/checkout/confirmation/${data.orderNumber}`);
  }

  if (cart.hasFetched && cart.lines.length === 0) {
    return (
      <Container className="py-32 text-center">
        <h1 className="font-display text-3xl">Your bag is empty</h1>
        <p className="mt-2 text-ink-soft">Add something to your bag before checking out.</p>
      </Container>
    );
  }

  return (
    <Container className="py-12">
      <h1 className="mb-10 font-display text-3xl">Checkout</h1>
      <form onSubmit={handleSubmit} className="grid gap-12 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-10">
          <section>
            <h2 className="mb-4 text-sm font-medium uppercase tracking-[0.1em]">1. Contact Information</h2>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full border border-line px-4 py-3 text-sm"
            />
            {!isSignedIn && (
              <p className="mt-2 text-xs text-ink-soft">
                Have an account? <a href="/login" className="underline">Sign in</a> for faster checkout.
              </p>
            )}
          </section>

          <section>
            <h2 className="mb-4 text-sm font-medium uppercase tracking-[0.1em]">2. Delivery Address</h2>
            {addresses.length > 0 && (
              <div className="mb-4 flex flex-col gap-2">
                {addresses.map((a) => (
                  <label key={a.id} className={`flex cursor-pointer gap-3 border p-3 text-sm ${selectedAddressId === a.id ? "border-ink" : "border-line"}`}>
                    <input type="radio" checked={selectedAddressId === a.id} onChange={() => setSelectedAddressId(a.id)} className="mt-1" />
                    <span>
                      <span className="font-medium">{a.fullName}</span> — {a.line1}, {a.city}, {a.country}
                      <br />
                      <span className="text-ink-soft">{a.phone}</span>
                    </span>
                  </label>
                ))}
                <label className={`flex cursor-pointer gap-3 border p-3 text-sm ${selectedAddressId === "new" ? "border-ink" : "border-line"}`}>
                  <input type="radio" checked={selectedAddressId === "new"} onChange={() => setSelectedAddressId("new")} className="mt-1" />
                  Use a new address
                </label>
              </div>
            )}

            {(!usingSaved || addresses.length === 0) && (
              <div className="grid gap-3 sm:grid-cols-2">
                <input required placeholder="Full name" value={address.fullName} onChange={(e) => setAddress({ ...address, fullName: e.target.value })} className="border border-line px-4 py-3 text-sm sm:col-span-2" />
                <input required placeholder="Phone number" value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} className="border border-line px-4 py-3 text-sm sm:col-span-2" />
                <input required placeholder="Street address" value={address.line1} onChange={(e) => setAddress({ ...address, line1: e.target.value })} className="border border-line px-4 py-3 text-sm sm:col-span-2" />
                <input placeholder="Apartment, suite, etc. (optional)" value={address.line2} onChange={(e) => setAddress({ ...address, line2: e.target.value })} className="border border-line px-4 py-3 text-sm sm:col-span-2" />
                <input required placeholder="City" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} className="border border-line px-4 py-3 text-sm" />
                <input placeholder="Emirate / State" value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} className="border border-line px-4 py-3 text-sm" />
                <input placeholder="Postal code (optional)" value={address.postalCode} onChange={(e) => setAddress({ ...address, postalCode: e.target.value })} className="border border-line px-4 py-3 text-sm" />
                <select value={address.country} onChange={(e) => setAddress({ ...address, country: e.target.value })} className="border border-line px-4 py-3 text-sm">
                  <option value="AE">United Arab Emirates</option>
                  <option value="SA">Saudi Arabia</option>
                  <option value="QA">Qatar</option>
                  <option value="KW">Kuwait</option>
                  <option value="BH">Bahrain</option>
                  <option value="OM">Oman</option>
                </select>
                {isSignedIn && (
                  <label className="flex items-center gap-2 text-sm sm:col-span-2">
                    <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} />
                    Save this address to my account
                  </label>
                )}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-4 text-sm font-medium uppercase tracking-[0.1em]">3. Delivery Method</h2>
            <div className="flex flex-col gap-2">
              <label className={`flex cursor-pointer justify-between border p-3 text-sm ${deliveryMethod === "standard" ? "border-ink" : "border-line"}`}>
                <span className="flex items-center gap-3">
                  <input type="radio" checked={deliveryMethod === "standard"} onChange={() => setDeliveryMethod("standard")} />
                  Standard Delivery — {settings.shipping.standardDays}
                </span>
                <span>
                  {cart.subtotal >= settings.shipping.freeShippingThreshold ? "Free" : `${settings.currencySymbol} ${settings.shipping.standardFee}`}
                </span>
              </label>
              <label className={`flex cursor-pointer justify-between border p-3 text-sm ${deliveryMethod === "express" ? "border-ink" : "border-line"}`}>
                <span className="flex items-center gap-3">
                  <input type="radio" checked={deliveryMethod === "express"} onChange={() => setDeliveryMethod("express")} />
                  Express Delivery — {settings.shipping.expressDays}
                </span>
                <span>{settings.currencySymbol} {settings.shipping.expressFee}</span>
              </label>
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-sm font-medium uppercase tracking-[0.1em]">4. Payment</h2>
            <div className="flex flex-col gap-2">
              {paymentMethods.map((pm) => (
                <label
                  key={pm.id}
                  className={`flex cursor-pointer items-center justify-between border p-3 text-sm ${
                    !pm.configured ? "cursor-not-allowed opacity-40" : paymentMethod === pm.id ? "border-ink" : "border-line"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <input type="radio" disabled={!pm.configured} checked={paymentMethod === pm.id} onChange={() => setPaymentMethod(pm.id)} />
                    {pm.label}
                  </span>
                  {!pm.configured && <span className="text-xs uppercase tracking-wide">Coming Soon</span>}
                </label>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-sm font-medium uppercase tracking-[0.1em]">Order Notes (Optional)</h2>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full border border-line px-4 py-3 text-sm" placeholder="Delivery instructions, gift note, etc." />
          </section>
        </div>

        <div className="h-fit border border-line p-6">
          <h2 className="mb-5 font-display text-xl">Order Summary</h2>
          <ul className="mb-5 flex flex-col gap-4">
            {cart.lines.map((line) => (
              <li key={line.id} className="flex gap-3">
                <div className="relative h-16 w-14 shrink-0 bg-paper-dim">
                  <Img src={line.image} alt={line.productName} seedFallback={line.variantId} />
                  <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[10px] text-paper">
                    {line.quantity}
                  </span>
                </div>
                <div className="flex-1 text-sm">
                  <p className="line-clamp-1">{line.productName}</p>
                  <p className="text-ink-soft">{[line.size, line.color].filter(Boolean).join(" / ")}</p>
                </div>
                <span className="text-sm">{settings.currencySymbol} {((line.salePrice ?? line.price) * line.quantity).toFixed(2)}</span>
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-2 border-t border-line pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-soft">Subtotal</span>
              <span>{settings.currencySymbol} {cart.subtotal.toFixed(2)}</span>
            </div>
            {cart.discountAmount > 0 && (
              <div className="flex justify-between text-success">
                <span>Discount</span>
                <span>-{settings.currencySymbol} {cart.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-ink-soft">Shipping</span>
              <span>{deliveryMethod === "standard" && cart.freeShippingApplied ? "Free" : `${settings.currencySymbol} ${(deliveryMethod === "express" ? settings.shipping.expressFee : cart.shippingFee).toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-soft">VAT ({settings.taxPercent}%)</span>
              <span>{settings.currencySymbol} {cart.taxAmount.toFixed(2)}</span>
            </div>
            <div className="mt-2 flex justify-between border-t border-line pt-3 text-base font-medium">
              <span>Total</span>
              <span>{settings.currencySymbol} {cart.total.toFixed(2)}</span>
            </div>
          </div>
          <Button type="submit" size="lg" disabled={loading} className="mt-6 w-full">
            {loading ? "Placing Order..." : "Place Order"}
          </Button>
        </div>
      </form>
    </Container>
  );
}
