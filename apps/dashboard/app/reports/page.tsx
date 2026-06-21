"use client";

import { useEffect, useState } from "react";
import { api, DailyReport, Lesson } from "@/lib/api";

const DEFAULT_USER_ID = process.env.NEXT_PUBLIC_DEFAULT_USER_ID || "";

export default function ReportsPage() {
  const [report, setReport] = useState<DailyReport | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!DEFAULT_USER_ID) {
      setError("Set NEXT_PUBLIC_DEFAULT_USER_ID to load reports");
      return;
    }
    Promise.all([api.latestReport(DEFAULT_USER_ID), api.lessons(DEFAULT_USER_ID)])
      .then(([r, l]) => {
        setReport(r);
        setLessons(l);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load reports"));
  }, []);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold mb-4">Daily Report</h1>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        {report && (
          <div className="bg-white border rounded-lg p-4 grid grid-cols-4 gap-4 text-center">
            <Stat label="Applied" value={report.applied_count} />
            <Stat label="Interviews" value={report.interview_count} />
            <Stat label="Rejections" value={report.rejection_count} />
            <Stat label="Awaiting approval" value={report.pending_approval_count} />
          </div>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">Lessons Learned</h2>
        <p className="text-sm text-gray-500 mb-3">
          Weekly statistical reweighting, not fine-tuning — used as soft guidance for resume
          tailoring, never as license to invent facts.
        </p>
        {lessons.length === 0 ? (
          <p className="text-sm text-gray-500">No lessons recorded yet.</p>
        ) : (
          <ul className="space-y-2">
            {lessons.map((l) => (
              <li key={l.week_start} className="bg-white border rounded-lg p-3 text-sm">
                <div className="text-gray-500 mb-1">
                  Week of {l.week_start} · n={l.sample_size}
                </div>
                <div className="whitespace-pre-line">{l.insight_text}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}
