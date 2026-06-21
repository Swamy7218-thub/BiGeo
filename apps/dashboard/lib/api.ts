const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export type Application = {
  id: string;
  status: string;
  score: number | null;
  score_breakdown: Record<string, number> | null;
  submitted_at: string | null;
  notes: string | null;
  company: string;
  title: string;
  apply_url: string | null;
};

export type DailyReport = {
  report_date: string;
  applied_count: number;
  interview_count: number;
  rejection_count: number;
  pending_approval_count: number;
  summary_text: string;
};

export type Lesson = {
  week_start: string;
  insight_text: string;
  sample_size: number;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`API ${path} failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  listApplications: (status?: string) =>
    request<Application[]>(`/applications${status ? `?status=${status}` : ""}`),
  approve: (id: string) => request<{ approved: boolean }>(`/applications/${id}/approve`, { method: "POST" }),
  reject: (id: string) => request<{ rejected: boolean }>(`/applications/${id}/reject`, { method: "POST" }),
  latestReport: (userId: string) => request<DailyReport>(`/reports/${userId}/latest`),
  lessons: (userId: string) => request<Lesson[]>(`/lessons/${userId}`),
  createPacket: (body: {
    user_id: string;
    company: string;
    title: string;
    description: string;
    apply_url: string;
    location?: string;
  }) => request<{ application_id: string; resume_file_url: string; cover_letter_file_url: string; apply_url: string }>(
    "/packets",
    { method: "POST", body: JSON.stringify(body) }
  ),
};
