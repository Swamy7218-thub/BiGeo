import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Card } from "@/components/ui"
import { NewTransporterForm } from "@/components/NewTransporterForm"

export default async function TransportersPage() {
  const supabase = await createClient()
  const { data: transporters } = await supabase.from("transporters").select("*").order("name")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Transporters</h1>
          <p className="text-sm text-slate-500">Manage transporters and their rate contracts (FR-4).</p>
        </div>
      </div>

      <NewTransporterForm />

      <Card>
        <ul className="divide-y divide-slate-200">
          {(transporters ?? []).map((t) => (
            <li key={t.id}>
              <Link href={`/transporters/${t.id}`} className="flex items-center justify-between px-5 py-4 hover:bg-slate-50">
                <div>
                  <p className="font-medium text-slate-900">{t.name}</p>
                  {t.gstin && <p className="text-xs text-slate-500">GSTIN: {t.gstin}</p>}
                </div>
                <span className="text-sm text-slate-400">View →</span>
              </Link>
            </li>
          ))}
          {(transporters ?? []).length === 0 && (
            <li className="px-5 py-10 text-center text-sm text-slate-500">
              No transporters yet. Add your first one above.
            </li>
          )}
        </ul>
      </Card>
    </div>
  )
}
