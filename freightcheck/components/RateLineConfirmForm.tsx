"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { RateLine } from "@/lib/extraction/schema";

type Props = {
  contractId: string;
  initialRateLines: RateLine[];
  alreadyConfirmed: boolean;
};

const EMPTY_ROW: RateLine = {
  origin: "",
  destination: "",
  vehicle_type: "",
  rate: 0,
  rate_basis: "per_trip",
  detention_free_days: null,
  detention_rate_per_day: null,
  diesel_escalation_clause: null,
};

export function RateLineConfirmForm({ contractId, initialRateLines, alreadyConfirmed }: Props) {
  const router = useRouter();
  const [rows, setRows] = useState<RateLine[]>(initialRateLines);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  function updateRow(index: number, patch: Partial<RateLine>) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleConfirm() {
    setStatus("saving");
    setError(null);
    const res = await fetch(`/api/rate-contracts/${contractId}/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rate_lines: rows }),
    });
    if (!res.ok) {
      const body = await res.json();
      setStatus("error");
      setError(body.error ?? "Could not save.");
      return;
    }
    setStatus("idle");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Review what the AI read from this contract. Fix anything wrong, then confirm once — every
        future bill from this transporter is audited against this rate master.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-zinc-300 text-left dark:border-zinc-700">
              <th className="p-2">Origin</th>
              <th className="p-2">Destination</th>
              <th className="p-2">Vehicle type</th>
              <th className="p-2">Rate</th>
              <th className="p-2">Basis</th>
              <th className="p-2">Detention free days</th>
              <th className="p-2">Detention ₹/day</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-zinc-100 dark:border-zinc-900">
                <td className="p-1">
                  <input className="w-full rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900" value={row.origin} onChange={(e) => updateRow(i, { origin: e.target.value })} />
                </td>
                <td className="p-1">
                  <input className="w-full rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900" value={row.destination} onChange={(e) => updateRow(i, { destination: e.target.value })} />
                </td>
                <td className="p-1">
                  <input className="w-full rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900" value={row.vehicle_type} onChange={(e) => updateRow(i, { vehicle_type: e.target.value })} />
                </td>
                <td className="p-1">
                  <input type="number" className="w-24 rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900" value={row.rate} onChange={(e) => updateRow(i, { rate: Number(e.target.value) })} />
                </td>
                <td className="p-1">
                  <select className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900" value={row.rate_basis} onChange={(e) => updateRow(i, { rate_basis: e.target.value as RateLine["rate_basis"] })}>
                    <option value="per_trip">per trip</option>
                    <option value="per_km">per km</option>
                    <option value="per_ton">per ton</option>
                  </select>
                </td>
                <td className="p-1">
                  <input type="number" className="w-20 rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900" value={row.detention_free_days ?? ""} onChange={(e) => updateRow(i, { detention_free_days: e.target.value === "" ? null : Number(e.target.value) })} />
                </td>
                <td className="p-1">
                  <input type="number" className="w-24 rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900" value={row.detention_rate_per_day ?? ""} onChange={(e) => updateRow(i, { detention_rate_per_day: e.target.value === "" ? null : Number(e.target.value) })} />
                </td>
                <td className="p-1">
                  <button type="button" onClick={() => removeRow(i)} className="text-red-600">
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={() => setRows((prev) => [...prev, { ...EMPTY_ROW }])}
        className="w-fit rounded border border-zinc-300 px-3 py-1 text-sm dark:border-zinc-700"
      >
        + Add lane
      </button>

      <button
        type="button"
        onClick={handleConfirm}
        disabled={status === "saving"}
        className="w-fit rounded-full bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
      >
        {status === "saving" ? "Saving…" : alreadyConfirmed ? "Save changes" : "Confirm rate master"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
