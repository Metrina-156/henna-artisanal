import { NextResponse } from 'next/server';

/**
 * POST /api/admin/auth/logout
 * Clears the administrative session cookie.
 */
export async function POST() {
  const response = NextResponse.json({ success: true }, { status: 200 });

  // Clear cookie by setting maxAge to 0
  response.cookies.set('admin-session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });

  return response;
}
