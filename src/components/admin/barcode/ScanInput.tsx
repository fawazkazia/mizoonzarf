"use client";

import { useState } from "react";
import { ScanLine, Camera } from "lucide-react";
import { Input } from "@/components/admin/FormField";
import { Button } from "@/components/ui/Button";
import { CameraScanner } from "./CameraScanner";

/**
 * A USB/Bluetooth barcode scanner behaves exactly like a keyboard: it types the
 * code into whatever's focused and finishes with Enter. So an auto-focused text
 * input that submits on Enter is all hardware scanning needs — no keystroke-timing
 * tricks required. This also doubles as the manual-entry field, and offers the
 * camera modal for devices with no hardware scanner attached.
 */
export function ScanInput({
  onScan,
  placeholder = "Scan or type a barcode, then press Enter",
  autoFocus = true,
}: {
  onScan: (code: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const [value, setValue] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);

  function submit() {
    const trimmed = value.trim();
    if (!trimmed) return;
    onScan(trimmed);
    setValue("");
  }

  return (
    <div className="flex gap-2">
      <Input
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        }}
        placeholder={placeholder}
        className="flex-1"
        autoComplete="off"
      />
      <Button type="button" variant="secondary" onClick={submit}>
        <ScanLine size={16} />
      </Button>
      <Button type="button" variant="outline" onClick={() => setCameraOpen(true)} title="Scan with camera">
        <Camera size={16} />
      </Button>
      <CameraScanner
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onDetect={(code) => {
          setCameraOpen(false);
          onScan(code);
        }}
      />
    </div>
  );
}
