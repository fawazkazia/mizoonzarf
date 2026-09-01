"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea, Checkbox } from "@/components/admin/FormField";
import { createTemplate, updateTemplate, deleteTemplate } from "./actions";
import { ALL_TICKET_CATEGORIES } from "@/lib/customer-care/status";
import type { TicketCategory } from "@/generated/prisma/client";

export interface TemplateRow {
  id: string;
  name: string;
  category: TicketCategory | null;
  body: string;
  isActive: boolean;
}

export function TemplateForm({ initial, onDone }: { initial?: TemplateRow; onDone?: () => void }) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState<TicketCategory | "">(initial?.category ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setLoading(true);
    try {
      const payload = { name, category: category || null, body, isActive };
      if (initial) await updateTemplate(initial.id, payload);
      else await createTemplate(payload);
      toast.success("Template saved.");
      router.refresh();
      onDone?.();
      if (!initial) {
        setName("");
        setCategory("");
        setBody("");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save template.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!initial) return;
    setLoading(true);
    try {
      await deleteTemplate(initial.id);
      toast.success("Template deleted.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't delete template.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 border border-line p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Category (optional — narrows when it's suggested)">
          <Select value={category} onChange={(e) => setCategory(e.target.value as TicketCategory | "")}>
            <option value="">Any category</option>
            {ALL_TICKET_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c.replace(/_/g, " ")}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Body">
        <Textarea rows={4} value={body} onChange={(e) => setBody(e.target.value)} />
      </Field>
      <Checkbox label="Active" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSave} disabled={loading || !name || !body}>
          {loading ? "Saving..." : "Save"}
        </Button>
        {initial && (
          <Button size="sm" variant="secondary" onClick={handleDelete} disabled={loading}>
            Delete
          </Button>
        )}
      </div>
    </div>
  );
}
