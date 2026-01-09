import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('accessToken')?.value || 
                 request.headers.get('authorization')?.replace('Bearer ', '');
  
  const { pathname } = request.nextUrl;

  // If user is logged in and tries to access login page, redirect to their dashboard
  if (token && pathname === '/login') {
    // Try to get role from localStorage (client-side) or redirect to default
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/login', '/admin/:path*', '/manager/:path*', '/employee/:path*'],
};


