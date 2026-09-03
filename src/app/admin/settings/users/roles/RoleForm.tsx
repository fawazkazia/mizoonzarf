"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Field, Input, Textarea, Checkbox } from "@/components/admin/FormField";
import { Button } from "@/components/ui/Button";
import { PERMISSION_CATALOG } from "@/lib/permissions/catalog";
import { createStaffRole, updateStaffRole } from "./actions";

type Initial = { name: string; description: string; permissions: string[] };

export function RoleForm({ roleId, initial, locked = false }: { roleId?: string; initial: Initial; locked?: boolean }) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description);
  const [permissions, setPermissions] = useState(new Set(initial.permissions));
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(false);

  function toggle(key: string) {
    const next = new Set(permissions);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setPermissions(next);
  }

  function setCategory(keys: string[], on: boolean) {
    const next = new Set(permissions);
    for (const key of keys) (on ? next.add(key) : next.delete(key));
    setPermissions(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { name, description, permissions: Array.from(permissions) };
      if (roleId) {
        await updateStaffRole(roleId, payload);
        toast.success("Role updated.");
      } else {
        const { id } = await createStaffRole(payload);
        toast.success("Role created.");
        router.push(`/admin/settings/users/roles/${id}/edit`);
        return;
      }
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save this role.");
    } finally {
      setLoading(false);
    }
  }

  const lowerFilter = filter.trim().toLowerCase();

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Role Name">
          <Input required value={name} onChange={(e) => setName(e.target.value)} disabled={locked} />
        </Field>
        <Field label="Description">
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={1} />
        </Field>
      </div>

      {locked && (
        <p className="border border-dashed border-line bg-paper-dim px-4 py-3 text-xs text-ink-soft">
          The Super Admin role always has every permission and can't be reduced — it's protected so no one can accidentally lock everyone out.
        </p>
      )}

      <Input placeholder="Filter permissions..." value={filter} onChange={(e) => setFilter(e.target.value)} className="max-w-xs" />

      <div className="flex flex-col gap-4">
        {PERMISSION_CATALOG.map((category) => {
          const visible = category.permissions.filter((p) => !lowerFilter || p.label.toLowerCase().includes(lowerFilter));
          if (visible.length === 0) return null;
          const keys = visible.map((p) => p.key);
          return (
            <fieldset key={category.key} className="border border-line p-4">
              <legend className="flex items-center gap-3 px-2">
                <span className="font-medium">{category.label}</span>
                {!locked && (
                  <>
                    <button type="button" onClick={() => setCategory(keys, true)} className="text-xs text-ink-soft underline hover:text-ink">
                      Select All
                    </button>
                    <button type="button" onClick={() => setCategory(keys, false)} className="text-xs text-ink-soft underline hover:text-ink">
                      Deselect All
                    </button>
                  </>
                )}
              </legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {visible.map((p) => (
                  <Checkbox key={p.key} label={p.label} checked={locked || permissions.has(p.key)} disabled={locked} onChange={() => toggle(p.key)} />
                ))}
              </div>
            </fieldset>
          );
        })}
      </div>

      <Button type="submit" size="sm" disabled={loading} className="self-start">
        {loading ? "Saving..." : roleId ? "Save Role" : "Create Role"}
      </Button>
    </form>
  );
}
