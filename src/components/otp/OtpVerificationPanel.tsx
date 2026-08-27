"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PhoneInput } from "@/components/checkout/PhoneInput";

type Purpose = "PHONE_VERIFY" | "COD_RISK_CONFIRM";
type Step = "enter-phone" | "enter-code" | "verified";

const OTP_LENGTH = 6;

const PURPOSE_COPY: Record<Purpose, { title: string; sentPrefix: string }> = {
  PHONE_VERIFY: { title: "Verify Your Mobile Number", sentPrefix: "We've sent a code to" },
  COD_RISK_CONFIRM: { title: "Confirm Your COD Order", sentPrefix: "We've sent a confirmation code to" },
};

export function OtpVerificationPanel({
  purpose,
  initialPhone = "",
  initialCountryCode = "IN",
  skipPhoneEntry = false,
  onVerified,
  onCancel,
}: {
  purpose: Purpose;
  initialPhone?: string;
  initialCountryCode?: string;
  /** When true (checkout already collected+validated the phone), skip straight to sending a code. */
  skipPhoneEntry?: boolean;
  onVerified: (phone: string) => void;
  onCancel?: () => void;
}) {
  const [step, setStep] = useState<Step>("enter-phone");
  const [countryCode, setCountryCode] = useState(initialCountryCode);
  const [national, setNational] = useState("");
  const [e164, setE164] = useState<string | null>(initialPhone || null);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [devCode, setDevCode] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const autoSentRef = useRef(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  async function requestOtp(phone: string) {
    setSending(true);
    const res = await fetch("/api/auth/phone/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, purpose }),
    });
    const data = await res.json();
    setSending(false);

    if (!res.ok) {
      toast.error(data.error ?? "Couldn't send a verification code.");
      return false;
    }

    setCooldown(data.cooldownSeconds ?? 45);
    setDevCode(data.devCode ?? null);
    setStep("enter-code");
    setDigits(Array(OTP_LENGTH).fill(""));
    setTimeout(() => inputRefs.current[0]?.focus(), 50);
    return true;
  }

  useEffect(() => {
    if (skipPhoneEntry && initialPhone && !autoSentRef.current) {
      autoSentRef.current = true;
      requestOtp(initialPhone);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skipPhoneEntry, initialPhone]);

  async function handleSendOtp() {
    if (!e164) {
      toast.error("Enter a valid mobile number.");
      return;
    }
    await requestOtp(e164);
  }

  async function submitCode(code: string) {
    if (!e164 || code.length !== OTP_LENGTH) return;
    setVerifying(true);
    const res = await fetch("/api/auth/phone/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: e164, purpose, code }),
    });
    const data = await res.json();
    setVerifying(false);

    if (!res.ok) {
      toast.error(data.error ?? "Incorrect code.");
      setDigits(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
      return;
    }

    setStep("verified");
    onVerified(e164);
  }

  function handleDigitChange(index: number, raw: string) {
    const value = raw.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = value;
    setDigits(next);

    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    const code = next.join("");
    if (code.length === OTP_LENGTH) submitCode(code);
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    e.preventDefault();
    const next = Array(OTP_LENGTH).fill("");
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setDigits(next);
    if (pasted.length === OTP_LENGTH) submitCode(pasted);
    else inputRefs.current[pasted.length]?.focus();
  }

  if (step === "verified") {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success text-paper">
          <Check size={24} />
        </div>
        <p className="text-sm font-medium">
          {purpose === "PHONE_VERIFY" ? "✓ Mobile Number Verified" : "✓ Order Confirmed"}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-5 sm:p-6">
      <h2 className="font-display text-lg sm:text-xl">{PURPOSE_COPY[purpose].title}</h2>

      {step === "enter-phone" && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-ink-soft">Enter your mobile number to receive a one-time verification code.</p>
          <PhoneInput
            countryCode={countryCode}
            onCountryCodeChange={setCountryCode}
            value={national}
            onChange={(formatted, resolvedE164) => {
              setNational(formatted);
              setE164(resolvedE164);
            }}
          />
          <Button type="button" onClick={handleSendOtp} disabled={sending || !e164} className="w-full justify-center">
            {sending ? "Sending..." : "Send Verification Code"}
          </Button>
        </div>
      )}

      {step === "enter-code" && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-ink-soft">
            {PURPOSE_COPY[purpose].sentPrefix} <span className="font-medium text-ink">{e164}</span>.
          </p>
          {devCode && (
            <p className="border border-dashed border-line bg-paper-dim px-3 py-2 text-xs text-ink-soft">
              Dev mode (no SMS provider configured): your code is{" "}
              <span className="font-mono font-medium text-ink">{devCode}</span>.
            </p>
          )}
          <div className="flex justify-between gap-2">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputRefs.current[i] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                disabled={verifying}
                onChange={(e) => handleDigitChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={handlePaste}
                className="h-12 w-full min-w-0 border border-line text-center text-lg font-medium outline-none focus:border-ink"
                aria-label={`Digit ${i + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-ink-soft">
            <button
              type="button"
              onClick={() => e164 && requestOtp(e164)}
              disabled={cooldown > 0 || sending}
              className="font-medium uppercase tracking-[0.08em] underline underline-offset-2 disabled:no-underline disabled:opacity-50"
            >
              {cooldown > 0 ? `Resend Code (${cooldown}s)` : "Resend Code"}
            </button>
            {!skipPhoneEntry && (
              <button
                type="button"
                onClick={() => {
                  setStep("enter-phone");
                  setDigits(Array(OTP_LENGTH).fill(""));
                }}
                className="font-medium uppercase tracking-[0.08em] underline underline-offset-2"
              >
                Change Number
              </button>
            )}
          </div>

          {verifying && <p className="text-center text-xs text-ink-soft">Verifying...</p>}
        </div>
      )}

      {onCancel && (
        <button type="button" onClick={onCancel} className="text-center text-xs text-ink-soft underline underline-offset-2">
          Cancel
        </button>
      )}
    </div>
  );
}
