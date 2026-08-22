import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { StorefrontChrome } from "@/components/StorefrontChrome";

export default function NotFound() {
  return (
    <StorefrontChrome>
      <Container className="flex flex-col items-center gap-4 py-32 text-center">
        <p className="font-display text-8xl">404</p>
        <h1 className="font-display text-3xl">Page Not Found</h1>
        <p className="text-ink-soft">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
        <ButtonLink href="/">Back to Home</ButtonLink>
      </Container>
    </StorefrontChrome>
  );
}
