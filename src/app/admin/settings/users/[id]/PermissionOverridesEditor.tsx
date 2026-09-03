"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input, Checkbox } from "@/components/admin/FormField";
import { Button } from "@/components/ui/Button";
import { PERMISSION_CATALOG } from "@/lib/permissions/catalog";
import { updateStaffPermissionOverrides } from "../actions";

/** Per-staff permission override layered on top of their role — toggling a checkbox here never
 * edits the role itself, only this one account (spec: "custom permission override when
 * required"). A checkbox reflects the *effective* state (role permissions plus overrides minus
 * revocations); toggling it records the minimal diff needed to flip that effective state. */
export function PermissionOverridesEditor({
  userId,
  rolePermissions,
  initialOverrides,
  initialRevocations,
}: {
  userId: string;
  rolePermissions: string[];
  initialOverrides: string[];
  initialRevocations: string[];
}) {
  const router = useRouter();
  const base = useMemo(() => new Set(rolePermissions), [rolePermissions]);
  const [overrides, setOverrides] = useState(new Set(initialOverrides));
  const [revocations, setRevocations] = useState(new Set(initialRevocations));
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [dirty, setDirty] = useState(false);

  function isEffective(key: string) {
    if (revocations.has(key)) return false;
    if (overrides.has(key)) return true;
    return base.has(key);
  }

  function toggle(key: string) {
    const nextOverrides = new Set(overrides);
    const nextRevocations = new Set(revocations);
    if (isEffective(key)) {
      if (base.has(key)) nextRevocations.add(key);
      else nextOverrides.delete(key);
    } else {
      if (base.has(key)) nextRevocations.delete(key);
      else nextOverrides.add(key);
    }
    setOverrides(nextOverrides);
    setRevocations(nextRevocations);
    setDirty(true);
  }

  function setCategory(keys: string[], on: boolean) {
    const nextOverrides = new Set(overrides);
    const nextRevocations = new Set(revocations);
    for (const key of keys) {
      const effective = isEffective(key);
      if (effective === on) continue;
      if (on) {
        if (base.has(key)) nextRevocations.delete(key);
        else nextOverrides.add(key);
      } else {
        if (base.has(key)) nextRevocations.add(key);
        else nextOverrides.delete(key);
      }
    }
    setOverrides(nextOverrides);
    setRevocations(nextRevocations);
    setDirty(true);
  }

  async function handleSave() {
    setLoading(true);
    try {
      await updateStaffPermissionOverrides(userId, {
        permissionOverrides: Array.from(overrides),
        permissionRevocations: Array.from(revocations),
      });
      toast.success("Permission overrides saved.");
      setDirty(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save overrides.");
    } finally {
      setLoading(false);
    }
  }

  const lowerFilter = filter.trim().toLowerCase();

  return (
    <div className="flex flex-col gap-4">
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
                <button type="button" onClick={() => setCategory(keys, true)} className="text-xs text-ink-soft underline hover:text-ink">
                  Select All
                </button>
                <button type="button" onClick={() => setCategory(keys, false)} className="text-xs text-ink-soft underline hover:text-ink">
                  Deselect All
                </button>
              </legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {visible.map((p) => (
                  <Checkbox key={p.key} label={p.label} checked={isEffective(p.key)} onChange={() => toggle(p.key)} />
                ))}
              </div>
            </fieldset>
          );
        })}
      </div>
      <Button size="sm" onClick={handleSave} disabled={loading || !dirty} className="self-start">
        {loading ? "Saving..." : "Save Permission Overrides"}
      </Button>
    </div>
  );
}
