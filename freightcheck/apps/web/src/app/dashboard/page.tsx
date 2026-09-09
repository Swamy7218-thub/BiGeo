export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { StatCard } from '@/components/ui/stat-card'
import { FlagBadge, BillStatusBadge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { FileText, Flag, TrendingDown, CheckCircle, Upload } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch summary stats
  const [billsRes, flagsRes, tripsRes] = await Promise.all([
    supabase.from('bills').select('id, status, total_claimed, total_flagged, total_approved, bill_date, transporter_id, transporters(name)', { count: 'exact' }).order('created_at', { ascending: false }).limit(5),
    supabase.from('flags').select('id, flag_type, claimed_amount, expected_amount, status', { count: 'exact' }).eq('status', 'open').limit(5),
    supabase.from('trip_lines').select('id, base_amount, status', { count: 'exact' }),
  ])

  const bills = billsRes.data ?? []
  const openFlags = flagsRes.data ?? []
  const trips = tripsRes.data ?? []

  const totalClaimed = bills.reduce((s, b) => s + (b.total_claimed ?? 0), 0)
  const totalFlagged = bills.reduce((s, b) => s + (b.total_flagged ?? 0), 0)
  const totalApproved = bills.reduce((s, b) => s + (b.total_approved ?? 0), 0)
  const flagRate = totalClaimed > 0 ? ((totalFlagged / totalClaimed) * 100).toFixed(1) : '0'

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Dashboard" subtitle="Freight bill audit overview">
          <Link href="/bills/upload"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            <Upload className="w-3.5 h-3.5" />
            Upload Bill
          </Link>
        </Header>

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            <StatCard
              label="Total Bills"
              value={billsRes.count ?? 0}
              icon={FileText}
              sub="all time"
            />
            <StatCard
              label="Total Claimed"
              value={formatCurrency(totalClaimed)}
              icon={TrendingDown}
              sub="across all bills"
            />
            <StatCard
              label="Flagged Amount"
              value={formatCurrency(totalFlagged)}
              sub={`${flagRate}% of claims`}
              icon={Flag}
            />
            <StatCard
              label="Approved Amount"
              value={formatCurrency(totalApproved)}
              icon={CheckCircle}
              sub="cleared for payment"
            />
          </div>

          <div className="grid grid-cols-3 gap-6">
            {/* Recent Bills */}
            <div className="col-span-2 bg-white rounded-xl border">
              <div className="px-5 py-4 border-b flex items-center justify-between">
                <h2 className="font-semibold text-gray-900 text-sm">Recent Bills</h2>
                <Link href="/bills" className="text-xs text-blue-600 hover:underline">View all</Link>
              </div>
              <div className="divide-y">
                {bills.length === 0 && (
                  <div className="px-5 py-8 text-center text-sm text-gray-400">
                    No bills yet. <Link href="/bills/upload" className="text-blue-600 hover:underline">Upload your first bill.</Link>
                  </div>
                )}
                {bills.map((bill: any) => (
                  <Link key={bill.id} href={`/bills/${bill.id}`}
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {bill.transporters?.name ?? 'Unknown Transporter'}
                      </p>
                      <p className="text-xs text-gray-400">{formatDate(bill.bill_date)}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{formatCurrency(bill.total_claimed ?? 0)}</p>
                        {(bill.total_flagged ?? 0) > 0 && (
                          <p className="text-xs text-red-600">₹{((bill.total_flagged ?? 0) / 1000).toFixed(0)}K flagged</p>
                        )}
                      </div>
                      <BillStatusBadge status={bill.status} />
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Open Flags */}
            <div className="bg-white rounded-xl border">
              <div className="px-5 py-4 border-b flex items-center justify-between">
                <h2 className="font-semibold text-gray-900 text-sm">Open Flags</h2>
                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                  {flagsRes.count ?? 0}
                </span>
              </div>
              <div className="divide-y">
                {openFlags.length === 0 && (
                  <div className="px-5 py-8 text-center text-sm text-gray-400">No open flags</div>
                )}
                {openFlags.map((flag: any) => (
                  <div key={flag.id} className="px-5 py-3.5">
                    <div className="flex items-center justify-between mb-1">
                      <FlagBadge type={flag.flag_type} />
                      <span className="text-xs font-medium text-red-600">
                        +{formatCurrency((flag.claimed_amount ?? 0) - (flag.expected_amount ?? 0))}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
