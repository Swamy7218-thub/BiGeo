import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { StatCard } from '@/components/ui/stat-card'
import { formatCurrency } from '@/lib/utils'
import { TrendingDown, Flag, CheckCircle, BarChart3 } from 'lucide-react'

export default async function ReportsPage() {
  const supabase = await createClient()

  const [billsRes, flagsRes] = await Promise.all([
    supabase.from('bills').select('total_claimed, total_flagged, total_approved, status'),
    supabase.from('flags').select('flag_type, claimed_amount, expected_amount, status'),
  ])

  const bills = billsRes.data ?? []
  const flags = flagsRes.data ?? []

  const totalClaimed = bills.reduce((s, b) => s + (b.total_claimed ?? 0), 0)
  const totalFlagged = bills.reduce((s, b) => s + (b.total_flagged ?? 0), 0)
  const totalApproved = bills.reduce((s, b) => s + (b.total_approved ?? 0), 0)
  const totalSaved = flags.filter(f => f.status === 'rejected').reduce((s, f) => s + ((f.claimed_amount ?? 0) - (f.expected_amount ?? 0)), 0)

  // Flag breakdown by type
  const byType = flags.reduce((acc: Record<string, number>, f) => {
    acc[f.flag_type] = (acc[f.flag_type] ?? 0) + 1
    return acc
  }, {})

  const flagLabels: Record<string, string> = {
    rate_mismatch: 'Rate Mismatch',
    duplicate: 'Duplicate',
    detention_invalid: 'Invalid Detention',
    missing_pod: 'Missing POD',
    unknown_lane: 'Unknown Lane',
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Reports" subtitle="Audit performance and savings summary" />
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <StatCard label="Total Claimed" value={formatCurrency(totalClaimed)} icon={BarChart3} />
            <StatCard label="Total Flagged" value={formatCurrency(totalFlagged)} icon={Flag} />
            <StatCard label="Total Approved" value={formatCurrency(totalApproved)} icon={CheckCircle} />
            <StatCard label="Estimated Savings" value={formatCurrency(totalSaved)} icon={TrendingDown} />
          </div>

          {/* Flag breakdown */}
          <div className="bg-white rounded-xl border p-5">
            <h2 className="font-semibold text-gray-900 text-sm mb-4">Flags by Type</h2>
            <div className="space-y-3">
              {Object.entries(byType).length === 0 && (
                <p className="text-sm text-gray-400">No flags raised yet.</p>
              )}
              {Object.entries(byType).sort((a, b) => b[1] - a[1]).map(([type, count]) => {
                const pct = flags.length > 0 ? Math.round((count / flags.length) * 100) : 0
                return (
                  <div key={type} className="flex items-center gap-3">
                    <div className="w-32 text-sm text-gray-600 shrink-0">{flagLabels[type] ?? type}</div>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="w-12 text-right text-sm font-medium text-gray-700">{count}</div>
                    <div className="w-10 text-right text-xs text-gray-400">{pct}%</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Bills by status */}
          <div className="bg-white rounded-xl border p-5">
            <h2 className="font-semibold text-gray-900 text-sm mb-4">Bills by Status</h2>
            <div className="grid grid-cols-3 gap-4">
              {['uploaded', 'processing', 'audited', 'needs_review', 'approved', 'failed'].map(status => {
                const count = bills.filter(b => b.status === status).length
                return (
                  <div key={status} className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xl font-bold text-gray-900">{count}</p>
                    <p className="text-xs text-gray-500 capitalize mt-0.5">{status.replace('_', ' ')}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
