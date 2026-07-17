export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { FlagBadge, BillStatusBadge } from '@/components/ui/badge'
import { formatCurrency, formatDate, getConfidenceColor } from '@/lib/utils'
import { notFound } from 'next/navigation'
import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react'

export default async function BillDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data: bill } = await supabase
    .from('bills')
    .select('*, transporters(name, gstin)')
    .eq('id', params.id)
    .single()

  if (!bill) notFound()

  const { data: tripLines } = await supabase
    .from('trip_lines')
    .select('*, flags(*)')
    .eq('bill_id', params.id)
    .order('created_at')

  const totalFlags = tripLines?.reduce((s, t: any) => s + (t.flags?.length ?? 0), 0) ?? 0

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={`Bill: ${(bill as any).bill_number ?? params.id.slice(0, 8)}`}
          subtitle={(bill as any).transporters?.name}>
          <BillStatusBadge status={bill.status} />
        </Header>

        <main className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Bill summary */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Total Claimed', value: formatCurrency((bill as any).total_claimed ?? 0) },
              { label: 'Flagged', value: formatCurrency((bill as any).total_flagged ?? 0) },
              { label: 'Approved', value: formatCurrency((bill as any).total_approved ?? 0) },
              { label: 'Open Flags', value: totalFlags },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border p-4">
                <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                <p className="text-xl font-bold text-gray-900">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Extraction confidence */}
          {(bill as any).extraction_confidence != null && (
            <div className="bg-white rounded-xl border p-4 flex items-center gap-3">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Extraction Confidence</p>
                <p className={`text-lg font-bold ${getConfidenceColor((bill as any).extraction_confidence)}`}>
                  {Math.round((bill as any).extraction_confidence * 100)}%
                </p>
              </div>
              {(bill as any).arithmetic_check_passed
                ? <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-lg"><CheckCircle2 className="w-3.5 h-3.5" /> Arithmetic check passed</span>
                : <span className="flex items-center gap-1 text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded-lg"><AlertTriangle className="w-3.5 h-3.5" /> Arithmetic mismatch</span>
              }
              {(bill as any).low_confidence_fields?.length > 0 && (
                <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">
                  Low confidence: {(bill as any).low_confidence_fields.join(', ')}
                </span>
              )}
            </div>
          )}

          {/* Trip lines */}
          <div className="bg-white rounded-xl border">
            <div className="px-5 py-4 border-b">
              <h2 className="font-semibold text-gray-900 text-sm">Trip Lines ({tripLines?.length ?? 0})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">LR No.</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Route</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Vehicle</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Date</th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Amount</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Flags</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {tripLines?.map((trip: any) => (
                    <tr key={trip.id} className={trip.flags?.length > 0 ? 'bg-red-50/30' : ''}>
                      <td className="px-4 py-3 font-mono text-xs">{trip.lr_number}</td>
                      <td className="px-4 py-3 text-gray-700">{trip.origin} → {trip.destination}</td>
                      <td className="px-4 py-3 text-gray-500">{trip.vehicle_type}</td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(trip.trip_date)}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatCurrency(trip.base_amount)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {trip.flags?.length === 0 && (
                            <span className="text-xs text-green-600 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Clear
                            </span>
                          )}
                          {trip.flags?.map((flag: any) => (
                            <div key={flag.id} className="space-y-0.5">
                              <FlagBadge type={flag.flag_type} />
                              <p className="text-xs text-gray-500 max-w-xs truncate">{flag.description}</p>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
