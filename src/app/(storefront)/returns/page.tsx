import { Container } from "@/components/ui/Container";

export const metadata = { title: "Returns & Exchanges" };

export default function ReturnsPage() {
  return (
    <Container className="mx-auto max-w-2xl py-16 text-ink-soft">
      <h1 className="font-display text-4xl text-ink">Returns & Exchanges</h1>
      <div className="mt-8 flex flex-col gap-5 text-sm leading-relaxed">
        <p>We want you to love what you ordered. If something isn't right, you can request a return within 14 days of delivery.</p>
        <ol className="flex list-decimal flex-col gap-2 pl-5">
          <li>Sign in and open the order from your Order History.</li>
          <li>Select the item(s) you'd like to return and the reason.</li>
          <li>We'll confirm pickup or drop-off details by email/WhatsApp.</li>
          <li>Once received and inspected, your refund is processed to your original payment method.</li>
        </ol>
        <p>Items must be unworn, unwashed, and in their original packaging with tags attached. Final sale items are not eligible for return.</p>
      </div>
    </Container>
  );
}
