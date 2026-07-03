"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type PendingPod = { file: File; lrNumber: string };

// Filenames are usually saved as the LR number by whoever photographs the
// challan — pre-fill from the filename, but let the clerk correct it before
// upload since that's the only place a wrong match would slip in.
function guessLrNumber(filename: string): string {
  return filename.replace(/\.[^/.]+$/, "");
}

export function PodUploadForm({ billId }: { billId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState<PendingPod[]>([]);
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  function handleFiles(files: FileList | null) {
    if (!files) return;
    setPending(Array.from(files).map((file) => ({ file, lrNumber: guessLrNumber(file.name) })));
  }

  async function handleUpload() {
    setStatus("uploading");
    setError(null);
    try {
      for (const item of pending) {
        const form = new FormData();
        form.append("file", item.file);
        form.append("lr_number", item.lrNumber);
        const res = await fetch(`/api/bills/${billId}/pods`, { method: "POST", body: form });
        if (!res.ok) {
          const body = await res.json();
          throw new Error(body.error ?? `Failed to upload ${item.file.name}`);
        }
      }
      setPending([]);
      setStatus("idle");
      router.refresh();
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Upload failed.");
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <h2 className="font-medium">Upload PODs</h2>
      <input
        type="file"
        accept="image/*,.pdf"
        multiple
        onChange={(e) => handleFiles(e.target.files)}
        className="text-sm"
      />
      {pending.length > 0 && (
        <ul className="flex flex-col gap-2">
          {pending.map((item, i) => (
            <li key={i} className="flex items-center gap-2 text-sm">
              <span className="w-48 truncate">{item.file.name}</span>
              <span>LR</span>
              <input
                className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
                value={item.lrNumber}
                onChange={(e) =>
                  setPending((prev) =>
                    prev.map((p, j) => (j === i ? { ...p, lrNumber: e.target.value } : p))
                  )
                }
              />
            </li>
          ))}
        </ul>
      )}
      {pending.length > 0 && (
        <button
          type="button"
          onClick={handleUpload}
          disabled={status === "uploading"}
          className="w-fit rounded-full bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {status === "uploading" ? "Uploading…" : `Upload ${pending.length} POD(s)`}
        </button>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
