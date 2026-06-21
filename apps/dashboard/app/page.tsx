"use client";

import { useEffect, useState } from "react";
import { api, Application } from "@/lib/api";

const STATUS_TABS = ["pending_approval", "queued", "submitted", "interview", "rejected"] as const;

const STATUS_COLORS: Record<string, string> = {
  pending_approval: "bg-amber-100 text-amber-800",
  queued: "bg-blue-100 text-blue-800",
  submitted: "bg-gray-100 text-gray-800",
  interview: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  offer: "bg-purple-100 text-purple-800",
};

export default function ApplicationsPage() {
  const [tab, setTab] = useState<(typeof STATUS_TABS)[number]>("pending_approval");
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listApplications(tab);
      setApps(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load applications");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  async function handleApprove(id: string) {
    await api.approve(id);
    setApps((prev) => prev.filter((a) => a.id !== id));
  }

  async function handleReject(id: string) {
    await api.reject(id);
    setApps((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Applications</h1>

      <div className="flex gap-2 mb-4 border-b">
        {STATUS_TABS.map((s) => (
          <button
            key={s}
            onClick={() => setTab(s)}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px ${
              tab === s ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            {s.replace("_", " ")}
          </button>
        ))}
      </div>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : apps.length === 0 ? (
        <p className="text-sm text-gray-500">No applications in this state.</p>
      ) : (
        <ul className="space-y-3">
          {apps.map((app) => (
            <li key={app.id} className="bg-white border rounded-lg p-4 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{app.title}</span>
                  <span className="text-gray-500">@ {app.company}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[app.status] ?? "bg-gray-100"}`}>
                    {app.status}
                  </span>
                </div>
                {app.score !== null && (
                  <p className="text-sm text-gray-500 mt-1">Fit score: {app.score}</p>
                )}
                {app.notes && <p className="text-sm text-gray-500 mt-1">{app.notes}</p>}
                {app.apply_url && (
                  <a
                    href={app.apply_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    View posting
                  </a>
                )}
              </div>

              {tab === "pending_approval" && (
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleApprove(app.id)}
                    className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(app.id)}
                    className="px-3 py-1.5 text-sm rounded border border-gray-300 hover:bg-gray-50"
                  >
                    Skip
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
