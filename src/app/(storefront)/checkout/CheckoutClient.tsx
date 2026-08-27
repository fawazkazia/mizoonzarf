"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2, Minus, Plus, X, ChevronRight, Gift, ShieldCheck, BadgeCheck, Lock, Tag, Loader2, User, Truck } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Img } from "@/components/ui/ArtImage";
import { Price } from "@/components/ui/Price";
import { ScrollRail } from "@/components/ui/ScrollRail";
import { useCartStore } from "@/stores/cart-store";
import { useSettings } from "@/components/SettingsContext";
import { formatINR } from "@/lib/currency";
import { estimatePointsEarned } from "@/lib/loyalty";
import type { ActiveOffer } from "@/lib/data/offers";
import { AddressForm, type AddressFormValue } from "@/components/checkout/AddressForm";
import { AddressLabelPicker } from "@/components/checkout/AddressLabelPicker";
import { PaymentMethodSelector } from "@/components/checkout/PaymentMethodSelector";
import { CheckoutStepper, type CheckoutStepId } from "@/components/checkout/CheckoutStepper";
import { OtpVerificationModal } from "@/components/otp/OtpVerificationModal";
import {
  EMPTY_ADDRESS_FORM,
  fromSavedAddress,
  toSubmitAddress,
  validateAddress,
  focusFirstInvalidField,
} from "@/lib/validation/address-client";

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

/** Loaded on demand, only for shoppers who actually reach the Razorpay branch. */
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

/** Approximates a concrete ETA from the free-text "3-5 business days" style
 * settings copy — takes the leading number as the day count. Computed in UTC
 * so the server (SSR) and client (hydration) always agree regardless of each
 * one's local timezone — using local-timezone getters here previously caused
 * a hydration mismatch whenever the server's TZ and the visitor's browser TZ
 * disagreed on what "today" is. */
function estimateDeliveryDate(daysLabel: string, processingDays: number): Date {
  const match = daysLabel.match(/\d+/);
  const days = match ? parseInt(match[0], 10) : 3;
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + processingDays + days);
  return date;
}

function formatDeliveryDate(date: Date): string {
  const day = date.getUTCDate();
  const month = date.toLocaleString("en-IN", { month: "short", timeZone: "UTC" });
  const weekday = date.toLocaleString("en-IN", { weekday: "short", timeZone: "UTC" });
  return `${day} ${month}, ${weekday}`;
}

function formatOfferDiscount(offer: ActiveOffer): string {
  switch (offer.discountType) {
    case "PERCENTAGE":
      return `${offer.discountValue}% OFF`;
    case "FIXED":
      return `${formatINR(offer.discountValue)} OFF`;
    case "FREE_SHIPPING":
      return "FREE SHIPPING";
    case "BUY_X_GET_Y":
      return "SPECIAL OFFER";
    default:
      return "OFFER";
  }
}

function OfferCard({ offer, onApply }: { offer: ActiveOffer; onApply?: (code: string) => void }) {
  return (
    <div className="flex w-40 shrink-0 snap-start flex-col justify-between gap-3 border border-line p-3">
      <div>
        <Badge tone="gold" className="normal-case">
          {formatOfferDiscount(offer)}
        </Badge>
        <p className="mt-2 line-clamp-2 text-sm font-medium">{offer.title}</p>
        {offer.description && <p className="mt-1 line-clamp-2 text-xs text-ink-soft">{offer.description}</p>}
      </div>
      {offer.kind === "coupon" && onApply && (
        <button type="button" onClick={() => onApply(offer.code)} className="text-left text-xs font-medium uppercase tracking-[0.08em] underline underline-offset-2">
          Apply
        </button>
      )}
    </div>
  );
}

export function CheckoutClient({
  isSignedIn,
  userEmail,
  addresses,
  paymentMethods,
  offers,
  accountVerifiedPhone,
}: {
  isSignedIn: boolean;
  userEmail: string;
  addresses: SavedAddress[];
  paymentMethods: PaymentMethodOption[];
  offers: ActiveOffer[];
  accountVerifiedPhone: string | null;
}) {
  const cart = useCartStore();
  const settings = useSettings();
  const router = useRouter();

  const [email, setEmail] = useState(userEmail);
  const [savedAddresses, setSavedAddresses] = useState(addresses);
  const [selectedAddressId, setSelectedAddressId] = useState<string>(addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? "new");
  const [editingSavedId, setEditingSavedId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<AddressFormValue>(EMPTY_ADDRESS_FORM);
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [addressExpanded, setAddressExpanded] = useState(addresses.length === 0);

  const [saveAddress, setSaveAddress] = useState(true);
  const [addressLabel, setAddressLabel] = useState("");
  const [address, setAddress] = useState<AddressFormValue>(EMPTY_ADDRESS_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [deliveryMethod, setDeliveryMethod] = useState<"standard" | "express">("standard");
  const [paymentMethod, setPaymentMethod] = useState(
    paymentMethods.find((p) => p.configured && p.id !== "COD")?.id ?? paymentMethods.find((p) => p.configured)?.id ?? "COD"
  );
  const [notes, setNotes] = useState("");
  const [gstin, setGstin] = useState("");
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  const [promoExpanded, setPromoExpanded] = useState(false);
  const [promoCode, setPromoCode] = useState("");

  const [sessionVerifiedPhone, setSessionVerifiedPhone] = useState<string | null>(accountVerifiedPhone);
  const [otpModal, setOtpModal] = useState<{ open: boolean; purpose: "PHONE_VERIFY" | "COD_RISK_CONFIRM"; phone?: string }>({
    open: false,
    purpose: "PHONE_VERIFY",
  });

  const usingSaved = selectedAddressId !== "new" && savedAddresses.length > 0;
  const selectedSaved = savedAddresses.find((a) => a.id === selectedAddressId);
  const currentPhone = usingSaved && selectedSaved ? selectedSaved.phone : (address.phoneE164 ?? null);
  const phoneVerified = Boolean(currentPhone) && currentPhone === sessionVerifiedPhone;
  const addressSummary =
    usingSaved && selectedSaved
      ? { name: selectedSaved.fullName, phone: selectedSaved.phone, line1: selectedSaved.line1, city: selectedSaved.city, country: selectedSaved.country }
      : address.firstName && address.line1
        ? { name: `${address.firstName} ${address.lastName}`.trim(), phone: address.phoneNational, line1: address.line1, city: address.city, country: address.country }
        : null;

  // Display-only estimate of CGST+SGST vs IGST, using whichever address is
  // currently selected/entered — the server recomputes this authoritatively
  // (with the exact same rule) from the submitted address at order creation.
  const shippingStateForTax = (usingSaved ? selectedSaved?.state : address.state) ?? "";
  const isIntraStateShipment = Boolean(
    shippingStateForTax && settings.gst.sellerState && shippingStateForTax.trim().toUpperCase() === settings.gst.sellerState.trim().toUpperCase()
  );

  const deliveryDays = deliveryMethod === "express" ? settings.shipping.expressDays : settings.shipping.standardDays;
  const deliveryEstimate = formatDeliveryDate(estimateDeliveryDate(deliveryDays, settings.shipping.processingDays));
  const pointsEstimate = estimatePointsEarned(cart.total);
  const couponOffers = offers.filter((o) => o.kind === "coupon");

  // Reuse the site's own peach -> mauve -> maroon brand gradient (admin-configurable
  // via Settings > Promo Banners) so the checkout accent always matches the header banner.
  const brand = settings.promoStrips.brandsBanner;
  const gradient = `linear-gradient(90deg, ${brand.gradientFrom}, ${brand.gradientVia}, ${brand.gradientTo})`;
  const accent = brand.gradientVia;
  const currentStep: CheckoutStepId = orderPlaced ? "confirm" : addressSummary && !addressExpanded ? "payment" : "address";

  async function refreshSavedAddresses() {
    const res = await fetch("/api/addresses");
    const data = await res.json();
    setSavedAddresses(data.addresses);
    return data.addresses as SavedAddress[];
  }

  function startEdit(a: SavedAddress) {
    setEditingSavedId(a.id);
    setEditValue(fromSavedAddress(a));
    setEditErrors({});
  }

  async function saveEdit() {
    const fieldErrors = validateAddress(editValue);
    if (Object.keys(fieldErrors).length > 0) {
      setEditErrors(fieldErrors);
      focusFirstInvalidField(fieldErrors);
      return;
    }

    setSavingEdit(true);
    const res = await fetch("/api/addresses", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editingSavedId, ...toSubmitAddress(editValue) }),
    });
    setSavingEdit(false);

    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error ?? "Couldn't save your changes.");
      return;
    }
    toast.success("Address updated.");
    setEditingSavedId(null);
    await refreshSavedAddresses();
  }

  async function deleteSaved(id: string) {
    await fetch(`/api/addresses?id=${id}`, { method: "DELETE" });
    const remaining = await refreshSavedAddresses();
    if (selectedAddressId === id) {
      setSelectedAddressId(remaining.find((a) => a.isDefault)?.id ?? remaining[0]?.id ?? "new");
    }
  }

  async function setDefaultSaved(id: string) {
    await fetch("/api/addresses", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isDefault: true }),
    });
    await refreshSavedAddresses();
  }

  async function applyPromo() {
    if (!promoCode.trim()) return;
    await cart.applyCoupon(promoCode.trim());
  }

  async function applyOfferCode(code: string) {
    setPromoCode(code);
    await cart.applyCoupon(code);
  }

  const lastFinalAddressRef = useRef<(ReturnType<typeof toSubmitAddress> & { label?: string }) | null>(null);

  function buildFinalAddress(): (ReturnType<typeof toSubmitAddress> & { label?: string }) | null {
    if (usingSaved && selectedSaved) {
      return {
        fullName: selectedSaved.fullName,
        phone: selectedSaved.phone,
        line1: selectedSaved.line1,
        line2: selectedSaved.line2 ?? undefined,
        city: selectedSaved.city,
        state: selectedSaved.state ?? undefined,
        country: selectedSaved.country,
        postalCode: selectedSaved.postalCode ?? undefined,
      };
    }
    const fieldErrors = validateAddress(address);
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      focusFirstInvalidField(fieldErrors);
      setAddressExpanded(true);
      return null;
    }
    return { ...toSubmitAddress(address), label: saveAddress ? addressLabel || undefined : undefined };
  }

  async function submitOrder(finalAddress: ReturnType<typeof toSubmitAddress> & { label?: string }) {
    lastFinalAddressRef.current = finalAddress;
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
        gstin: gstin || undefined,
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      setLoading(false);
      if (data.code === "PHONE_NOT_VERIFIED" || data.code === "COD_CONFIRM_REQUIRED") {
        setOtpModal({
          open: true,
          purpose: data.code === "COD_CONFIRM_REQUIRED" ? "COD_RISK_CONFIRM" : "PHONE_VERIFY",
          phone: finalAddress.phone,
        });
        return;
      }
      toast.error(data.error ?? "Something went wrong placing your order.");
      return;
    }

    setOrderPlaced(true);
    await cart.fetchCart();

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
        description: `Order ${action.orderNumber}`,
        order_id: action.razorpayOrderId,
        handler: async (response: RazorpayHandlerResponse) => {
          const verifyRes = await fetch("/api/checkout/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: data.orderId, ...response }),
          });
          const verifyData = await verifyRes.json();
          setLoading(false);
          if (!verifyData.ok) {
            toast.error("We couldn't confirm your payment. If you were charged, contact support with your order number.");
          }
          // Either way the order already exists and the cart is already cleared — send them
          // to the order page rather than back to a checkout screen with nothing left in it.
          router.push(`/checkout/confirmation/${data.orderNumber}`);
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            toast.error("Payment cancelled. Your order has been saved — you can complete payment from your order page.");
            router.push(`/checkout/confirmation/${data.orderNumber}`);
          },
        },
      });
      rzp.open();
      return;
    }

    setLoading(false);
    router.push(`/checkout/confirmation/${data.orderNumber}`);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (editingSavedId) {
      toast.error("Please save or cancel your address changes first.");
      return;
    }

    const finalAddress = buildFinalAddress();
    if (!finalAddress) return;
    await submitOrder(finalAddress);
  }

  if (cart.hasFetched && cart.lines.length === 0 && !orderPlaced) {
    return (
      <Container className="py-32 text-center">
        <h1 className="font-display text-3xl">Your bag is empty</h1>
        <p className="mt-2 text-ink-soft">Add something to your bag before checking out.</p>
      </Container>
    );
  }

  // Once an order is placed the cart is cleared server-side, whether or not payment
  // ultimately succeeds — every completion path (success, cancel, failure) redirects
  // away from here, so this only ever appears for the instant before that navigation lands.
  if (orderPlaced && cart.lines.length === 0) {
    return (
      <Container className="py-32 text-center">
        <h1 className="font-display text-3xl">Taking you to your order...</h1>
      </Container>
    );
  }

  return (
    <Container className="py-5 sm:py-7">
      <div className="mx-auto max-w-[1080px]">
        <h1 className="mb-4 font-display text-xl sm:mb-5 sm:text-2xl">Checkout</h1>
        <CheckoutStepper current={currentStep} gradient={gradient} accent={accent} />
        <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-[1fr_360px] lg:items-start lg:gap-6">
          <div className="flex min-w-0 flex-col gap-4">
            <section className="rounded-xl border border-line p-4 sm:p-5">
              <h2 className="mb-3 text-sm font-semibold sm:text-base">Contact Information</h2>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="min-h-[44px] w-full rounded-lg border border-line px-4 py-2.5 text-sm"
              />
              {!isSignedIn && (
                <p className="mt-2 text-xs text-ink-soft">
                  Have an account? <Link href="/login" className="underline">Sign in</Link> for faster checkout.
                </p>
              )}
            </section>

            <section className="rounded-xl border border-line p-4 sm:p-5">
              <h2 className="mb-3 text-sm font-semibold sm:text-base">Delivery Address</h2>

              {!addressExpanded && addressSummary && (
                <div className="text-sm">
                  <div className="flex items-start gap-2.5">
                    <User size={16} className="mt-0.5 shrink-0 text-ink-mute" strokeWidth={1.75} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                        <span className="font-medium">{addressSummary.name}</span>
                        <span className="text-ink-soft">{addressSummary.phone}</span>
                      </div>
                      <p className="mt-0.5 text-ink-soft">
                        {addressSummary.line1}, {addressSummary.city}, {addressSummary.country}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setAddressExpanded(true)}
                      className="text-xs font-medium underline underline-offset-2"
                      style={{ color: accent }}
                    >
                      Change
                    </button>
                  </div>
                </div>
              )}

              {!addressExpanded && !addressSummary && (
                <button
                  type="button"
                  onClick={() => setAddressExpanded(true)}
                  className="flex w-full items-center justify-between rounded-lg border border-dashed border-line-strong px-4 py-3 text-left text-sm text-ink-soft"
                >
                  Add a delivery address to see available delivery options
                  <ChevronRight size={16} />
                </button>
              )}

              {addressExpanded && (
                <>
                  {savedAddresses.length > 0 && (
                    <div className="mb-4 flex flex-col gap-2">
                      {savedAddresses.map((a) =>
                        editingSavedId === a.id ? (
                          <div key={a.id} className="rounded-lg border border-ink p-4">
                            <AddressForm value={editValue} onChange={(patch) => setEditValue((prev) => ({ ...prev, ...patch }))} errors={editErrors} showSearch={false} />
                            <div className="mt-4 flex gap-3">
                              <Button type="button" size="sm" disabled={savingEdit} onClick={saveEdit}>
                                {savingEdit ? "Saving..." : "Save Changes"}
                              </Button>
                              <Button type="button" size="sm" variant="secondary" onClick={() => setEditingSavedId(null)}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div
                            key={a.id}
                            className="rounded-lg border p-3 text-sm"
                            style={{ borderColor: selectedAddressId === a.id ? accent : "var(--color-line)" }}
                          >
                            <label className="flex cursor-pointer gap-3">
                              <input type="radio" checked={selectedAddressId === a.id} onChange={() => setSelectedAddressId(a.id)} className="mt-1" />
                              <span className="flex-1">
                                <span className="flex flex-wrap items-center gap-2">
                                  <span className="font-medium">{a.fullName}</span>
                                  {a.label && <Badge tone="outline" className="normal-case">{a.label}</Badge>}
                                  {a.isDefault && <span className="text-[10px] uppercase tracking-wide text-gold">Default</span>}
                                </span>
                                {a.line1}, {a.city}, {a.country}
                                <br />
                                <span className="text-ink-soft">{a.phone}</span>
                              </span>
                            </label>
                            <div className="mt-2 flex items-center gap-4 pl-7">
                              {!a.isDefault && (
                                <button type="button" onClick={() => setDefaultSaved(a.id)} className="text-xs text-ink-soft hover:text-ink">
                                  Set Default
                                </button>
                              )}
                              <button type="button" onClick={() => startEdit(a)} className="flex items-center gap-1 text-xs text-ink-soft hover:text-ink">
                                <Pencil size={12} /> Edit
                              </button>
                              <button type="button" onClick={() => deleteSaved(a.id)} className="flex items-center gap-1 text-xs text-sale">
                                <Trash2 size={12} /> Delete
                              </button>
                            </div>
                          </div>
                        )
                      )}
                      <label
                        className="flex cursor-pointer gap-3 rounded-lg border p-3 text-sm"
                        style={{ borderColor: selectedAddressId === "new" ? accent : "var(--color-line)" }}
                      >
                        <input type="radio" checked={selectedAddressId === "new"} onChange={() => setSelectedAddressId("new")} className="mt-1" />
                        Use a new address
                      </label>
                    </div>
                  )}

                  {(!usingSaved || savedAddresses.length === 0) && (
                    <div className="flex flex-col gap-4">
                      <AddressForm value={address} onChange={(patch) => setAddress((prev) => ({ ...prev, ...patch }))} errors={errors} />
                      {isSignedIn && (
                        <div className="flex flex-col gap-3">
                          <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} />
                            Save this address for future orders
                          </label>
                          {saveAddress && <AddressLabelPicker value={addressLabel} onChange={setAddressLabel} />}
                        </div>
                      )}
                    </div>
                  )}

                  {addressSummary && (
                    <Button type="button" size="sm" variant="secondary" className="mt-4" onClick={() => setAddressExpanded(false)}>
                      Done
                    </Button>
                  )}
                </>
              )}
            </section>

            <section className="rounded-xl border border-line p-4 sm:p-5">
              <div className="mb-2.5 flex items-baseline justify-between">
                <h2 className="text-sm font-semibold sm:text-base">Your Items</h2>
                <span className="text-xs text-ink-soft">{cart.lines.length} item(s)</span>
              </div>
              <ul className="flex flex-col divide-y divide-line">
                {cart.lines.map((line) => (
                  <li key={line.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-paper-dim">
                      <Img src={line.image} alt={line.productName} seedFallback={line.variantId} />
                    </div>
                    <div className="flex flex-1 flex-col gap-1.5">
                      <p className="text-sm font-medium">{line.productName}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {line.color && <Badge tone="outline" className="normal-case">Color: {line.color}</Badge>}
                        {line.size && <Badge tone="outline" className="normal-case">Size: {line.size}</Badge>}
                      </div>
                      <Price price={line.salePrice ?? line.price} compareAt={line.salePrice ? line.price : null} size="sm" />
                      <div className="mt-1 flex items-center justify-between">
                        <div className="flex items-center rounded-lg border border-line">
                          <button
                            type="button"
                            className="px-2.5 py-1"
                            onClick={() => (line.quantity <= 1 ? cart.removeItem(line.id) : cart.updateItem(line.id, line.quantity - 1))}
                            aria-label="Decrease quantity"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-7 text-center text-sm">{line.quantity}</span>
                          <button
                            type="button"
                            className="px-2.5 py-1"
                            onClick={() => cart.updateItem(line.id, line.quantity + 1)}
                            disabled={line.quantity >= line.stock}
                            aria-label="Increase quantity"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        <button type="button" onClick={() => cart.removeItem(line.id)} aria-label="Remove item" className="text-ink-soft hover:text-sale">
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-xs">
                <span className="text-ink-soft">Get by {deliveryEstimate}</span>
                <span>{deliveryMethod === "standard" && cart.freeShippingApplied ? "Free" : formatINR(deliveryMethod === "express" ? settings.shipping.expressFee : cart.shippingFee)}</span>
              </div>
            </section>

            <section className="rounded-xl border border-line p-4 sm:p-5">
              <h2 className="mb-3 text-sm font-semibold sm:text-base">Shipping Method</h2>
              <div className="flex flex-col gap-2">
                <label
                  className="flex cursor-pointer justify-between rounded-lg border p-3 text-sm"
                  style={{ borderColor: deliveryMethod === "standard" ? accent : "var(--color-line)" }}
                >
                  <span className="flex items-center gap-3">
                    <input type="radio" checked={deliveryMethod === "standard"} onChange={() => setDeliveryMethod("standard")} />
                    <Truck size={17} strokeWidth={1.6} className="text-ink-soft" />
                    <span>
                      <span className="block font-medium">Standard Delivery</span>
                      <span className="block text-xs text-ink-soft">{settings.shipping.standardDays}</span>
                    </span>
                  </span>
                  <span className="font-medium text-success">
                    {cart.subtotal >= settings.shipping.freeShippingThreshold ? "Free" : formatINR(settings.shipping.standardFee)}
                  </span>
                </label>
                <label
                  className="flex cursor-pointer justify-between rounded-lg border p-3 text-sm"
                  style={{ borderColor: deliveryMethod === "express" ? accent : "var(--color-line)" }}
                >
                  <span className="flex items-center gap-3">
                    <input type="radio" checked={deliveryMethod === "express"} onChange={() => setDeliveryMethod("express")} />
                    <Truck size={17} strokeWidth={1.6} className="text-ink-soft" />
                    <span>
                      <span className="block font-medium">Express Delivery</span>
                      <span className="block text-xs text-ink-soft">{settings.shipping.expressDays}</span>
                    </span>
                  </span>
                  <span className="font-medium">{formatINR(settings.shipping.expressFee)}</span>
                </label>
              </div>
            </section>

            <PaymentMethodSelector methods={paymentMethods} value={paymentMethod} onChange={setPaymentMethod} accent={accent} />

            <section className="rounded-xl border border-line p-4 sm:p-5">
              <h2 className="mb-3 text-sm font-semibold sm:text-base">Delivery Instructions (Optional)</h2>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-line px-4 py-2.5 text-sm"
                placeholder="Gate code, landmark, preferred delivery time, etc."
              />
              <div className="mt-3">
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.08em] text-ink-soft">
                  GSTIN <span className="normal-case text-ink-mute">(optional, for business purchases)</span>
                </label>
                <input
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  maxLength={15}
                  placeholder="15-character GSTIN"
                  className="min-h-[44px] w-full rounded-lg border border-line px-4 py-2.5 text-sm uppercase"
                />
              </div>
            </section>

            <div className="grid grid-cols-3 gap-2 pt-1 text-center text-[11px] text-ink-soft">
              <div className="flex flex-col items-center gap-1.5">
                <Lock size={16} strokeWidth={1.5} />
                Secure Checkout
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <BadgeCheck size={16} strokeWidth={1.5} />
                100% Safe Payments
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <ShieldCheck size={16} strokeWidth={1.5} />
                Your data is protected
              </div>
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-3.5 lg:sticky lg:top-24">
            {!isSignedIn && (
              <div className="rounded-xl border border-gold-soft bg-paper-dim p-3.5 text-sm">
                <p>Sign in to save this address and track your order, or continue as a guest.</p>
                <Link href="/login" className="mt-1 inline-block font-medium text-gold-deep underline underline-offset-2">
                  Sign in or Create Account
                </Link>
              </div>
            )}

            <div className="rounded-xl border border-line p-4 sm:p-5">
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="text-base font-semibold sm:text-lg">Order Summary</h2>
                <Link href="/cart" className="text-xs font-medium underline underline-offset-2" style={{ color: accent }}>
                  Edit Cart
                </Link>
              </div>

              {isSignedIn && pointsEstimate > 0 && (
                <div className="mb-3 flex items-center gap-2 rounded-lg bg-paper-dim px-3 py-2 text-xs">
                  <Gift size={14} className="shrink-0 text-gold" />
                  This purchase will earn you {pointsEstimate} points
                </div>
              )}

              <ul className="mb-3 flex flex-col gap-2.5">
                {cart.lines.map((line) => (
                  <li key={line.id} className="flex gap-3">
                    <div className="relative h-14 w-12 shrink-0 overflow-hidden rounded-lg bg-paper-dim">
                      <Img src={line.image} alt={line.productName} seedFallback={line.variantId} />
                      <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[10px] text-paper">
                        {line.quantity}
                      </span>
                    </div>
                    <div className="flex-1 text-sm">
                      <p className="line-clamp-1">{line.productName}</p>
                      <p className="text-ink-soft">{[line.size, line.color].filter(Boolean).join(" / ")}</p>
                    </div>
                    <span className="text-sm">{formatINR((line.salePrice ?? line.price) * line.quantity)}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-col gap-2 border-t border-line pt-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-ink-soft">Subtotal</span>
                  <span>{formatINR(cart.subtotal)}</span>
                </div>
                {cart.discountAmount > 0 && (
                  <div className="flex justify-between text-success">
                    <span>Discount{cart.couponCode ? ` (${cart.couponCode})` : ""}</span>
                    <span>-{formatINR(cart.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-ink-soft">Shipping</span>
                  <span>{deliveryMethod === "standard" && cart.freeShippingApplied ? "Free" : formatINR(deliveryMethod === "express" ? settings.shipping.expressFee : cart.shippingFee)}</span>
                </div>
                {isIntraStateShipment ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-ink-soft">CGST</span>
                      <span>{formatINR(cart.taxAmount / 2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ink-soft">SGST</span>
                      <span>{formatINR(cart.taxAmount / 2)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between">
                    <span className="text-ink-soft">IGST</span>
                    <span>{formatINR(cart.taxAmount)}</span>
                  </div>
                )}
                <div className="mt-1.5 flex items-center justify-between rounded-lg bg-paper-dim px-3 py-2.5 text-base font-semibold">
                  <span>Total</span>
                  <span>{formatINR(cart.total)}</span>
                </div>
                <p className="-mt-1 text-right text-[11px] text-ink-mute">(Inclusive of all taxes)</p>
              </div>

              {cart.discountAmount > 0 && (
                <div
                  className="mt-3 flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-medium"
                  style={{ backgroundColor: `${brand.gradientFrom}1a`, color: brand.gradientTo }}
                >
                  <Tag size={13} className="shrink-0" />
                  You saved {formatINR(cart.discountAmount)} on this order
                </div>
              )}

              {currentPhone && !phoneVerified && paymentMethod === "COD" && (
                <div className="mt-4 flex flex-col gap-2 rounded-lg border border-gold-soft bg-paper-dim p-3 text-xs sm:flex-row sm:items-center sm:justify-between">
                  <span>Verify your mobile number to place your order.</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => setOtpModal({ open: true, purpose: "PHONE_VERIFY", phone: currentPhone })}
                    className="shrink-0"
                  >
                    Verify Mobile Number
                  </Button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-4 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-medium uppercase tracking-[0.1em] text-paper transition-transform duration-[var(--dur-1)] hover:brightness-105 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-70"
                style={{ backgroundImage: gradient }}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Processing Order...
                  </>
                ) : (
                  <>
                    <Lock size={14} />
                    Place Order
                  </>
                )}
              </button>

              <p className="mt-3 text-center text-[11px] text-ink-mute">
                By placing your order, you agree to our{" "}
                <Link href="/terms" className="underline underline-offset-2" style={{ color: accent }}>
                  Terms &amp; Conditions
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="underline underline-offset-2" style={{ color: accent }}>
                  Privacy Policy
                </Link>
                .
              </p>
            </div>

            <OtpVerificationModal
              open={otpModal.open}
              onClose={() => setOtpModal((prev) => ({ ...prev, open: false }))}
              purpose={otpModal.purpose}
              phone={otpModal.phone}
              skipPhoneEntry={Boolean(otpModal.phone)}
              onVerified={(verifiedPhone) => {
                setSessionVerifiedPhone(verifiedPhone);
                if (lastFinalAddressRef.current) submitOrder(lastFinalAddressRef.current);
              }}
            />

            <div className="rounded-xl border border-line p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold sm:text-base">Promo Code</h2>
                <button type="button" onClick={() => setPromoExpanded((v) => !v)} className="text-xs font-medium uppercase tracking-[0.08em] underline underline-offset-2">
                  View all
                </button>
              </div>

              {cart.couponCode && (
                <div className="mt-3 flex items-center justify-between rounded-lg bg-paper-dim px-3 py-2 text-sm">
                  <span>
                    Coupon <strong>{cart.couponCode}</strong> applied
                  </span>
                  <button type="button" onClick={() => cart.removeCoupon()} className="text-ink-soft hover:text-ink">
                    <X size={14} />
                  </button>
                </div>
              )}
              {cart.couponError && <p className="mt-2 text-xs text-sale">{cart.couponError}</p>}

              {promoExpanded && (
                <div className="mt-3 flex flex-col gap-3">
                  <div className="flex gap-2">
                    <input
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          applyPromo();
                        }
                      }}
                      placeholder="Enter coupon code"
                      className="w-full rounded-lg border border-line px-3 py-2 text-sm uppercase"
                    />
                    <Button type="button" size="sm" variant="secondary" onClick={applyPromo}>
                      Apply
                    </Button>
                  </div>
                  {couponOffers.length > 0 && (
                    <ul className="flex flex-col gap-2">
                      {couponOffers.map((offer) => (
                        <li key={offer.code} className="flex items-center justify-between rounded-lg border border-line px-3 py-2 text-sm">
                          <span>
                            <strong>{offer.code}</strong> — {formatOfferDiscount(offer)}
                          </span>
                          <button type="button" onClick={() => applyOfferCode(offer.code)} className="text-xs font-medium uppercase tracking-[0.08em] underline underline-offset-2">
                            Apply
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {offers.length > 0 && (
              <div className="rounded-xl border border-line p-4 sm:p-5">
                <h2 className="mb-3 text-sm font-semibold sm:text-base">Offers For You</h2>
                <ScrollRail showArrows={false} trackClassName="pb-1">
                  {offers.map((offer) => (
                    <OfferCard key={offer.kind === "coupon" ? offer.code : offer.id} offer={offer} onApply={applyOfferCode} />
                  ))}
                </ScrollRail>
              </div>
            )}
          </div>
        </form>
      </div>
    </Container>
  );
}
