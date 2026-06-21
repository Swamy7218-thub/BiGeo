"use client";

import { useState } from "react";
import Link from "next/link";
import { getQuote, type Quote } from "@/lib/api";

export default function QuotePage() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [weight, setWeight] = useState("");
  const [serviceLevel, setServiceLevel] = useState<"standard" | "express">("standard");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await getQuote({
        origin_address: origin,
        destination_address: destination,
        weight_kg: parseFloat(weight),
        service_level: serviceLevel,
      });
      setQuote(result);
    } catch {
      setError("Could not fetch a quote. Check the addresses and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-12">
      <h1 className="mb-6 text-2xl font-bold">Instant Price &amp; Time Calculator</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          className="rounded-lg border border-border bg-surface px-4 py-3"
          placeholder="Pickup address (village, mandal, district)"
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
          required
        />
        <input
          className="rounded-lg border border-border bg-surface px-4 py-3"
          placeholder="Drop address"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          required
        />
        <input
          className="rounded-lg border border-border bg-surface px-4 py-3"
          placeholder="Weight (kg)"
          type="number"
          min="0.1"
          step="0.1"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          required
        />
        <select
          className="rounded-lg border border-border bg-surface px-4 py-3"
          value={serviceLevel}
          onChange={(e) => setServiceLevel(e.target.value as "standard" | "express")}
        >
          <option value="standard">Standard</option>
          <option value="express">Express</option>
        </select>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-accent-500 px-6 py-3 font-semibold hover:bg-accent-600 disabled:opacity-50"
        >
          {loading ? "Calculating..." : "Get Quote"}
        </button>
      </form>

      {error && <p className="mt-4 text-red-400">{error}</p>}

      {quote && (
        <div className="mt-6 rounded-lg border border-border bg-surface p-6">
          <p className="text-3xl font-bold text-accent-500">₹{quote.price_inr}</p>
          <p className="text-white/70">
            {quote.distance_km} km · ETA ~{quote.eta_hours} hrs · {quote.billable_kg} kg billable
          </p>
          <Link
            href="/book"
            className="mt-4 inline-block rounded-lg bg-accent-500 px-6 py-2 font-semibold hover:bg-accent-600"
          >
            Proceed to Book →
          </Link>
        </div>
      )}
    </main>
  );
}
