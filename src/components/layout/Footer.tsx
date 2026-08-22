import Link from "next/link";
import { InstagramIcon, FacebookIcon, XIcon } from "@/components/ui/SocialIcons";
import { Container } from "@/components/ui/Container";
import { getSettings } from "@/lib/settings";
import { getMenuCategories } from "@/lib/data/categories";
import { buildNavItems } from "@/lib/nav";
import { NewsletterForm } from "@/components/home/Newsletter";

export async function Footer() {
  const [settings, categories] = await Promise.all([getSettings(), getMenuCategories()]);
  const shopLinks = buildNavItems(categories).map((item) => ({ label: item.name, href: item.href }));

  const columns = [
    { title: "Shop", links: shopLinks },
    {
      title: "Help",
      links: [
        { label: "Contact Us", href: "/contact" },
        { label: "Track Order", href: "/account/orders" },
        { label: "Shipping Info", href: "/shipping" },
        { label: "Returns", href: "/returns" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About Us", href: "/about" },
        { label: "Careers", href: "/careers" },
        { label: "Privacy Policy", href: "/privacy" },
        { label: "Terms of Service", href: "/terms" },
      ],
    },
  ];

  return (
    <footer className="border-t border-line bg-ink text-paper">
      <Container className="grid gap-12 py-16 lg:grid-cols-[1.4fr_repeat(3,1fr)_1.2fr]">
        <div>
          <p className="font-display text-2xl">{settings.brandName}</p>
          <p className="mt-4 max-w-xs text-sm text-paper/60">{settings.footer.about}</p>
          <div className="mt-6 flex gap-4">
            <a href={settings.socialLinks.instagram} aria-label="Instagram" className="text-paper/70 hover:text-paper">
              <InstagramIcon size={18} />
            </a>
            <a href={settings.socialLinks.facebook} aria-label="Facebook" className="text-paper/70 hover:text-paper">
              <FacebookIcon size={18} />
            </a>
            <a href={settings.socialLinks.x} aria-label="X" className="text-paper/70 hover:text-paper">
              <XIcon size={18} />
            </a>
          </div>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <p className="mb-4 text-xs uppercase tracking-[0.14em] text-paper/50">{col.title}</p>
            <ul className="flex flex-col gap-2.5">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-paper/80 hover:text-paper">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <p className="mb-4 text-xs uppercase tracking-[0.14em] text-paper/50">Stay in Touch</p>
          <NewsletterForm dark />
        </div>
      </Container>

      <div className="border-t border-paper/10 py-6">
        <Container className="flex flex-col items-center justify-between gap-2 text-xs text-paper/50 sm:flex-row">
          <p>
            &copy; {new Date().getFullYear()} {settings.brandName}. All rights reserved.
          </p>
          <p>{settings.footer.contactAddress}</p>
        </Container>
      </div>
    </footer>
  );
}
