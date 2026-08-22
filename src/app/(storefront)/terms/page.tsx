import { getSettings } from "@/lib/settings";
import { Container } from "@/components/ui/Container";

export const metadata = { title: "Terms of Service" };

export default async function TermsPage() {
  const settings = await getSettings();

  return (
    <Container className="mx-auto max-w-2xl py-16 text-ink-soft">
      <h1 className="font-display text-4xl text-ink">Terms of Service</h1>
      <div className="mt-8 flex flex-col gap-5 text-sm leading-relaxed">
        <p>By using the {settings.brandName} website, you agree to these terms. Prices are shown in {settings.currency} and are inclusive/exclusive of VAT as noted at checkout.</p>
        <p>We reserve the right to cancel orders in cases of pricing errors, suspected fraud, or stock unavailability — you'll be notified and refunded in full.</p>
        <p>All content on this site, including product images, text, and branding, is the property of {settings.brandName} and may not be reproduced without permission.</p>
      </div>
    </Container>
  );
}
