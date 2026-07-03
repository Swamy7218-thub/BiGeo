import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/server";
import { BillUploadForm } from "@/components/BillUploadForm";

export const dynamic = "force-dynamic";

type BillRow = {
  id: string;
  bill_number: string | null;
  bill_date: string | null;
  status: string;
  total_claimed: number;
  total_approved: number;
  total_flagged: number;
  created_at: string;
  transporters: { name: string } | null;
};

export default async function DashboardPage() {
  const db = supabaseAdmin();
  const { data: bills } = await db
    .from("bills")
    .select("id, bill_number, bill_date, status, total_claimed, total_approved, total_flagged, created_at, transporters(name)")
    .order("created_at", { ascending: false })
    .returns<BillRow[]>();

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Bills</h1>
        <Link href="/dashboard/contracts" className="text-sm underline">
          Rate contracts →
        </Link>
      </div>

      <BillUploadForm />

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-zinc-300 text-left dark:border-zinc-700">
            <th className="p-2">Transporter</th>
            <th className="p-2">Bill #</th>
            <th className="p-2">Status</th>
            <th className="p-2">Claimed</th>
            <th className="p-2">Approved</th>
            <th className="p-2">Flagged</th>
          </tr>
        </thead>
        <tbody>
          {(bills ?? []).map((bill) => (
            <tr key={bill.id} className="border-b border-zinc-100 dark:border-zinc-900">
              <td className="p-2">
                <Link href={`/dashboard/bills/${bill.id}`} className="underline">
                  {bill.transporters?.name ?? "-"}
                </Link>
              </td>
              <td className="p-2">{bill.bill_number ?? "-"}</td>
              <td className="p-2">{bill.status}</td>
              <td className="p-2">₹{bill.total_claimed}</td>
              <td className="p-2">₹{bill.total_approved}</td>
              <td className="p-2 text-red-600">₹{bill.total_flagged}</td>
            </tr>
          ))}
          {(!bills || bills.length === 0) && (
            <tr>
              <td colSpan={6} className="p-4 text-center text-zinc-500">
                No bills uploaded yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
