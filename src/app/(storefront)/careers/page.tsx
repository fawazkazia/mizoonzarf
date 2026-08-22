import { getSettings } from "@/lib/settings";
import { Container } from "@/components/ui/Container";

export const metadata = { title: "Careers" };

export default async function CareersPage() {
  const settings = await getSettings();

  return (
    <Container className="mx-auto max-w-2xl py-16 text-center text-ink-soft">
      <h1 className="font-display text-4xl text-ink">Careers</h1>
      <p className="mt-6">
        We're always looking for passionate people to join {settings.brandName}. Send your resume to{" "}
        <a href={`mailto:${settings.supportEmail}`} className="underline text-ink">
          {settings.supportEmail}
        </a>{" "}
        and tell us what excites you about fashion retail.
      </p>
    </Container>
  );
}
