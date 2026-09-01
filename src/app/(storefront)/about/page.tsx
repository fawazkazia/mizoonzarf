import { getSettings } from "@/lib/settings";
import { Container } from "@/components/ui/Container";
import { Img } from "@/components/ui/ArtImage";

export const metadata = { title: "About Us" };

export default async function AboutPage() {
  const settings = await getSettings();

  return (
    <div>
      <div className="relative h-[40vh] min-h-[280px] overflow-hidden bg-ink">
        <Img src={null} alt={settings.brandName} seedFallback="about-hero" className="brightness-[0.65]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <h1 className="font-display text-4xl text-paper sm:text-5xl">Our Story</h1>
        </div>
      </div>
      <Container className="mx-auto max-w-2xl py-16 text-ink-soft">
        <p className="text-lg leading-relaxed">{settings.footer.about}</p>
        {settings.legal.aboutStory
          .split("\n\n")
          .filter(Boolean)
          .map((p, i) => (
            <p key={i} className="mt-6 leading-relaxed">
              {p}
            </p>
          ))}
      </Container>
    </div>
  );
}
