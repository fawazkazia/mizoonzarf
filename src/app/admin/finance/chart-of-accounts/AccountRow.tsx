"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input, Checkbox } from "@/components/admin/FormField";
import { Td } from "@/components/admin/Table";
import { updateLedgerAccount } from "./actions";

export function AccountRow({ id, code, type, isContra, name, isActive }: { id: string; code: string; type: string; isContra: boolean; name: string; isActive: boolean }) {
  const router = useRouter();
  const [nameValue, setNameValue] = useState(name);
  const [active, setActive] = useState(isActive);
  const [saving, setSaving] = useState(false);

  async function save(next: { name?: string; isActive?: boolean }) {
    setSaving(true);
    try {
      await updateLedgerAccount(id, { name: next.name ?? nameValue, isActive: next.isActive ?? active });
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <tr>
      <Td className="font-mono text-xs">{code}</Td>
      <Td>
        <Input
          value={nameValue}
          disabled={saving}
          onChange={(e) => setNameValue(e.target.value)}
          onBlur={() => nameValue !== name && save({ name: nameValue })}
          className="!py-1.5"
        />
      </Td>
      <Td>{type}</Td>
      <Td>{isContra ? "Yes" : "—"}</Td>
      <Td>
        <Checkbox
          label=""
          checked={active}
          disabled={saving}
          onChange={(e) => {
            setActive(e.target.checked);
            save({ isActive: e.target.checked });
          }}
        />
      </Td>
    </tr>
  );
}
