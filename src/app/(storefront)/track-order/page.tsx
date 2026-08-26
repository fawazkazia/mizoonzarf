import type { Metadata } from "next";
import { Suspense } from "react";
import { Container } from "@/components/ui/Container";
import { TrackOrderClient } from "./TrackOrderClient";

export const metadata: Metadata = { title: "Track Your Order" };

export default function TrackOrderPage() {
  return (
    <Container className="mx-auto max-w-3xl py-12">
      <h1 className="font-display text-2xl">Track Your Order</h1>
      <p className="mt-2 text-sm text-ink-soft">Enter your order number and the email you used at checkout to see its status.</p>
      <div className="mt-8">
        <Suspense fallback={null}>
          <TrackOrderClient />
        </Suspense>
      </div>
    </Container>
  );
}
