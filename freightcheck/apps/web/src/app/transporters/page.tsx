export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { formatCurrency } from '@/lib/utils'
import { TrendingDown, FileText, Star } from 'lucide-react'

export default async function TransportersPage() {
  const supabase = await createClient()
  const { data: transporters } = await supabase
    .from('transporters')
    .select('*')
    .order('name')

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Transporters" subtitle="Manage your transporter relationships" />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-3 gap-4">
            {(!transporters || transporters.length === 0) && (
              <div className="col-span-3 text-center py-12 text-gray-400 text-sm">No transporters yet.</div>
            )}
            {transporters?.map((t: any) => (
              <div key={t.id} className="bg-white rounded-xl border p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{t.name}</h3>
                    {t.gstin && <p className="text-xs text-gray-400 font-mono mt-0.5">{t.gstin}</p>}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${t.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {t.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {t.contact_name && (
                  <div className="text-sm text-gray-600">
                    <span className="text-gray-400">Contact:</span> {t.contact_name}
                    {t.contact_phone && <span className="ml-2 text-gray-400">{t.contact_phone}</span>}
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                  <div className="text-center">
                    <p className="text-xs text-gray-400">Flag Rate</p>
                    <p className="text-sm font-semibold text-gray-800">
                      {t.flag_rate_pct != null ? `${t.flag_rate_pct}%` : '—'}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-400">Total Bills</p>
                    <p className="text-sm font-semibold text-gray-800">{t.total_bills ?? 0}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-400">Savings</p>
                    <p className="text-sm font-semibold text-green-600">
                      {t.total_savings ? formatCurrency(t.total_savings) : '—'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
