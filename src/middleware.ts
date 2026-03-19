import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This middleware protects the admin routes by checking for a valid session.
// In a real Supabase app, we'd use supabase.auth.getSession(), but here 
// since the admin panel uses a custom role check, we'll enforce it via headers/cookies.

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protected Admin Routes
  if (pathname.startsWith('/admin')) {
    // Check for admin role/id in cookies (more secure than localStorage for middleware)
    const adminId = request.cookies.get('adminId')?.value
    const adminRole = request.cookies.get('adminRole')?.value

    if (!adminId || !['super_admin', 'assessor', 'hr'].includes(adminRole || '')) {
      // If no valid admin session, redirect to institutional login or main
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
  }

  // API Route Protection
  if (pathname.startsWith('/api/score-exam')) {
     // Ensure only service role or valid admin can trigger scoring
     // For this simple demo, we'll allow it, but in production, we'd check JWT.
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*'],
}
