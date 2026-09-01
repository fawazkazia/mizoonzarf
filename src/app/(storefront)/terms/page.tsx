import { getSettings } from "@/lib/settings";
import { Container } from "@/components/ui/Container";

export const metadata = { title: "Terms of Service" };

export default async function TermsPage() {
  const settings = await getSettings();
  const paragraphs = settings.legal.termsAndConditions.split("\n\n").filter(Boolean);

  return (
    <Container className="mx-auto max-w-2xl py-16 text-ink-soft">
      <h1 className="font-display text-4xl text-ink">Terms of Service</h1>
      <div className="mt-8 flex flex-col gap-5 text-sm leading-relaxed">
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </Container>
  );
}
