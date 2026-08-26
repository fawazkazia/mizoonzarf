"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Field, Input, Select, Checkbox, Fieldset } from "@/components/admin/FormField";
import { updateShippingProviderSettings, testShiprocketConnection } from "./actions";
import type { ShippingProviderSettings } from "@/lib/shipping/settings";

interface Props {
  initial: ShippingProviderSettings;
  warehouses: { id: string; name: string; hasPickupAddress: boolean }[];
  credentialStatus: { configured: boolean; mode: "test" | "production"; emailHint: string | null };
  failedShipments: { id: string; orderId: string; orderNumber: string; errorMessage: string | null; retryCount: number; updatedAt: string }[];
  recentEvents: { id: string; orderNumber: string; status: string; source: string; createdAt: string }[];
}

export function ShiprocketSettingsForm({ initial, warehouses, credentialStatus, failedShipments, recentEvents }: Props) {
  const router = useRouter();
  const [activeProvider, setActiveProvider] = useState(initial.activeProvider);
  const [codEnabled, setCodEnabled] = useState(initial.codEnabled);
  const [prepaidEnabled, setPrepaidEnabled] = useState(initial.prepaidEnabled);
  const [preferredCourierId, setPreferredCourierId] = useState(initial.preferredCourierId ?? "");
  const [defaultWarehouseId, setDefaultWarehouseId] = useState(initial.defaultWarehouseId ?? "");
  const [defaultPackageWeightGrams, setDefaultPackageWeightGrams] = useState(initial.defaultPackageWeightGrams);
  const [length, setLength] = useState(initial.defaultDimensionsCm.length);
  const [width, setWidth] = useState(initial.defaultDimensionsCm.width);
  const [height, setHeight] = useState(initial.defaultDimensionsCm.height);
  const [autoCreateShipment, setAutoCreateShipment] = useState(initial.automation.autoCreateShipment);
  const [autoAssignAwb, setAutoAssignAwb] = useState(initial.automation.autoAssignAwb);
  const [autoGenerateLabel, setAutoGenerateLabel] = useState(initial.automation.autoGenerateLabel);
  const [autoSchedulePickup, setAutoSchedulePickup] = useState(initial.automation.autoSchedulePickup);
  const [trackingSyncFrequencyMinutes, setTrackingSyncFrequencyMinutes] = useState(initial.trackingSyncFrequencyMinutes);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await updateShippingProviderSettings({
        activeProvider,
        codEnabled,
        prepaidEnabled,
        preferredCourierId: preferredCourierId || null,
        defaultWarehouseId: defaultWarehouseId || null,
        defaultPackageWeightGrams,
        defaultDimensionsCm: { length, width, height },
        automation: { autoCreateShipment, autoAssignAwb, autoGenerateLabel, autoSchedulePickup },
        trackingSyncFrequencyMinutes,
      });
      toast.success("Shipping settings saved.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleTestConnection() {
    setTesting(true);
    try {
      const result = await testShiprocketConnection();
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Test failed.");
    } finally {
      setTesting(false);
    }
  }

  const selectedWarehouse = warehouses.find((w) => w.id === defaultWarehouseId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3 border border-line p-5">
        <Badge tone={credentialStatus.configured ? "success" : "sale"}>{credentialStatus.configured ? "Configured" : "Not Configured"}</Badge>
        <Badge tone={credentialStatus.mode === "production" ? "gold" : "outline"}>{credentialStatus.mode === "production" ? "LIVE MODE" : "TEST MODE"}</Badge>
        {credentialStatus.emailHint && <span className="text-xs text-ink-soft">{credentialStatus.emailHint}</span>}
        <span className="text-xs text-ink-soft">
          {credentialStatus.mode === "production"
            ? "Real shipments will be created with Shiprocket."
            : "Actions are dry-run — no real Shiprocket orders are created. Set SHIPROCKET_MODE=production to go live."}
        </span>
        <Button type="button" size="sm" variant="secondary" onClick={handleTestConnection} disabled={testing} className="ml-auto">
          {testing ? "Testing..." : "Test Connection"}
        </Button>
      </div>

      {!credentialStatus.configured && (
        <p className="border border-line bg-paper-dim p-4 text-xs text-ink-soft">
          Set <code>SHIPROCKET_EMAIL</code> / <code>SHIPROCKET_PASSWORD</code> (or <code>SHIPROCKET_API_TOKEN</code>) in your server
          environment — never in this form. See <code>.env.example</code> for the full list.
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Fieldset title="Provider">
          <Field label="Active Provider">
            <Select value={activeProvider} onChange={(e) => setActiveProvider(e.target.value as "MANUAL" | "SHIPROCKET")}>
              <option value="MANUAL">Manual (hand-entered tracking)</option>
              <option value="SHIPROCKET">Shiprocket</option>
            </Select>
          </Field>
          <Field label="Default Warehouse" hint="Used as the Shiprocket pickup location.">
            <Select value={defaultWarehouseId} onChange={(e) => setDefaultWarehouseId(e.target.value)}>
              <option value="">— Select a warehouse —</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} {w.hasPickupAddress ? "" : "(incomplete pickup address)"}
                </option>
              ))}
            </Select>
          </Field>
          {defaultWarehouseId && selectedWarehouse && !selectedWarehouse.hasPickupAddress && (
            <p className="text-xs text-sale sm:col-span-2">
              This warehouse is missing pickup address details.{" "}
              <Link href="/admin/inventory/warehouses" className="underline">
                Complete it in Warehouses
              </Link>{" "}
              before Shiprocket can create shipments from it.
            </p>
          )}
        </Fieldset>

        <Fieldset title="Payment Methods">
          <div className="flex items-center">
            <Checkbox label="COD enabled" checked={codEnabled} onChange={(e) => setCodEnabled(e.target.checked)} />
          </div>
          <div className="flex items-center">
            <Checkbox label="Prepaid enabled" checked={prepaidEnabled} onChange={(e) => setPrepaidEnabled(e.target.checked)} />
          </div>
          <Field label="Preferred Courier ID" hint="Shiprocket courier_company_id. Leave blank to let Shiprocket auto-select.">
            <Input value={preferredCourierId} onChange={(e) => setPreferredCourierId(e.target.value)} />
          </Field>
        </Fieldset>

        <Fieldset title="Default Package">
          <Field label="Default Weight (grams)" hint="Used when a product variant has no weight set.">
            <Input type="number" min={1} value={defaultPackageWeightGrams} onChange={(e) => setDefaultPackageWeightGrams(Number(e.target.value))} />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Length (cm)">
              <Input type="number" min={1} value={length} onChange={(e) => setLength(Number(e.target.value))} />
            </Field>
            <Field label="Width (cm)">
              <Input type="number" min={1} value={width} onChange={(e) => setWidth(Number(e.target.value))} />
            </Field>
            <Field label="Height (cm)">
              <Input type="number" min={1} value={height} onChange={(e) => setHeight(Number(e.target.value))} />
            </Field>
          </div>
        </Fieldset>

        <Fieldset title="Automation">
          <div className="flex items-center">
            <Checkbox label="Auto-create shipment on order confirmation" checked={autoCreateShipment} onChange={(e) => setAutoCreateShipment(e.target.checked)} />
          </div>
          <div className="flex items-center">
            <Checkbox label="Auto-assign AWB" checked={autoAssignAwb} onChange={(e) => setAutoAssignAwb(e.target.checked)} />
          </div>
          <div className="flex items-center">
            <Checkbox label="Auto-generate label" checked={autoGenerateLabel} onChange={(e) => setAutoGenerateLabel(e.target.checked)} />
          </div>
          <div className="flex items-center">
            <Checkbox label="Auto-schedule pickup" checked={autoSchedulePickup} onChange={(e) => setAutoSchedulePickup(e.target.checked)} />
          </div>
          <Field label="Tracking Sync Frequency (minutes)" hint="Minimum time between background tracking polls per shipment.">
            <Input type="number" min={5} value={trackingSyncFrequencyMinutes} onChange={(e) => setTrackingSyncFrequencyMinutes(Number(e.target.value))} />
          </Field>
        </Fieldset>

        <Button type="submit" size="lg" disabled={loading} className="self-start">
          {loading ? "Saving..." : "Save Shipping Settings"}
        </Button>
      </form>

      {failedShipments.length > 0 && (
        <div className="border border-line p-5">
          <h2 className="mb-4 font-display text-lg">Failed Shipments</h2>
          <ul className="flex flex-col gap-2 text-sm">
            {failedShipments.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2 last:border-0">
                <div>
                  <Link href={`/admin/orders/${s.orderId}`} className="font-medium hover:underline">
                    {s.orderNumber}
                  </Link>
                  <p className="text-xs text-ink-soft">
                    {s.errorMessage} · {s.retryCount} {s.retryCount === 1 ? "attempt" : "attempts"}
                  </p>
                </div>
                <Link href={`/admin/orders/${s.orderId}`} className="text-xs uppercase tracking-wide text-ink underline">
                  Retry
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="border border-line p-5">
        <h2 className="mb-4 font-display text-lg">Integration Log</h2>
        {recentEvents.length === 0 ? (
          <p className="text-sm text-ink-soft">No shipment events yet.</p>
        ) : (
          <ul className="flex flex-col gap-2 text-sm">
            {recentEvents.map((e) => (
              <li key={e.id} className="flex justify-between border-b border-line pb-2 text-xs last:border-0">
                <span>
                  {e.orderNumber} — {e.status.replace(/_/g, " ")} <span className="text-ink-soft">({e.source})</span>
                </span>
                <span className="text-ink-soft">{new Date(e.createdAt).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
