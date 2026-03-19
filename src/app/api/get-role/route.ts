import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    // Verify the caller is authenticated via their JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return NextResponse.json({ role: null }, { status: 401 })

    // Validate the JWT using the anon client - extracts real user from token
    const supabaseAnon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user }, error: authErr } = await supabaseAnon.auth.getUser()
    if (authErr || !user) return NextResponse.json({ role: null }, { status: 401 })

    // Only allow a user to fetch their OWN role (prevent enumeration)
    const { userId } = await req.json()
    if (userId !== user.id) return NextResponse.json({ role: null }, { status: 403 })

    // Use service role to bypass RLS and get the role
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('role, full_name, email')
      .eq('id', user.id)
      .single()

    if (error || !data) return NextResponse.json({ role: null })
    return NextResponse.json({ role: data.role, full_name: data.full_name, email: data.email })
  } catch {
    return NextResponse.json({ role: null }, { status: 500 })
  }
}
