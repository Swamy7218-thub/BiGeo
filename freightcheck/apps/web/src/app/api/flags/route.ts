import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const UpdateSchema = z.object({
  flag_id: z.string().uuid(),
  status: z.enum(['accepted', 'rejected', 'open']),
  resolution_note: z.string().optional(),
})

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { flag_id, status, resolution_note } = parsed.data

  const { error } = await supabase
    .from('flags')
    .update({
      status,
      resolution_note,
      updated_by: user.id,
    })
    .eq('id', flag_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
