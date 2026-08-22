import { cn } from "@/lib/utils";

export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto border border-line bg-paper">
      <table className="w-full min-w-[720px] text-left text-sm">{children}</table>
    </div>
  );
}

export function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={cn("border-b border-line bg-paper-dim px-4 py-3 text-xs font-medium uppercase tracking-wide text-ink-soft", className)}>
      {children}
    </th>
  );
}

export function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn("border-b border-line px-4 py-3 align-middle", className)}>{children}</td>;
}

export function EmptyRow({ colSpan, children }: { colSpan: number; children: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center text-ink-soft">
        {children}
      </td>
    </tr>
  );
}
