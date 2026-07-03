import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/server";
import { ContractUploadForm } from "@/components/ContractUploadForm";

export const dynamic = "force-dynamic";

type ContractRow = {
  id: string;
  status: string;
  valid_from: string | null;
  valid_to: string | null;
  created_at: string;
  transporters: { name: string } | null;
};

export default async function ContractsPage() {
  const db = supabaseAdmin();
  const { data: contracts } = await db
    .from("rate_contracts")
    .select("id, status, valid_from, valid_to, created_at, transporters(name)")
    .order("created_at", { ascending: false })
    .returns<ContractRow[]>();

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Rate contracts</h1>
        <Link href="/dashboard" className="text-sm underline">
          ← Bills
        </Link>
      </div>

      <ContractUploadForm />

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-zinc-300 text-left dark:border-zinc-700">
            <th className="p-2">Transporter</th>
            <th className="p-2">Status</th>
            <th className="p-2">Valid from</th>
            <th className="p-2">Valid to</th>
          </tr>
        </thead>
        <tbody>
          {(contracts ?? []).map((contract) => (
            <tr key={contract.id} className="border-b border-zinc-100 dark:border-zinc-900">
              <td className="p-2">
                <Link href={`/dashboard/contracts/${contract.id}`} className="underline">
                  {contract.transporters?.name ?? "-"}
                </Link>
              </td>
              <td className="p-2">{contract.status}</td>
              <td className="p-2">{contract.valid_from ?? "-"}</td>
              <td className="p-2">{contract.valid_to ?? "-"}</td>
            </tr>
          ))}
          {(!contracts || contracts.length === 0) && (
            <tr>
              <td colSpan={4} className="p-4 text-center text-zinc-500">
                No rate contracts uploaded yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
