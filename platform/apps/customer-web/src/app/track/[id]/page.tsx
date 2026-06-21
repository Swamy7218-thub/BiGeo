"use client";

import { useEffect, useState } from "react";
import { getBooking } from "@/lib/api";

const STATUS_STEPS = ["booked", "picked_up", "in_transit", "delivered"];

export default function TrackPage({ params }: { params: { id: string } }) {
  const [booking, setBooking] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getBooking(params.id)
      .then(setBooking)
      .catch(() => setError("Consignment not found. Check the ID and try again."));
  }, [params.id]);

  if (error) {
    return (
      <main className="mx-auto max-w-lg px-6 py-12 text-center">
        <p className="text-red-400">{error}</p>
      </main>
    );
  }

  if (!booking) {
    return (
      <main className="mx-auto max-w-lg px-6 py-12 text-center text-white/60">Loading...</main>
    );
  }

  const currentIdx = STATUS_STEPS.indexOf(booking.status as string);

  return (
    <main className="mx-auto max-w-lg px-6 py-12">
      <h1 className="mb-2 text-2xl font-bold">Track Shipment</h1>
      <p className="mb-6 text-white/60">Consignment ID: {params.id}</p>

      <div className="flex justify-between">
        {STATUS_STEPS.map((s, i) => (
          <div key={s} className="flex flex-1 flex-col items-center">
            <div
              className={`h-3 w-3 rounded-full ${
                i <= currentIdx ? "bg-accent-500" : "bg-white/20"
              }`}
            />
            <span className="mt-2 text-center text-xs capitalize text-white/70">
              {s.replace("_", " ")}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-lg border border-border bg-surface p-6">
        <p>
          <span className="text-white/60">Origin:</span> {String(booking.origin_address)}
        </p>
        <p className="mt-2">
          <span className="text-white/60">Destination:</span> {String(booking.destination_address)}
        </p>
        <p className="mt-2">
          <span className="text-white/60">Last updated:</span> {String(booking.updated_at)}
        </p>
      </div>
    </main>
  );
}
