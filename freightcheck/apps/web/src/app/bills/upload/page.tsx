import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { UploadZone } from '@/components/bills/upload-zone'

export default async function UploadPage() {
  const supabase = await createClient()
  const { data: transporters } = await supabase
    .from('transporters')
    .select('id, name')
    .eq('is_active', true)
    .order('name')

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Upload Bill" subtitle="Upload a freight bill for AI audit" />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-xl mx-auto">
            <div className="bg-white rounded-xl border p-6 space-y-5">
              <h2 className="font-semibold text-gray-900">Bill Upload</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="transporter">
                  Transporter <span className="text-red-500">*</span>
                </label>
                <select id="transporter"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select transporter…</option>
                  {transporters?.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Bill Document <span className="text-red-500">*</span>
                </label>
                <UploadZone transporterId="" />
              </div>

              <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700 space-y-1">
                <p className="font-medium">What happens after upload:</p>
                <ul className="list-disc list-inside space-y-0.5 text-blue-600">
                  <li>Claude AI extracts all trip lines from the bill</li>
                  <li>4 deterministic audit checks run automatically</li>
                  <li>Flags are raised for mismatches, duplicates, and invalid charges</li>
                  <li>You review and approve/reject each flagged line</li>
                </ul>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
