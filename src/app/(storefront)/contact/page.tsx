import { getSettings } from "@/lib/settings";
import { Container } from "@/components/ui/Container";
import { ContactForm } from "./ContactForm";

export const metadata = { title: "Contact Us" };

export default async function ContactPage() {
  const settings = await getSettings();

  return (
    <Container className="grid gap-12 py-16 lg:grid-cols-2">
      <div>
        <h1 className="font-display text-4xl">Contact Us</h1>
        <p className="mt-4 max-w-md text-ink-soft">We'd love to hear from you. Reach out with any questions about products, orders, or your account.</p>
        <div className="mt-8 flex flex-col gap-3 text-sm">
          <p>
            <strong>Email:</strong> {settings.supportEmail}
          </p>
          <p>
            <strong>WhatsApp:</strong> +{settings.whatsappNumber}
          </p>
          <p>
            <strong>Address:</strong> {settings.footer.contactAddress}
          </p>
        </div>
      </div>
      <ContactForm />
    </Container>
  );
}
