import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/lib/models/User';
import bcrypt from 'bcryptjs';
import { signSessionToken } from '@/lib/auth';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

/**
 * POST /api/admin/auth/login
 * Validates admin credentials and sets an httpOnly session cookie on success.
 * Rate limited to 5 requests per minute per IP.
 */
export async function POST(request: Request) {
  // Rate limit: 5 attempts per minute per IP
  const ip = getClientIp(request);
  const limit = rateLimit(`admin-login:${ip}`, 5, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many login attempts. Please try again later.' },
      {
        status: 429,
        headers: { 'Retry-After': String(limit.retryAfter) },
      }
    );
  }

  try {

    await connectDB();
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    // Find the user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    // Validate role is admin
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Invalid credentials or unauthorized access.' }, { status: 401 });
    }

    // Compare bcrypt passwords
    const isMatch = await bcrypt.compare(password, user.password || '');
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }

    // Sign the 7-day token natively using Web Crypto subtle
    const token = await signSessionToken({
      email: user.email,
      role: user.role
    });

    const response = NextResponse.json({ success: true }, { status: 200 });
    
    // Set secure cookie
    response.cookies.set('admin-session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      path: '/',
    });

    console.log(`Admin user logged in: ${user.email}`);
    return response;
  } catch (error: any) {
    console.error('Admin Auth Login Error:', error);
    return NextResponse.json(
      { error: 'An error occurred during authentication processing.' },
      { status: 500 }
    );
  }
}
