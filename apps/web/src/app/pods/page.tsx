export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { formatDate, getConfidenceColor } from '@/lib/utils'
import { Upload } from 'lucide-react'

export default async function PodsPage() {
  const supabase = await createClient()
  const { data: pods } = await supabase
    .from('pods')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Proof of Delivery" subtitle="Uploaded POD documents">
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            <Upload className="w-3.5 h-3.5" />
            Upload POD
          </button>
        </Header>
        <main className="flex-1 overflow-y-auto p-6">
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">LR Number</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Delivery Date</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Receiver</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Signature</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Stamp</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(!pods || pods.length === 0) && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">No PODs uploaded yet.</td>
                  </tr>
                )}
                {pods?.map((pod: any) => (
                  <tr key={pod.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-900">{pod.lr_number}</td>
                    <td className="px-4 py-3 text-gray-500">{pod.delivery_date ? formatDate(pod.delivery_date) : '—'}</td>
                    <td className="px-4 py-3 text-gray-700">{pod.receiver_name ?? '—'}</td>
                    <td className="px-4 py-3 text-center">{pod.receiver_signature_present ? '✓' : '✗'}</td>
                    <td className="px-4 py-3 text-center">{pod.stamp_present ? '✓' : '✗'}</td>
                    <td className="px-4 py-3 text-center">
                      {pod.extraction_confidence != null
                        ? <span className={`text-xs font-medium ${getConfidenceColor(pod.extraction_confidence)}`}>
                            {Math.round(pod.extraction_confidence * 100)}%
                          </span>
                        : '—'}
                    </td>
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
