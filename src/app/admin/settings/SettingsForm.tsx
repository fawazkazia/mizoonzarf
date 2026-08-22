"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea, Checkbox, Fieldset } from "@/components/admin/FormField";
import { SingleImageUploader } from "@/components/admin/ImageUploader";
import { updateSettings } from "./actions";
import type { SettingsInput } from "@/lib/validation/admin-settings";
import type { SiteSettings } from "@/lib/settings";

type CurrencyOption = { code: string; symbol: string; rate: number };

export function SettingsForm({ initial }: { initial: SiteSettings }) {
  const router = useRouter();
  const [brandName, setBrandName] = useState(initial.brandName);
  const [brandTagline, setBrandTagline] = useState(initial.brandTagline);
  const [currency, setCurrency] = useState(initial.currency);
  const [currencySymbol, setCurrencySymbol] = useState(initial.currencySymbol);
  const [taxPercent, setTaxPercent] = useState(initial.taxPercent);
  const [taxInclusive, setTaxInclusive] = useState(initial.taxInclusive);
  const [whatsappNumber, setWhatsappNumber] = useState(initial.whatsappNumber);
  const [supportEmail, setSupportEmail] = useState(initial.supportEmail);
  const [instagram, setInstagram] = useState(initial.socialLinks.instagram ?? "");
  const [facebook, setFacebook] = useState(initial.socialLinks.facebook ?? "");
  const [tiktok, setTiktok] = useState(initial.socialLinks.tiktok ?? "");
  const [x, setX] = useState(initial.socialLinks.x ?? "");
  const [standardFee, setStandardFee] = useState(initial.shipping.standardFee);
  const [expressFee, setExpressFee] = useState(initial.shipping.expressFee);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(initial.shipping.freeShippingThreshold);
  const [standardDays, setStandardDays] = useState(initial.shipping.standardDays);
  const [expressDays, setExpressDays] = useState(initial.shipping.expressDays);
  const [footerAbout, setFooterAbout] = useState(initial.footer.about);
  const [contactAddress, setContactAddress] = useState(initial.footer.contactAddress);
  const [promoMessages, setPromoMessages] = useState(initial.header.promoMessages.join("\n"));
  const [showFreeShipping, setShowFreeShipping] = useState(initial.header.showFreeShipping);
  const [supportPhone, setSupportPhone] = useState(initial.header.supportPhone);
  const [countryLabel, setCountryLabel] = useState(initial.header.countryLabel);
  const [countryFlag, setCountryFlag] = useState(initial.header.countryFlag);
  const [logoUrl, setLogoUrl] = useState<string | null>(initial.branding.logoUrl || null);
  const [faviconUrl, setFaviconUrl] = useState<string | null>(initial.branding.faviconUrl || null);
  const [currencyDisplayEnabled, setCurrencyDisplayEnabled] = useState(initial.currencyDisplay.enabled);
  const [currencyOptions, setCurrencyOptions] = useState<CurrencyOption[]>(initial.currencyDisplay.options);
  const [loading, setLoading] = useState(false);

  function updateCurrencyOption(index: number, patch: Partial<CurrencyOption>) {
    setCurrencyOptions((prev) => prev.map((opt, i) => (i === index ? { ...opt, ...patch } : opt)));
  }

  function removeCurrencyOption(index: number) {
    setCurrencyOptions((prev) => prev.filter((_, i) => i !== index));
  }

  function addCurrencyOption() {
    setCurrencyOptions((prev) => [...prev, { code: "", symbol: "", rate: 1 }]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: SettingsInput = {
      brandName,
      brandTagline,
      currency,
      currencySymbol,
      taxPercent,
      taxInclusive,
      whatsappNumber,
      supportEmail,
      socialLinks: { instagram, facebook, tiktok, x },
      shipping: { standardFee, expressFee, freeShippingThreshold, standardDays, expressDays },
      footer: { about: footerAbout, contactAddress },
      header: {
        promoMessages: promoMessages.split("\n").map((m) => m.trim()).filter(Boolean),
        showFreeShipping,
        supportPhone,
        countryLabel,
        countryFlag,
      },
      branding: { logoUrl, faviconUrl },
      currencyDisplay: { enabled: currencyDisplayEnabled, options: currencyOptions },
    };

    setLoading(true);
    try {
      await updateSettings(payload);
      toast.success("Settings saved.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Fieldset title="Branding">
        <div>
          <Field label="Logo">
            <SingleImageUploader value={logoUrl} onChange={setLogoUrl} />
          </Field>
        </div>
        <div>
          <Field label="Favicon">
            <SingleImageUploader value={faviconUrl} onChange={setFaviconUrl} />
          </Field>
        </div>
      </Fieldset>

      <Fieldset title="Store Info">
        <Field label="Brand Name">
          <Input required value={brandName} onChange={(e) => setBrandName(e.target.value)} />
        </Field>
        <Field label="Tagline">
          <Input required value={brandTagline} onChange={(e) => setBrandTagline(e.target.value)} />
        </Field>
        <Field label="Currency Code">
          <Input required value={currency} onChange={(e) => setCurrency(e.target.value)} />
        </Field>
        <Field label="Currency Symbol">
          <Input required value={currencySymbol} onChange={(e) => setCurrencySymbol(e.target.value)} />
        </Field>
      </Fieldset>

      <fieldset className="border border-line p-5">
        <legend className="px-2 font-display text-lg">Currency Display</legend>
        <p className="mt-1 text-xs text-ink-soft">
          Display-only conversion. Shoppers can toggle these to preview approximate prices while browsing, but the
          cart, checkout, and orders always charge in the Currency Code above.
        </p>
        <div className="mt-4">
          <Checkbox
            label="Let shoppers switch the displayed currency"
            checked={currencyDisplayEnabled}
            onChange={(e) => setCurrencyDisplayEnabled(e.target.checked)}
          />
        </div>

        <div className="mt-4 flex flex-col gap-3">
          {currencyOptions.map((opt, i) => (
            <div key={i} className="flex items-end gap-3">
              <Field label="Code">
                <Input value={opt.code} onChange={(e) => updateCurrencyOption(i, { code: e.target.value.toUpperCase() })} className="w-20" />
              </Field>
              <Field label="Symbol">
                <Input value={opt.symbol} onChange={(e) => updateCurrencyOption(i, { symbol: e.target.value })} className="w-20" />
              </Field>
              <Field label={`Rate (1 ${currency || "AED"} = ? ${opt.code || "..."})`}>
                <Input
                  type="number"
                  step="0.0001"
                  min={0}
                  value={opt.rate}
                  onChange={(e) => updateCurrencyOption(i, { rate: Number(e.target.value) })}
                  className="w-32"
                />
              </Field>
              <button type="button" onClick={() => removeCurrencyOption(i)} aria-label="Remove currency" className="mb-2.5 text-ink-soft hover:text-sale">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <button type="button" onClick={addCurrencyOption} className="mt-3 flex items-center gap-1.5 text-xs uppercase tracking-[0.1em] text-ink-soft hover:text-ink">
          <Plus size={14} /> Add Currency
        </button>
      </fieldset>

      <Fieldset title="Tax">
        <Field label="Tax Percent">
          <Input type="number" step="0.1" min={0} max={100} value={taxPercent} onChange={(e) => setTaxPercent(Number(e.target.value))} />
        </Field>
        <div className="flex items-center">
          <Checkbox label="Prices are tax-inclusive" checked={taxInclusive} onChange={(e) => setTaxInclusive(e.target.checked)} />
        </div>
      </Fieldset>

      <Fieldset title="Support">
        <Field label="WhatsApp Number" hint="Digits only, with country code, e.g. 971500000000">
          <Input required value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} />
        </Field>
        <Field label="Support Email">
          <Input required type="email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} />
        </Field>
        <Field label="Support Phone (displayed)">
          <Input required value={supportPhone} onChange={(e) => setSupportPhone(e.target.value)} />
        </Field>
      </Fieldset>

      <Fieldset title="Header">
        <div className="sm:col-span-2">
          <Field label="Promo Messages" hint="One message per line. Use {threshold} to insert the free-shipping amount.">
            <Textarea rows={3} value={promoMessages} onChange={(e) => setPromoMessages(e.target.value)} />
          </Field>
        </div>
        <div className="flex items-center">
          <Checkbox label="Show free shipping message" checked={showFreeShipping} onChange={(e) => setShowFreeShipping(e.target.checked)} />
        </div>
        <Field label="Country Label">
          <Input required value={countryLabel} onChange={(e) => setCountryLabel(e.target.value)} />
        </Field>
        <Field label="Country Flag Emoji">
          <Input required value={countryFlag} onChange={(e) => setCountryFlag(e.target.value)} />
        </Field>
      </Fieldset>

      <Fieldset title="Shipping">
        <Field label="Standard Fee">
          <Input type="number" step="0.01" min={0} value={standardFee} onChange={(e) => setStandardFee(Number(e.target.value))} />
        </Field>
        <Field label="Express Fee">
          <Input type="number" step="0.01" min={0} value={expressFee} onChange={(e) => setExpressFee(Number(e.target.value))} />
        </Field>
        <Field label="Free Shipping Threshold">
          <Input type="number" step="0.01" min={0} value={freeShippingThreshold} onChange={(e) => setFreeShippingThreshold(Number(e.target.value))} />
        </Field>
        <Field label="Standard Delivery Time">
          <Input required value={standardDays} onChange={(e) => setStandardDays(e.target.value)} />
        </Field>
        <Field label="Express Delivery Time">
          <Input required value={expressDays} onChange={(e) => setExpressDays(e.target.value)} />
        </Field>
      </Fieldset>

      <Fieldset title="Social Links">
        <Field label="Instagram">
          <Input value={instagram} onChange={(e) => setInstagram(e.target.value)} />
        </Field>
        <Field label="Facebook">
          <Input value={facebook} onChange={(e) => setFacebook(e.target.value)} />
        </Field>
        <Field label="TikTok">
          <Input value={tiktok} onChange={(e) => setTiktok(e.target.value)} />
        </Field>
        <Field label="X (Twitter)">
          <Input value={x} onChange={(e) => setX(e.target.value)} />
        </Field>
      </Fieldset>

      <Fieldset title="Footer">
        <div className="sm:col-span-2">
          <Field label="About Text">
            <Textarea rows={3} value={footerAbout} onChange={(e) => setFooterAbout(e.target.value)} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Contact Address">
            <Input value={contactAddress} onChange={(e) => setContactAddress(e.target.value)} />
          </Field>
        </div>
      </Fieldset>

      <Button type="submit" size="lg" disabled={loading} className="self-start">
        {loading ? "Saving..." : "Save Settings"}
      </Button>
    </form>
  );
}
