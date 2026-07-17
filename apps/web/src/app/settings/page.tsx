import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('users').select('*, companies(*)').eq('auth_id', user?.id).single()

  const company = (profile as any)?.companies

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Settings" />
        <main className="flex-1 overflow-y-auto p-6 space-y-5 max-w-2xl">
          <div className="bg-white rounded-xl border p-5 space-y-4">
            <h2 className="font-semibold text-gray-900 text-sm">Company</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400 mb-0.5">Company Name</p>
                <p className="font-medium text-gray-900">{company?.name ?? '—'}</p>
              </div>
              <div>
                <p className="text-gray-400 mb-0.5">GSTIN</p>
                <p className="font-mono text-gray-900">{company?.gstin ?? '—'}</p>
              </div>
              <div>
                <p className="text-gray-400 mb-0.5">Plan</p>
                <p className="font-medium text-gray-900 capitalize">{company?.plan ?? 'starter'}</p>
              </div>
              <div>
                <p className="text-gray-400 mb-0.5">Bills Used</p>
                <p className="font-medium text-gray-900">{company?.bills_used_this_month ?? 0} / {company?.bills_limit ?? 50}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border p-5 space-y-4">
            <h2 className="font-semibold text-gray-900 text-sm">Your Profile</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400 mb-0.5">Name</p>
                <p className="font-medium text-gray-900">{(profile as any)?.full_name ?? '—'}</p>
              </div>
              <div>
                <p className="text-gray-400 mb-0.5">Email</p>
                <p className="text-gray-900">{user?.email ?? '—'}</p>
              </div>
              <div>
                <p className="text-gray-400 mb-0.5">Role</p>
                <p className="font-medium text-gray-900 capitalize">{(profile as any)?.role ?? '—'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border p-5 space-y-3">
            <h2 className="font-semibold text-gray-900 text-sm">Notifications</h2>
            <p className="text-sm text-gray-500">Email notifications for new flags and bill audit completion.</p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Email on new flags</span>
              <button className="w-10 h-5 bg-blue-600 rounded-full relative">
                <span className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full" />
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
