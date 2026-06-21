"use client";

import { useState } from "react";
import { api } from "@/lib/api";

const DEFAULT_USER_ID = process.env.NEXT_PUBLIC_DEFAULT_USER_ID || "";

export default function PacketsPage() {
  const [form, setForm] = useState({
    company: "",
    title: "",
    location: "",
    description: "",
    apply_url: "",
  });
  const [result, setResult] = useState<{
    apply_url: string;
    resume_file_url: string;
    cover_letter_file_url: string;
    ats_check_passed?: boolean;
    ats_check_issues?: string[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const packet = await api.createPacket({ user_id: DEFAULT_USER_ID, ...form });
      setResult(packet);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate packet");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold mb-2">New "Ready to Apply" Packet</h1>
      <p className="text-sm text-gray-500 mb-4">
        For LinkedIn, Indeed, and Wellfound listings — paste the job details you found yourself.
        The agent generates a tailored resume and cover letter and hands back the original link;
        submission there is always a manual click, by design.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3 bg-white border rounded-lg p-4">
        <div>
          <label className="block text-sm font-medium mb-1">Company</label>
          <input
            required
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
            className="w-full border rounded px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Job title</label>
          <input
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full border rounded px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Location (optional)</label>
          <input
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            className="w-full border rounded px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Job description</label>
          <textarea
            required
            rows={8}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full border rounded px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Apply URL</label>
          <input
            required
            type="url"
            value={form.apply_url}
            onChange={(e) => setForm({ ...form, apply_url: e.target.value })}
            className="w-full border rounded px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Generating…" : "Generate packet"}
        </button>
      </form>

      {error && <p className="text-red-600 text-sm mt-4">{error}</p>}

      {result && (
        <div className="mt-4 bg-white border rounded-lg p-4 space-y-2">
          <h2 className="font-medium">Packet ready</h2>
          <p className="text-sm">Resume: {result.resume_file_url}</p>
          <p className="text-sm">Cover letter: {result.cover_letter_file_url}</p>
          {result.ats_check_passed === false && (
            <p className="text-sm text-amber-700">ATS check flagged: {result.ats_check_issues?.join("; ")}</p>
          )}
          <a
            href={result.apply_url}
            target="_blank"
            rel="noreferrer"
            className="inline-block mt-2 px-4 py-2 text-sm rounded bg-green-600 text-white hover:bg-green-700"
          >
            Open posting and apply →
          </a>
        </div>
      )}
    </div>
  );
}
