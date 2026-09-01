"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea, Checkbox, Select, Fieldset } from "@/components/admin/FormField";
import { SingleImageUploader } from "@/components/admin/ImageUploader";
import { CountryFlag } from "@/components/ui/CountryFlag";
import { updateSettings } from "./actions";
import type { SettingsInput } from "@/lib/validation/admin-settings";
import type { SiteSettings } from "@/lib/settings";

type CurrencyOption = { code: string; symbol: string; rate: number; country: string; countryLabel: string };

function ColorField({ label, value, onChange, hint }: { label: string; value: string; onChange: (v: string) => void; hint?: string }) {
  return (
    <Field label={label} hint={hint}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-[42px] w-12 shrink-0 cursor-pointer border border-line"
        />
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 uppercase" />
      </div>
    </Field>
  );
}

export function SettingsForm({ initial }: { initial: SiteSettings }) {
  const router = useRouter();
  const [brandName, setBrandName] = useState(initial.brandName);
  const [brandTagline, setBrandTagline] = useState(initial.brandTagline);
  const [currency, setCurrency] = useState(initial.currency);
  const [currencySymbol, setCurrencySymbol] = useState(initial.currencySymbol);
  const [taxPercent, setTaxPercent] = useState(initial.taxPercent);
  const [taxInclusive, setTaxInclusive] = useState(initial.taxInclusive);
  const [sellerGstin, setSellerGstin] = useState(initial.gst.sellerGstin);
  const [sellerState, setSellerState] = useState(initial.gst.sellerState);
  const [sellerLegalName, setSellerLegalName] = useState(initial.gst.sellerLegalName);
  const [sellerAddress, setSellerAddress] = useState(initial.gst.sellerAddress);
  const [cancellationPolicy, setCancellationPolicy] = useState(initial.legal.cancellationPolicy);
  const [returnPolicy, setReturnPolicy] = useState(initial.legal.returnPolicy);
  const [shippingPolicy, setShippingPolicy] = useState(initial.legal.shippingPolicy);
  const [termsAndConditions, setTermsAndConditions] = useState(initial.legal.termsAndConditions);
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
  const [processingDays, setProcessingDays] = useState(initial.shipping.processingDays);
  const [footerAbout, setFooterAbout] = useState(initial.footer.about);
  const [contactAddress, setContactAddress] = useState(initial.footer.contactAddress);
  const [promoMessages, setPromoMessages] = useState(initial.header.promoMessages.join("\n"));
  const [showFreeShipping, setShowFreeShipping] = useState(initial.header.showFreeShipping);
  const [supportPhone, setSupportPhone] = useState(initial.header.supportPhone);
  const [countryLabel, setCountryLabel] = useState(initial.header.countryLabel);
  const [countryCode, setCountryCode] = useState(initial.header.countryCode);
  const [logoUrl, setLogoUrl] = useState<string | null>(initial.branding.logoUrl || null);
  const [mobileLogoUrl, setMobileLogoUrl] = useState<string | null>(initial.branding.mobileLogoUrl || null);
  const [faviconUrl, setFaviconUrl] = useState<string | null>(initial.branding.faviconUrl || null);
  const [currencyDisplayEnabled, setCurrencyDisplayEnabled] = useState(initial.currencyDisplay.enabled);
  const [currencyOptions, setCurrencyOptions] = useState<CurrencyOption[]>(initial.currencyDisplay.options);
  const [maxCodOrderValue, setMaxCodOrderValue] = useState(initial.codRisk.maxCodOrderValue);
  const [maxCodOrdersPerCustomer, setMaxCodOrdersPerCustomer] = useState(initial.codRisk.maxCodOrdersPerCustomer);
  const [highValueCodThreshold, setHighValueCodThreshold] = useState(initial.codRisk.highValueCodThreshold);
  const [allowHighRiskCod, setAllowHighRiskCod] = useState(initial.codRisk.allowHighRiskCod);
  const [requireConfirmOnHighRiskCod, setRequireConfirmOnHighRiskCod] = useState(initial.codRisk.requireConfirmOnHighRiskCod);
  const [codeBannerEnabled, setCodeBannerEnabled] = useState(initial.promoStrips.codeBanner.enabled);
  const [codeBannerHeadline, setCodeBannerHeadline] = useState(initial.promoStrips.codeBanner.headline);
  const [codeBannerCodeText, setCodeBannerCodeText] = useState(initial.promoStrips.codeBanner.codeText);
  const [codeBannerLink, setCodeBannerLink] = useState(initial.promoStrips.codeBanner.link);
  const [codeBannerBgColor, setCodeBannerBgColor] = useState(initial.promoStrips.codeBanner.bgColor);
  const [codeBannerAccentColor, setCodeBannerAccentColor] = useState(initial.promoStrips.codeBanner.accentColor);
  const [codeBannerImageUrl, setCodeBannerImageUrl] = useState<string | null>(initial.promoStrips.codeBanner.imageUrl);
  const [brandsBannerEnabled, setBrandsBannerEnabled] = useState(initial.promoStrips.brandsBanner.enabled);
  const [brandsBannerTagline, setBrandsBannerTagline] = useState(initial.promoStrips.brandsBanner.tagline);
  const [brandsBannerLink, setBrandsBannerLink] = useState(initial.promoStrips.brandsBanner.link);
  const [brandsGradientFrom, setBrandsGradientFrom] = useState(initial.promoStrips.brandsBanner.gradientFrom);
  const [brandsGradientVia, setBrandsGradientVia] = useState(initial.promoStrips.brandsBanner.gradientVia);
  const [brandsGradientTo, setBrandsGradientTo] = useState(initial.promoStrips.brandsBanner.gradientTo);
  const [brandsBannerImageUrl, setBrandsBannerImageUrl] = useState<string | null>(initial.promoStrips.brandsBanner.imageUrl);
  const [brandsFeatures, setBrandsFeatures] = useState(
    initial.promoStrips.brandsBanner.features.map((f) => ({ icon: f.icon, linesText: f.lines.join("\n") }))
  );
  const [loading, setLoading] = useState(false);

  function updateBrandsFeature(index: number, patch: Partial<{ icon: "bag" | "truck" | "gift"; linesText: string }>) {
    setBrandsFeatures((prev) => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  }

  function updateCurrencyOption(index: number, patch: Partial<CurrencyOption>) {
    setCurrencyOptions((prev) => prev.map((opt, i) => (i === index ? { ...opt, ...patch } : opt)));
  }

  function removeCurrencyOption(index: number) {
    setCurrencyOptions((prev) => prev.filter((_, i) => i !== index));
  }

  function addCurrencyOption() {
    setCurrencyOptions((prev) => [...prev, { code: "", symbol: "", rate: 1, country: "", countryLabel: "" }]);
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
      gst: { sellerGstin, sellerState, sellerLegalName, sellerAddress },
      legal: { cancellationPolicy, returnPolicy, shippingPolicy, termsAndConditions },
      whatsappNumber,
      supportEmail,
      socialLinks: { instagram, facebook, tiktok, x },
      shipping: { standardFee, expressFee, freeShippingThreshold, standardDays, expressDays, processingDays },
      footer: { about: footerAbout, contactAddress },
      header: {
        promoMessages: promoMessages.split("\n").map((m) => m.trim()).filter(Boolean),
        showFreeShipping,
        supportPhone,
        countryLabel,
        countryCode,
      },
      branding: { logoUrl, mobileLogoUrl, faviconUrl },
      codRisk: { maxCodOrderValue, maxCodOrdersPerCustomer, highValueCodThreshold, allowHighRiskCod, requireConfirmOnHighRiskCod },
      currencyDisplay: { enabled: currencyDisplayEnabled, options: currencyOptions },
      promoStrips: {
        codeBanner: {
          enabled: codeBannerEnabled,
          headline: codeBannerHeadline,
          codeText: codeBannerCodeText,
          link: codeBannerLink,
          bgColor: codeBannerBgColor,
          accentColor: codeBannerAccentColor,
          imageUrl: codeBannerImageUrl,
        },
        brandsBanner: {
          enabled: brandsBannerEnabled,
          tagline: brandsBannerTagline,
          link: brandsBannerLink,
          gradientFrom: brandsGradientFrom,
          gradientVia: brandsGradientVia,
          gradientTo: brandsGradientTo,
          imageUrl: brandsBannerImageUrl,
          features: brandsFeatures.map((f) => ({
            icon: f.icon,
            lines: f.linesText.split("\n").map((l) => l.trim()).filter(Boolean),
          })),
        },
      },
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
          <Field label="Mobile Logo (optional)" hint="Falls back to the main logo when empty.">
            <SingleImageUploader value={mobileLogoUrl} onChange={setMobileLogoUrl} />
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
            <div key={i} className="flex flex-wrap items-end gap-3">
              <Field label="Code">
                <Input value={opt.code} onChange={(e) => updateCurrencyOption(i, { code: e.target.value.toUpperCase() })} className="w-20" />
              </Field>
              <Field label="Symbol">
                <Input value={opt.symbol} onChange={(e) => updateCurrencyOption(i, { symbol: e.target.value })} className="w-20" />
              </Field>
              <Field label={`Rate (1 ${currency || "INR"} = ? ${opt.code || "..."})`}>
                <Input
                  type="number"
                  step="0.0001"
                  min={0}
                  value={opt.rate}
                  onChange={(e) => updateCurrencyOption(i, { rate: Number(e.target.value) })}
                  className="w-32"
                />
              </Field>
              <Field label="Country Code" hint="2-letter ISO, e.g. US">
                <div className="flex items-center gap-2">
                  <CountryFlag code={opt.country} className="h-4 w-6 shrink-0 rounded-[1px]" />
                  <Input
                    maxLength={2}
                    value={opt.country}
                    onChange={(e) => updateCurrencyOption(i, { country: e.target.value.toUpperCase() })}
                    className="w-16 uppercase"
                  />
                </div>
              </Field>
              <Field label="Country Name">
                <Input
                  value={opt.countryLabel}
                  onChange={(e) => updateCurrencyOption(i, { countryLabel: e.target.value })}
                  className="w-40"
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

      <Fieldset title="GST / Tax">
        <Field label="Default GST %" hint="Used when a product has no GST Rate override.">
          <Input type="number" step="0.1" min={0} max={100} value={taxPercent} onChange={(e) => setTaxPercent(Number(e.target.value))} />
        </Field>
        <div className="flex items-center">
          <Checkbox label="Prices are tax-inclusive" checked={taxInclusive} onChange={(e) => setTaxInclusive(e.target.checked)} />
        </div>
        <Field label="Business GSTIN" hint="15-character GSTIN, e.g. 07ABCDE1234F1Z5">
          <Input value={sellerGstin} onChange={(e) => setSellerGstin(e.target.value.toUpperCase())} maxLength={15} className="uppercase" />
        </Field>
        <Field label="Business State" hint="Registered GST state — compared to the shipping address to decide CGST+SGST vs IGST.">
          <Input value={sellerState} onChange={(e) => setSellerState(e.target.value)} />
        </Field>
        <Field label="Business Legal Name" hint="Shown on invoices as the Sold By line.">
          <Input value={sellerLegalName} onChange={(e) => setSellerLegalName(e.target.value)} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Business Registered Address" hint="Shown on invoices.">
            <Textarea rows={2} value={sellerAddress} onChange={(e) => setSellerAddress(e.target.value)} />
          </Field>
        </div>
      </Fieldset>

      <Fieldset title="COD & Fraud Risk">
        <Field label="Max COD Order Value" hint="Orders above this amount can't use Cash on Delivery, regardless of risk level.">
          <Input type="number" step="1" min={0} value={maxCodOrderValue} onChange={(e) => setMaxCodOrderValue(Number(e.target.value))} />
        </Field>
        <Field label="Max COD Orders Per Customer" hint="Once a customer reaches this many COD orders in 90 days, further orders must be prepaid.">
          <Input type="number" step="1" min={0} value={maxCodOrdersPerCustomer} onChange={(e) => setMaxCodOrdersPerCustomer(Number(e.target.value))} />
        </Field>
        <Field label="High-Value COD Threshold" hint="Feeds the risk score for high-value COD orders from customers with little delivery history.">
          <Input type="number" step="1" min={0} value={highValueCodThreshold} onChange={(e) => setHighValueCodThreshold(Number(e.target.value))} />
        </Field>
        <div className="flex flex-col gap-3">
          <Checkbox label="Allow High Risk customers to use COD" checked={allowHighRiskCod} onChange={(e) => setAllowHighRiskCod(e.target.checked)} />
          <Checkbox
            label="Require OTP re-confirmation for High Risk COD orders"
            checked={requireConfirmOnHighRiskCod}
            onChange={(e) => setRequireConfirmOnHighRiskCod(e.target.checked)}
            disabled={!allowHighRiskCod}
          />
        </div>
      </Fieldset>

      <Fieldset title="Legal Pages">
        <div className="sm:col-span-2">
          <Field label="Cancellation Policy" hint="Shown at /cancellation. Edit this with your actual policy before launch.">
            <Textarea rows={5} value={cancellationPolicy} onChange={(e) => setCancellationPolicy(e.target.value)} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Return &amp; Refund Policy" hint="Shown at /returns. Separate paragraphs with a blank line.">
            <Textarea rows={7} value={returnPolicy} onChange={(e) => setReturnPolicy(e.target.value)} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Shipping Policy" hint="Shown at /shipping, below the delivery fee cards.">
            <Textarea rows={3} value={shippingPolicy} onChange={(e) => setShippingPolicy(e.target.value)} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Terms &amp; Conditions" hint="Shown at /terms. Customers must agree to this when creating an account.">
            <Textarea rows={7} value={termsAndConditions} onChange={(e) => setTermsAndConditions(e.target.value)} />
          </Field>
        </div>
      </Fieldset>

      <Fieldset title="Support">
        <Field label="WhatsApp Number" hint="Digits only, with country code, e.g. 919500000000">
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
        <Field label="Country Code" hint="2-letter ISO code, e.g. AE">
          <div className="flex items-center gap-2">
            <CountryFlag code={countryCode} className="h-4 w-6 shrink-0 rounded-[1px]" />
            <Input
              required
              maxLength={2}
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
              className="w-20 uppercase"
            />
          </div>
        </Field>
      </Fieldset>

      <fieldset className="border border-line p-5">
        <legend className="px-2 font-display text-lg">Promo Banners</legend>
        <p className="mt-1 text-xs text-ink-soft">
          The two full-width strips shown site-wide just below the header. Set a background photo to replace the
          solid color/gradient with an image.
        </p>

        <div className="mt-4 border-t border-line pt-4">
          <p className="mb-3 text-sm font-medium">&quot;Extra % Off&quot; Code Banner</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center">
              <Checkbox label="Show this banner" checked={codeBannerEnabled} onChange={(e) => setCodeBannerEnabled(e.target.checked)} />
            </div>
            <Field label="Links To" hint="e.g. /sale">
              <Input value={codeBannerLink} onChange={(e) => setCodeBannerLink(e.target.value)} />
            </Field>
            <Field label="Headline">
              <Input value={codeBannerHeadline} onChange={(e) => setCodeBannerHeadline(e.target.value)} />
            </Field>
            <Field label="Code Text">
              <Input value={codeBannerCodeText} onChange={(e) => setCodeBannerCodeText(e.target.value)} />
            </Field>
            <ColorField label="Background Color" value={codeBannerBgColor} onChange={setCodeBannerBgColor} />
            <ColorField label="Code Text Color" value={codeBannerAccentColor} onChange={setCodeBannerAccentColor} />
            <div className="sm:col-span-2">
              <Field label="Background Photo (optional)" hint="Replaces the solid background color with a photo when set.">
                <SingleImageUploader value={codeBannerImageUrl} onChange={setCodeBannerImageUrl} />
              </Field>
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-line pt-4">
          <p className="mb-3 text-sm font-medium">&quot;Favourite Brands&quot; Banner</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center">
              <Checkbox label="Show this banner" checked={brandsBannerEnabled} onChange={(e) => setBrandsBannerEnabled(e.target.checked)} />
            </div>
            <Field label="Links To" hint="e.g. /brands">
              <Input value={brandsBannerLink} onChange={(e) => setBrandsBannerLink(e.target.value)} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Tagline">
                <Input value={brandsBannerTagline} onChange={(e) => setBrandsBannerTagline(e.target.value)} />
              </Field>
            </div>
            <ColorField label="Gradient Start" value={brandsGradientFrom} onChange={setBrandsGradientFrom} />
            <ColorField label="Gradient Middle" value={brandsGradientVia} onChange={setBrandsGradientVia} />
            <ColorField label="Gradient End" value={brandsGradientTo} onChange={setBrandsGradientTo} />
            <div className="sm:col-span-2">
              <Field label="Background Photo (optional)" hint="Replaces the gradient with a photo when set.">
                <SingleImageUploader value={brandsBannerImageUrl} onChange={setBrandsBannerImageUrl} />
              </Field>
            </div>
          </div>

          <p className="mb-3 mt-5 text-xs uppercase tracking-[0.1em] text-ink-soft">Feature Blocks (icon + text)</p>
          <div className="flex flex-col gap-4">
            {brandsFeatures.map((f, i) => (
              <div key={i} className="grid gap-3 border border-line p-3 sm:grid-cols-[8rem_1fr]">
                <Field label="Icon">
                  <Select value={f.icon} onChange={(e) => updateBrandsFeature(i, { icon: e.target.value as "bag" | "truck" | "gift" })}>
                    <option value="bag">Shopping Bag</option>
                    <option value="truck">Delivery Truck</option>
                    <option value="gift">Gift</option>
                  </Select>
                </Field>
                <Field label="Text (one line each)">
                  <Textarea rows={2} value={f.linesText} onChange={(e) => updateBrandsFeature(i, { linesText: e.target.value })} />
                </Field>
              </div>
            ))}
          </div>
        </div>
      </fieldset>

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
        <Field label="Processing Time (days)" hint="Handling/dispatch days added before the shipping window starts.">
          <Input type="number" step="1" min={0} value={processingDays} onChange={(e) => setProcessingDays(Number(e.target.value))} />
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
