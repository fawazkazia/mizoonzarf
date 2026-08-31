import { db } from "@/lib/db";
import { Table, Th, EmptyRow } from "@/components/admin/Table";
import { AccountRow } from "./AccountRow";
import { AddAccountForm } from "./AddAccountForm";

export const metadata = { title: "Chart of Accounts" };

export default async function ChartOfAccountsPage() {
  const accounts = await db.ledgerAccount.findMany({ orderBy: { code: "asc" } });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl">Chart of Accounts</h1>
      <p className="max-w-2xl text-sm text-ink-soft">
        Code and type are locked after creation — changing them would silently corrupt every past journal entry and report
        that already reference this account. Rename or deactivate instead; add a new account for anything that needs a
        different code or type.
      </p>

      <AddAccountForm />

      <Table>
        <thead>
          <tr>
            <Th>Code</Th>
            <Th>Name</Th>
            <Th>Type</Th>
            <Th>Contra</Th>
            <Th>Active</Th>
          </tr>
        </thead>
        <tbody>
          {accounts.length === 0 && <EmptyRow colSpan={5}>No accounts yet.</EmptyRow>}
          {accounts.map((a) => (
            <AccountRow key={a.id} id={a.id} code={a.code} type={a.type} isContra={a.isContra} name={a.name} isActive={a.isActive} />
          ))}
        </tbody>
      </Table>
    </div>
  );
}
