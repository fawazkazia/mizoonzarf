"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Table, Th, Td, EmptyRow } from "@/components/admin/Table";
import { Field, Input } from "@/components/admin/FormField";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { createWarehouse, deactivateWarehouse, updateWarehousePickupDetails, registerWarehouseWithShiprocket } from "../warehouse-actions";

interface Warehouse {
  id: string;
  name: string;
  code: string;
  address: string | null;
  isActive: boolean;
  isDefault: boolean;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  pincode: string | null;
  shiprocketPickupLocation: string | null;
}

function PickupDetailsEditor({ warehouse, onDone }: { warehouse: Warehouse; onDone: () => void }) {
  const router = useRouter();
  const [address, setAddress] = useState(warehouse.address ?? "");
  const [contactName, setContactName] = useState(warehouse.contactName ?? "");
  const [phone, setPhone] = useState(warehouse.phone ?? "");
  const [email, setEmail] = useState(warehouse.email ?? "");
  const [addressLine2, setAddressLine2] = useState(warehouse.addressLine2 ?? "");
  const [city, setCity] = useState(warehouse.city ?? "");
  const [state, setState] = useState(warehouse.state ?? "");
  const [pincode, setPincode] = useState(warehouse.pincode ?? "");
  const [saving, setSaving] = useState(false);
  const [registering, setRegistering] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await updateWarehousePickupDetails(warehouse.id, { address, contactName, phone, email, addressLine2, city, state, pincode, country: "IN" });
      toast.success("Pickup details saved.");
      router.refresh();
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save pickup details.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRegister() {
    setRegistering(true);
    try {
      await registerWarehouseWithShiprocket(warehouse.id);
      toast.success("Registered as a Shiprocket pickup location.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't register with Shiprocket.");
    } finally {
      setRegistering(false);
    }
  }

  return (
    <tr>
      <td colSpan={5} className="border-b border-line bg-paper-dim p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Address Line 1">
            <Input value={address} onChange={(e) => setAddress(e.target.value)} />
          </Field>
          <Field label="Contact Name">
            <Input value={contactName} onChange={(e) => setContactName(e.target.value)} />
          </Field>
          <Field label="Phone">
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
          <Field label="Email">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Address Line 2">
            <Input value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)} />
          </Field>
          <Field label="City">
            <Input value={city} onChange={(e) => setCity(e.target.value)} />
          </Field>
          <Field label="State">
            <Input value={state} onChange={(e) => setState(e.target.value)} />
          </Field>
          <Field label="PIN Code">
            <Input value={pincode} onChange={(e) => setPincode(e.target.value)} maxLength={6} />
          </Field>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button type="button" size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Pickup Details"}
          </Button>
          <Button type="button" size="sm" variant="secondary" onClick={handleRegister} disabled={registering}>
            {registering ? "Registering..." : "Register with Shiprocket"}
          </Button>
          {warehouse.shiprocketPickupLocation && <Badge tone="success">Registered: {warehouse.shiprocketPickupLocation}</Badge>}
          <button type="button" onClick={onDone} className="ml-auto text-xs uppercase tracking-wide text-ink-soft underline">
            Close
          </button>
        </div>
      </td>
    </tr>
  );
}

export function WarehouseManager({ warehouses }: { warehouses: Warehouse[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await createWarehouse({ name, code, address: address || undefined });
      setName("");
      setCode("");
      setAddress("");
      toast.success("Warehouse created.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't create warehouse.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeactivate(id: string, warehouseName: string) {
    if (!confirm(`Deactivate ${warehouseName}?`)) return;
    try {
      await deactivateWarehouse(id);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't deactivate warehouse.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Table>
        <thead>
          <tr>
            <Th>Name</Th>
            <Th>Code</Th>
            <Th>Pickup Address</Th>
            <Th>Status</Th>
            <Th className="text-right">Actions</Th>
          </tr>
        </thead>
        <tbody>
          {warehouses.length === 0 && <EmptyRow colSpan={5}>No warehouses yet.</EmptyRow>}
          {warehouses.map((w) => (
            <Fragment key={w.id}>
              <tr>
                <Td>
                  {w.name} {w.isDefault && <Badge tone="outline">Default</Badge>}
                </Td>
                <Td className="font-mono text-xs">{w.code}</Td>
                <Td className="text-xs text-ink-soft">
                  {w.address ?? "—"}
                  {w.city && w.pincode ? `, ${w.city} ${w.pincode}` : ""}
                  {!w.phone && <span className="ml-2 text-sale">(no contact phone)</span>}
                </Td>
                <Td>
                  <Badge tone={w.isActive ? "success" : "ink"}>{w.isActive ? "Active" : "Inactive"}</Badge>
                </Td>
                <Td className="text-right">
                  <button className="mr-3 text-xs text-ink underline" onClick={() => setEditingId(editingId === w.id ? null : w.id)}>
                    {editingId === w.id ? "Cancel" : "Edit Pickup Details"}
                  </button>
                  {w.isActive && !w.isDefault && (
                    <button className="text-xs text-sale underline" onClick={() => handleDeactivate(w.id, w.name)}>
                      Deactivate
                    </button>
                  )}
                </Td>
              </tr>
              {editingId === w.id && <PickupDetailsEditor warehouse={w} onDone={() => setEditingId(null)} />}
            </Fragment>
          ))}
        </tbody>
      </Table>

      <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-3 border border-line p-5">
        <Field label="Name">
          <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Dubai Warehouse" />
        </Field>
        <Field label="Code">
          <Input required value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. DXB" />
        </Field>
        <Field label="Address (optional)">
          <Input value={address} onChange={(e) => setAddress(e.target.value)} />
        </Field>
        <Button type="submit" size="sm" disabled={loading}>
          Add Warehouse
        </Button>
      </form>
    </div>
  );
}
