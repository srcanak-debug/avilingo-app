import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: Request) {
  try {
    const { email, full_name, org_id } = await req.json()
    if (!email || !full_name || !org_id) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    let userId: string | undefined

    // 1. Create in auth.users with a default password for easy testing
    const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: 'password123',
      email_confirm: true
    })
    
    if (authErr && authErr.message.includes('already exists')) {
      // Find the existing user
      const { data: existingAuth } = await supabaseAdmin.auth.admin.listUsers()
      const existing = existingAuth.users.find(u => u.email === email)
      if (existing) {
        userId = existing.id
      } else {
        return NextResponse.json({ error: 'User exists in Auth but could not retrieve ID.' }, { status: 500 })
      }
    } else if (authErr) {
      return NextResponse.json({ error: authErr.message }, { status: 500 })
    } else {
      userId = authData.user.id
    }

    if (!userId) return NextResponse.json({ error: 'Failed to generate User ID' }, { status: 500 })

    // 2. Upsert into public.users
    const { error: pubErr } = await supabaseAdmin.from('users').upsert({
      id: userId,
      email,
      full_name,
      role: 'candidate',
      org_id
    }, { onConflict: 'email' })
    
    if (pubErr) {
      return NextResponse.json({ error: pubErr.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: userId })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
