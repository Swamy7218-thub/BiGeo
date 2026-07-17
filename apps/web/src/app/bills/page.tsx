import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { BillStatusBadge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Upload } from 'lucide-react'
import Link from 'next/link'

export default async function BillsPage() {
  const supabase = await createClient()
  const { data: bills } = await supabase
    .from('bills')
    .select('*, transporters(name)')
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Bills" subtitle="All uploaded freight bills">
          <Link href="/bills/upload"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            <Upload className="w-3.5 h-3.5" />
            Upload Bill
          </Link>
        </Header>
        <main className="flex-1 overflow-y-auto p-6">
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Bill No.</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Transporter</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Date</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Claimed</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Flagged</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(!bills || bills.length === 0) && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                      No bills yet. <Link href="/bills/upload" className="text-blue-600 hover:underline">Upload your first bill.</Link>
                    </td>
                  </tr>
                )}
                {bills?.map((bill: any) => (
                  <tr key={bill.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/bills/${bill.id}`} className="font-medium text-blue-600 hover:underline">
                        {bill.bill_number ?? bill.id.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{(bill as any).transporters?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(bill.bill_date ?? bill.created_at)}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(bill.total_claimed ?? bill.total_amount ?? 0)}</td>
                    <td className="px-4 py-3 text-right">
                      {(bill.total_flagged ?? 0) > 0
                        ? <span className="text-red-600 font-medium">{formatCurrency(bill.total_flagged)}</span>
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3"><BillStatusBadge status={bill.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  )
}
