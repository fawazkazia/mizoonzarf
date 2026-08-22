"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container className="flex flex-col items-center gap-4 py-32 text-center">
      <p className="font-display text-6xl">Oops</p>
      <h1 className="font-display text-3xl">Something Went Wrong</h1>
      <p className="text-ink-soft">We hit an unexpected error. Please try again.</p>
      <Button onClick={reset}>Try Again</Button>
    </Container>
  );
}
