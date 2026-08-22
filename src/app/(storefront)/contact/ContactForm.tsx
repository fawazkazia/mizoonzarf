"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";

export function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) {
      toast.success("Message sent. We'll get back to you shortly.");
      setForm({ name: "", email: "", message: "" });
    } else {
      toast.error("Couldn't send your message. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <input required placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border border-line px-4 py-3 text-sm" />
      <input required type="email" placeholder="Your email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="border border-line px-4 py-3 text-sm" />
      <textarea required minLength={10} rows={5} placeholder="How can we help?" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="border border-line px-4 py-3 text-sm" />
      <Button type="submit" disabled={loading} className="self-start">
        {loading ? "Sending..." : "Send Message"}
      </Button>
    </form>
  );
}
