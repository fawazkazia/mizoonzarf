"use client";

import { Modal } from "@/components/ui/Modal";
import { OtpVerificationPanel } from "./OtpVerificationPanel";

export function OtpVerificationModal({
  open,
  onClose,
  purpose,
  phone,
  skipPhoneEntry = false,
  onVerified,
}: {
  open: boolean;
  onClose: () => void;
  purpose: "PHONE_VERIFY" | "COD_RISK_CONFIRM";
  phone?: string;
  skipPhoneEntry?: boolean;
  onVerified: (phone: string) => void;
}) {
  return (
    <Modal open={open} onClose={onClose} ariaLabel="Mobile number verification" panelClassName="max-w-md">
      <OtpVerificationPanel
        purpose={purpose}
        initialPhone={phone}
        skipPhoneEntry={skipPhoneEntry}
        onVerified={(phone) => {
          onVerified(phone);
          setTimeout(onClose, 900);
        }}
        onCancel={onClose}
      />
    </Modal>
  );
}
