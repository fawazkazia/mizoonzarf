import { getSectionAccess } from "@/lib/admin-auth";
import { CUSTOMER_CARE_MANAGER_ROLES } from "@/lib/admin-permissions";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { getCustomerCareReport } from "@/lib/data/customer-care-reports";
import { resolvePresetRange, DATE_PRESETS, type DatePreset } from "@/lib/data/date-presets";
import { StatCard } from "@/components/admin/StatCard";
import { Table, Th, Td, EmptyRow } from "@/components/admin/Table";
import { ButtonLink } from "@/components/ui/Button";
import { ReportsDateFilter } from "./ReportsDateFilter";

export const metadata = { title: "Customer Care Reports" };

interface PageProps {
  searchParams: Promise<{ preset?: string; from?: string; to?: string }>;
}

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export default async function CustomerCareReportsPage({ searchParams }: PageProps) {
  const session = await getSectionAccess(CUSTOMER_CARE_MANAGER_ROLES);
  if (!session) return <AccessDenied />;

  const sp = await searchParams;
  const isValidPreset = (v?: string): v is DatePreset => !!v && (DATE_PRESETS as readonly string[]).includes(v);
  const preset: DatePreset | null = !sp.from && !sp.to ? (isValidPreset(sp.preset) ? sp.preset : "30d") : null;
  const range = preset
    ? resolvePresetRange(preset)
    : {
        from: sp.from ? new Date(sp.from) : resolvePresetRange("30d").from,
        to: sp.to ? new Date(new Date(sp.to).setHours(23, 59, 59, 999)) : new Date(),
      };

  const report = await getCustomerCareReport(range);
  const exportHref = `/api/admin/customer-care/reports/export?from=${range.from.toISOString()}&to=${range.to.toISOString()}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Customer Care Reports</h1>
        <ButtonLink href={exportHref} variant="secondary">
          Export CSV
        </ButtonLink>
      </div>

      <ReportsDateFilter activePreset={preset} from={toDateInputValue(range.from)} to={toDateInputValue(range.to)} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Tickets" value={String(report.total)} />
        <StatCard label="Open" value={String(report.open)} />
        <StatCard label="Resolved" value={String(report.resolved)} />
        <StatCard label="Escalated" value={String(report.escalated)} tone={report.escalated > 0 ? "warning" : "default"} />
        <StatCard label="Avg First Response" value={`${report.avgFirstResponseHours}h`} />
        <StatCard label="Avg Resolution Time" value={`${report.avgResolutionHours}h`} />
        <StatCard label="Cancellation Tickets" value={String(report.cancellationCount)} />
        <StatCard label="Return Tickets" value={String(report.returnCount)} />
        <StatCard label="Refund Tickets" value={String(report.refundCount)} />
        <StatCard label="Delivery Complaints" value={String(report.deliveryCount)} />
        <StatCard label="General Complaints" value={String(report.complaintCount)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 font-display text-lg">By Category</h2>
          <Table compact>
            <thead>
              <tr>
                <Th>Category</Th>
                <Th className="text-right">Tickets</Th>
              </tr>
            </thead>
            <tbody>
              {report.byCategory.length === 0 && <EmptyRow colSpan={2}>No tickets in this range.</EmptyRow>}
              {report.byCategory.map((c) => (
                <tr key={c.category}>
                  <Td>{c.category.replace(/_/g, " ")}</Td>
                  <Td className="text-right">{c.count}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
        <div>
          <h2 className="mb-3 font-display text-lg">By Employee</h2>
          <Table compact>
            <thead>
              <tr>
                <Th>Employee</Th>
                <Th className="text-right">Tickets</Th>
              </tr>
            </thead>
            <tbody>
              {report.byEmployee.length === 0 && <EmptyRow colSpan={2}>No tickets in this range.</EmptyRow>}
              {report.byEmployee.map((e) => (
                <tr key={e.name}>
                  <Td>{e.name}</Td>
                  <Td className="text-right">{e.count}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </div>
    </div>
  );
}
