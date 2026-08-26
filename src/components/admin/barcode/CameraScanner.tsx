"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, IScannerControls } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";
import { X } from "lucide-react";
import { Modal } from "@/components/ui/Modal";

const hints = new Map();
hints.set(DecodeHintType.POSSIBLE_FORMATS, [
  BarcodeFormat.CODE_128,
  BarcodeFormat.EAN_13,
  BarcodeFormat.UPC_A,
  BarcodeFormat.QR_CODE,
]);

export function CameraScanner({ open, onClose, onDetect }: { open: boolean; onClose: () => void; onDetect: (code: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    const reader = new BrowserMultiFormatReader(hints);
    let cancelled = false;

    reader
      .decodeFromVideoDevice(undefined, videoRef.current ?? undefined, (result) => {
        if (result && !cancelled) {
          onDetect(result.getText());
        }
      })
      .then((controls) => {
        if (cancelled) controls.stop();
        else controlsRef.current = controls;
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't access the camera. Check permissions, or use the input field to scan/type instead.");
      });

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [open, onDetect]);

  return (
    <Modal open={open} onClose={onClose} ariaLabel="Scan barcode with camera" panelClassName="max-w-md">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <h2 className="font-display text-lg">Scan Barcode</h2>
        <button onClick={onClose} aria-label="Close" className="text-ink-soft hover:text-ink">
          <X size={18} />
        </button>
      </div>
      <div className="p-5">
        {error ? (
          <p className="py-8 text-center text-sm text-sale">{error}</p>
        ) : (
          <video ref={videoRef} className="aspect-square w-full bg-ink/90 object-cover" muted playsInline />
        )}
        <p className="mt-3 text-center text-xs text-ink-soft">Point the camera at a Code 128, EAN-13, UPC-A, or QR barcode.</p>
      </div>
    </Modal>
  );
}
