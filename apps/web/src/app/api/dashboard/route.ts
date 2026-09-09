import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [billsRes, flagsRes, tripsRes] = await Promise.all([
    supabase.from('bills').select('total_claimed, total_flagged, total_approved, status', { count: 'exact' }),
    supabase.from('flags').select('flag_type, claimed_amount, expected_amount, status', { count: 'exact' }),
    supabase.from('trip_lines').select('status', { count: 'exact' }),
  ])

  const bills = billsRes.data ?? []
  const flags = flagsRes.data ?? []

  return NextResponse.json({
    bills_count: billsRes.count ?? 0,
    total_claimed: bills.reduce((s, b) => s + (b.total_claimed ?? 0), 0),
    total_flagged: bills.reduce((s, b) => s + (b.total_flagged ?? 0), 0),
    total_approved: bills.reduce((s, b) => s + (b.total_approved ?? 0), 0),
    open_flags_count: flags.filter(f => f.status === 'open').length,
    trips_count: tripsRes.count ?? 0,
  })
}
