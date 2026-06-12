"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Zap, MapPin, Route, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

export default function OptimizerPage() {
  const [mode, setMode] = useState<"hubs" | "routes">("hubs");
  const [numHubs, setNumHubs] = useState(5);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState("");

  const samplePoints = [
    { id: "P1", location: { lat: 17.385, lng: 78.487 }, demand_kg: 500 },
    { id: "P2", location: { lat: 18.101, lng: 78.852 }, demand_kg: 350 },
    { id: "P3", location: { lat: 18.672, lng: 78.094 }, demand_kg: 280 },
    { id: "P4", location: { lat: 17.978, lng: 79.594 }, demand_kg: 420 },
    { id: "P5", location: { lat: 18.438, lng: 79.128 }, demand_kg: 190 },
    { id: "P6", location: { lat: 17.685, lng: 80.001 }, demand_kg: 310 },
    { id: "P7", location: { lat: 16.502, lng: 79.895 }, demand_kg: 260 },
    { id: "P8", location: { lat: 17.250, lng: 78.199 }, demand_kg: 440 },
  ];

  async function runOptimization() {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await api.post("/v2/hubs/optimize", {
        delivery_points: samplePoints,
        num_hubs: numHubs,
      });
      setResult(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Optimization failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Network Optimizer</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">Run K-means hub placement and VRP route optimization</p>
      </div>

      <div className="bg-[var(--surface)] border rounded-xl p-5 space-y-4">
        <div className="flex gap-2">
          {(["hubs", "routes"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                mode === m ? "bg-[var(--green)] text-black" : "bg-white/5 text-[var(--text-muted)] hover:text-white"
              }`}
            >
              {m === "hubs" ? "Hub Placement" : "Route Optimization"}
            </button>
          ))}
        </div>

        <div>
          <label className="text-xs text-[var(--text-muted)] mb-1 block">Number of Hubs</label>
          <input
            type="number"
            min={1}
            max={20}
            value={numHubs}
            onChange={(e) => setNumHubs(Number(e.target.value))}
            className="w-24 bg-black/30 border rounded-lg px-3 py-1.5 text-sm text-white"
          />
        </div>

        <div className="text-xs text-[var(--text-muted)] bg-black/20 rounded-lg p-3">
          Running K-means++ on {samplePoints.length} Telangana delivery points
        </div>

        <button
          onClick={runOptimization}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2 bg-[var(--green)] text-black rounded-lg text-sm font-semibold hover:bg-green-400 transition-colors disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          {loading ? "Optimizing…" : "Run Optimization"}
        </button>

        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[var(--surface)] border rounded-xl p-5"
        >
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[var(--green)]" />
            Optimization Result
          </h3>
          <pre className="text-xs text-[var(--text-muted)] overflow-auto max-h-80">
            {JSON.stringify(result, null, 2)}
          </pre>
        </motion.div>
      )}
    </div>
  );
}
