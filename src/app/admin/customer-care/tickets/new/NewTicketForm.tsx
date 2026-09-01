"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea, Fieldset } from "@/components/admin/FormField";
import { createTicketManual } from "../actions";
import { ALL_TICKET_PRIORITIES, ALL_TICKET_CATEGORIES, TICKET_PRIORITY_LABEL } from "@/lib/customer-care/status";
import type { TicketCategory } from "@/generated/prisma/client";

export function NewTicketForm({ initialCustomerEmail, initialOrderNumber }: { initialCustomerEmail?: string; initialOrderNumber?: string }) {
  const router = useRouter();
  const [category, setCategory] = useState<TicketCategory>("GENERAL_ENQUIRY");
  const [priority, setPriority] = useState<(typeof ALL_TICKET_PRIORITIES)[number]>("NORMAL");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [customerEmail, setCustomerEmail] = useState(initialCustomerEmail ?? "");
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber ?? "");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { id } = await createTicketManual({
        category,
        priority,
        subject,
        description,
        customerEmail: customerEmail || undefined,
        guestName: guestName || undefined,
        guestPhone: guestPhone || undefined,
        orderNumber: orderNumber || undefined,
      });
      toast.success("Ticket created.");
      router.push(`/admin/customer-care/tickets/${id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't create ticket.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Fieldset title="Customer">
        <Field label="Customer Email (if they have an account)">
          <Input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="customer@example.com" />
        </Field>
        <Field label="Order Number (optional)">
          <Input value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} placeholder="MZ-20260830-0001" />
        </Field>
        <Field label="Guest Name (if no account)">
          <Input value={guestName} onChange={(e) => setGuestName(e.target.value)} disabled={!!customerEmail} />
        </Field>
        <Field label="Guest Phone (if no account)">
          <Input value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} disabled={!!customerEmail} />
        </Field>
      </Fieldset>

      <Fieldset title="Issue">
        <Field label="Category">
          <Select value={category} onChange={(e) => setCategory(e.target.value as typeof category)}>
            {ALL_TICKET_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c.replace(/_/g, " ")}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Priority">
          <Select value={priority} onChange={(e) => setPriority(e.target.value as typeof priority)}>
            {ALL_TICKET_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {TICKET_PRIORITY_LABEL[p]}
              </option>
            ))}
          </Select>
        </Field>
      </Fieldset>

      <Field label="Subject">
        <Input required value={subject} onChange={(e) => setSubject(e.target.value)} />
      </Field>
      <Field label="Description">
        <Textarea required rows={5} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What did the customer report?" />
      </Field>

      <Button type="submit" disabled={loading} className="self-start">
        {loading ? "Creating..." : "Create Ticket"}
      </Button>
    </form>
  );
}
