import { ButtonLink } from "@/components/ui/Button";

export function AccessDenied({ message, backHref = "/admin", backLabel = "Back to Dashboard" }: { message?: string; backHref?: string; backLabel?: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="font-display text-3xl">Access Denied</h1>
      <p className="max-w-sm text-ink-soft">
        {message ?? "Your account doesn't have permission to view this section. Contact a store administrator if you believe this is a mistake."}
      </p>
      <ButtonLink href={backHref}>{backLabel}</ButtonLink>
    </div>
  );
}
