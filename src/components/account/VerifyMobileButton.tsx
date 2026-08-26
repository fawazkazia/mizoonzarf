"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { OtpVerificationModal } from "@/components/otp/OtpVerificationModal";

export function VerifyMobileButton({ phone, verified }: { phone: string | null; verified: boolean }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  if (verified) return null;

  return (
    <>
      <Button type="button" size="sm" variant="secondary" onClick={() => setOpen(true)} className="mt-2">
        Verify Mobile Number
      </Button>
      <OtpVerificationModal
        open={open}
        onClose={() => setOpen(false)}
        purpose="PHONE_VERIFY"
        phone={phone ?? undefined}
        onVerified={() => router.refresh()}
      />
    </>
  );
}
