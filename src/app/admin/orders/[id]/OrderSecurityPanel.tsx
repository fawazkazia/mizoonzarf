import { Badge } from "@/components/ui/Badge";
import { RISK_REASON_LABELS } from "@/lib/risk/computeOrderRisk";
import type { RiskLevel } from "@/generated/prisma/client";

export function OrderSecurityPanel({
  riskLevel,
  riskReasons,
  phone,
  phoneVerified,
  paymentMethod,
  codConfirmedAt,
}: {
  riskLevel: RiskLevel;
  riskReasons: string[];
  phone: string | null;
  phoneVerified: boolean;
  paymentMethod: string;
  codConfirmedAt: Date | null;
}) {
  return (
    <div className="border border-line p-5">
      <h2 className="mb-4 font-display text-lg">Order Security</h2>
      <div className="flex flex-col gap-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-ink-soft">Risk Level</span>
          <Badge tone={riskLevel === "HIGH" ? "sale" : riskLevel === "LOW" ? "success" : "outline"}>{riskLevel}</Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-ink-soft">Mobile Number</span>
          <span>{phone ?? "—"}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-ink-soft">Verified at Order Time</span>
          <Badge tone={phoneVerified ? "success" : "sale"}>{phoneVerified ? "Verified" : "Not Verified"}</Badge>
        </div>
        {paymentMethod === "COD" && (
          <div className="flex items-center justify-between">
            <span className="text-ink-soft">COD Confirmation</span>
            <span>{codConfirmedAt ? codConfirmedAt.toLocaleString() : "Not required"}</span>
          </div>
        )}
        {riskReasons.length > 0 && (
          <div>
            <p className="mb-1.5 text-ink-soft">Risk Factors</p>
            <ul className="flex flex-col gap-1 text-xs">
              {riskReasons.map((reason) => (
                <li key={reason} className="border-l-2 border-sale pl-2">
                  {RISK_REASON_LABELS[reason] ?? reason}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
