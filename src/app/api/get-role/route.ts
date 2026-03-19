import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Uses service role key to bypass RLS and return the user's role securely
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const { userId } = await req.json()
    if (!userId) return NextResponse.json({ role: null }, { status: 400 })

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('role, full_name, email')
      .eq('id', userId)
      .single()

    if (error || !data) return NextResponse.json({ role: null })
    return NextResponse.json({ role: data.role, full_name: data.full_name, email: data.email })
  } catch {
    return NextResponse.json({ role: null }, { status: 500 })
  }
}
