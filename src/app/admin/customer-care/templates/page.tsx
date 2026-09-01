import { getSectionAccess } from "@/lib/admin-auth";
import { CUSTOMER_CARE_MANAGER_ROLES } from "@/lib/admin-permissions";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { db } from "@/lib/db";
import { TemplateForm } from "./TemplateForm";

export const metadata = { title: "Reply Templates" };

export default async function TemplatesPage() {
  const session = await getSectionAccess(CUSTOMER_CARE_MANAGER_ROLES);
  if (!session) return <AccessDenied />;

  const templates = await db.ticketReplyTemplate.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl">Reply Templates</h1>
        <p className="mt-1 text-sm text-ink-soft">Reusable canned replies staff can insert and edit before sending.</p>
      </div>

      <div>
        <h2 className="mb-3 font-display text-lg">New Template</h2>
        <TemplateForm />
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="font-display text-lg">Existing Templates</h2>
        {templates.length === 0 && <p className="text-sm text-ink-soft">No templates yet.</p>}
        {templates.map((t) => (
          <TemplateForm key={t.id} initial={t} />
        ))}
      </div>
    </div>
  );
}
