import { getSettings } from "@/lib/settings";
import { Container } from "@/components/ui/Container";

export const metadata = { title: "Returns & Exchanges" };

export default async function ReturnsPage() {
  const settings = await getSettings();
  const paragraphs = settings.legal.returnPolicy.split("\n\n").filter(Boolean);

  return (
    <Container className="mx-auto max-w-2xl py-16 text-ink-soft">
      <h1 className="font-display text-4xl text-ink">Returns & Exchanges</h1>
      <div className="mt-8 flex flex-col gap-5 text-sm leading-relaxed">
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </Container>
  );
}
