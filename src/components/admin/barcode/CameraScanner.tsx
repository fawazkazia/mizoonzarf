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

function playBeep() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "square";
    oscillator.frequency.value = 1800;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.15);
    oscillator.onended = () => ctx.close();
  } catch {
    // Audio isn't critical to scanning — ignore if unsupported/blocked.
  }
}

export function CameraScanner({ open, onClose, onDetect }: { open: boolean; onClose: () => void; onDetect: (code: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    const reader = new BrowserMultiFormatReader(hints);
    let cancelled = false;
    let detected = false;

    reader
      .decodeFromVideoDevice(undefined, videoRef.current ?? undefined, (result) => {
        if (result && !cancelled && !detected) {
          detected = true;
          playBeep();
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
          <div className="relative aspect-square w-full overflow-hidden bg-ink/90">
            <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="relative h-2/3 w-2/3">
                <span className="absolute -left-px -top-px h-6 w-6 border-l-2 border-t-2 border-white/90" />
                <span className="absolute -right-px -top-px h-6 w-6 border-r-2 border-t-2 border-white/90" />
                <span className="absolute -bottom-px -left-px h-6 w-6 border-b-2 border-l-2 border-white/90" />
                <span className="absolute -bottom-px -right-px h-6 w-6 border-b-2 border-r-2 border-white/90" />
                <span className="absolute left-0 right-0 h-0.5 -translate-y-1/2 animate-scan-line bg-sale/90 shadow-[0_0_6px_1px_rgba(255,0,0,0.6)]" />
              </div>
            </div>
          </div>
        )}
        <p className="mt-3 text-center text-xs text-ink-soft">Point the camera at a Code 128, EAN-13, UPC-A, or QR barcode.</p>
      </div>
    </Modal>
  );
}
