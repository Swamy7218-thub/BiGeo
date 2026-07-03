"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function BillUploadForm() {
  const router = useRouter();
  const [transporterName, setTransporterName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !transporterName.trim()) return;

    setStatus("uploading");
    setError(null);
    const form = new FormData();
    form.append("file", file);
    form.append("transporter_name", transporterName);

    const res = await fetch("/api/bills", { method: "POST", body: form });
    const body = await res.json();

    if (!res.ok) {
      setStatus("error");
      setError(body.error ?? "Upload failed.");
      return;
    }

    setStatus("idle");
    setFile(null);
    setTransporterName("");
    router.push(`/dashboard/bills/${body.bill_id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <h2 className="font-medium">Upload a transporter bill</h2>
      <input
        type="text"
        placeholder="Transporter name"
        value={transporterName}
        onChange={(e) => setTransporterName(e.target.value)}
        className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        required
      />
      <input
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.txt"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="text-sm"
        required
      />
      <button
        type="submit"
        disabled={status === "uploading"}
        className="w-fit rounded-full bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
      >
        {status === "uploading" ? "Extracting and auditing…" : "Upload and audit"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
