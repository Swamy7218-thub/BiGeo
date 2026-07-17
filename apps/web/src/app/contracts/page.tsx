export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { formatDate } from '@/lib/utils'
import { Upload } from 'lucide-react'

export default async function ContractsPage() {
  const supabase = await createClient()
  const { data: contracts } = await supabase
    .from('rate_contracts')
    .select('*, transporters(name), rate_lines(count)')
    .order('effective_from', { ascending: false })

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Rate Contracts" subtitle="Active transporter rate agreements">
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            <Upload className="w-3.5 h-3.5" />
            Upload Contract
          </button>
        </Header>
        <main className="flex-1 overflow-y-auto p-6">
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Transporter</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Effective From</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Effective To</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Rate Lines</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(!contracts || contracts.length === 0) && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">No contracts yet.</td>
                  </tr>
                )}
                {contracts?.map((c: any) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{c.transporters?.name}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(c.effective_from)}</td>
                    <td className="px-4 py-3 text-gray-500">{c.effective_to ? formatDate(c.effective_to) : 'Open-ended'}</td>
                    <td className="px-4 py-3 text-center text-gray-700">{c.rate_lines?.[0]?.count ?? 0}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        c.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                        c.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-500'}`}>
                        {c.status}
                      </span>
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
