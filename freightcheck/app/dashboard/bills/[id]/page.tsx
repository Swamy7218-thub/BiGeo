import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/server";
import { PodUploadForm } from "@/components/PodUploadForm";

export const dynamic = "force-dynamic";

type Flag = {
  flag_type: string;
  expected_amount: number | null;
  claimed_amount: number | null;
  status: string;
  message: string | null;
};

type TripLine = {
  id: string;
  lr_number: string | null;
  trip_date: string | null;
  origin: string;
  destination: string;
  vehicle_number: string | null;
  vehicle_type: string | null;
  base_amount: number;
  extraction_confidence: number;
  flags: Flag[];
};

export default async function BillDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = supabaseAdmin();

  const { data: bill } = await db
    .from("bills")
    .select("*, transporters(name)")
    .eq("id", id)
    .single();
  if (!bill) notFound();

  const { data: tripLines } = await db
    .from("trip_lines")
    .select("id, lr_number, trip_date, origin, destination, vehicle_number, vehicle_type, base_amount, extraction_confidence, flags(flag_type, expected_amount, claimed_amount, status, message)")
    .eq("bill_id", id)
    .order("trip_date", { ascending: true })
    .returns<TripLine[]>();

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          {bill.transporters?.name ?? "-"} — {bill.bill_number ?? "Bill"}
        </h1>
        <a href={`/api/bills/${id}/export`} className="rounded-full border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700">
          Download Excel
        </a>
      </div>

      <div className="flex gap-6 text-sm">
        <p>Claimed: <span className="font-semibold">₹{bill.total_claimed}</span></p>
        <p>Approved: <span className="font-semibold text-green-600">₹{bill.total_approved}</span></p>
        <p>Flagged: <span className="font-semibold text-red-600">₹{bill.total_flagged}</span></p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-zinc-300 text-left dark:border-zinc-700">
              <th className="p-2">LR</th>
              <th className="p-2">Date</th>
              <th className="p-2">Lane</th>
              <th className="p-2">Vehicle</th>
              <th className="p-2">Amount</th>
              <th className="p-2">Confidence</th>
              <th className="p-2">Flags</th>
            </tr>
          </thead>
          <tbody>
            {(tripLines ?? []).map((trip) => {
              const openFlags = trip.flags.filter((f) => f.status === "open");
              return (
                <tr key={trip.id} className="border-b border-zinc-100 dark:border-zinc-900">
                  <td className="p-2">{trip.lr_number ?? "-"}</td>
                  <td className="p-2">{trip.trip_date ?? "-"}</td>
                  <td className="p-2">{trip.origin} → {trip.destination}</td>
                  <td className="p-2">{trip.vehicle_number ?? "-"} {trip.vehicle_type ? `(${trip.vehicle_type})` : ""}</td>
                  <td className="p-2">₹{trip.base_amount}</td>
                  <td className="p-2">
                    {trip.extraction_confidence < 0.7 ? (
                      <span className="text-amber-600">{Math.round(trip.extraction_confidence * 100)}% — review</span>
                    ) : (
                      `${Math.round(trip.extraction_confidence * 100)}%`
                    )}
                  </td>
                  <td className="p-2">
                    {openFlags.length === 0 ? (
                      <span className="text-zinc-400">—</span>
                    ) : (
                      <ul className="flex flex-col gap-1">
                        {openFlags.map((f, i) => (
                          <li key={i} className="text-red-600">
                            <span className="font-medium">{f.flag_type}</span>: {f.message}
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <PodUploadForm billId={id} />
    </div>
  );
}
