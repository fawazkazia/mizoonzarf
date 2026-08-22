import { getSettings } from "@/lib/settings";
import { Container } from "@/components/ui/Container";

export const metadata = { title: "Privacy Policy" };

export default async function PrivacyPage() {
  const settings = await getSettings();

  return (
    <Container className="mx-auto max-w-2xl py-16 text-ink-soft">
      <h1 className="font-display text-4xl text-ink">Privacy Policy</h1>
      <div className="mt-8 flex flex-col gap-5 text-sm leading-relaxed">
        <p>
          {settings.brandName} collects the information you provide when creating an account, placing an order, or
          contacting us — including your name, email, phone number, and delivery address — solely to process orders,
          provide customer support, and improve your shopping experience.
        </p>
        <p>We never sell your personal information. Payment details are processed by our payment partners and are never stored on our servers.</p>
        <p>
          You can request access to, correction of, or deletion of your personal data at any time by contacting{" "}
          {settings.supportEmail}.
        </p>
      </div>
    </Container>
  );
}
