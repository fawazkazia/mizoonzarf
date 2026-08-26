import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

/**
 * Route-group-local 404 — takes precedence over the root app/not-found.tsx for any
 * notFound() thrown within (storefront) pages. The root one wraps itself in
 * StorefrontChrome (needed for genuinely unmatched top-level URLs, which have no other
 * layout); this segment already has StorefrontChrome from (storefront)/layout.tsx, so
 * without this file a not found deep in the storefront (e.g. an order that isn't yours)
 * would render the header/footer/bottom nav twice.
 */
export default function StorefrontNotFound() {
  return (
    <Container className="flex flex-col items-center gap-4 py-32 text-center">
      <p className="font-display text-8xl">404</p>
      <h1 className="font-display text-3xl">Page Not Found</h1>
      <p className="text-ink-soft">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
      <ButtonLink href="/">Back to Home</ButtonLink>
    </Container>
  );
}
