import { NewTicketForm } from "./NewTicketForm";

export const metadata = { title: "New Ticket" };

interface PageProps {
  searchParams: Promise<{ customerEmail?: string; orderNumber?: string }>;
}

export default async function NewTicketPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl">New Ticket</h1>
        <p className="mt-1 text-sm text-ink-soft">Log a customer issue reported over phone, WhatsApp, or in person.</p>
      </div>
      <NewTicketForm initialCustomerEmail={sp.customerEmail} initialOrderNumber={sp.orderNumber} />
    </div>
  );
}
