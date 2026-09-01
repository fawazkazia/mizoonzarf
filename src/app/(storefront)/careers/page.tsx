import { getSettings } from "@/lib/settings";
import { Container } from "@/components/ui/Container";

export const metadata = { title: "Careers" };

export default async function CareersPage() {
  const settings = await getSettings();

  return (
    <Container className="mx-auto max-w-2xl py-16 text-center text-ink-soft">
      <h1 className="font-display text-4xl text-ink">Careers</h1>
      {settings.legal.careersInfo
        .split("\n\n")
        .filter(Boolean)
        .map((p, i) => (
          <p key={i} className="mt-6">
            {p}
          </p>
        ))}
      <p className="mt-6">
        Send your resume to{" "}
        <a href={`mailto:${settings.supportEmail}`} className="underline text-ink">
          {settings.supportEmail}
        </a>
        .
      </p>
    </Container>
  );
}
