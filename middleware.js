import { NextResponse } from 'next/server';

// /stats is private. HTTP Basic auth is the smallest lock that works: the
// browser asks once, remembers it for the session, and there is no login page,
// cookie or session store to build. Any username; the password is STATS_PASSWORD.
//
// Fails closed — a production deploy without the variable shows nothing.
export function middleware(request) {
  const password = process.env.STATS_PASSWORD;

  if (!password) {
    if (process.env.NODE_ENV === 'development') return NextResponse.next();
    return new NextResponse('Set STATS_PASSWORD to enable the dashboard.', { status: 503 });
  }

  const header = request.headers.get('authorization') ?? '';
  if (header.startsWith('Basic ')) {
    try {
      const decoded = atob(header.slice(6));
      const supplied = decoded.slice(decoded.indexOf(':') + 1);
      if (safeEqual(supplied, password)) return NextResponse.next();
    } catch {
      // malformed header: fall through to the challenge
    }
  }

  return new NextResponse('Authentication required.', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="YT-FORGE stats", charset="UTF-8"' },
  });
}

/** Compare without leaking the match length through timing. */
function safeEqual(a, b) {
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

export const config = {
  runtime: 'nodejs',
  matcher: ['/stats', '/stats/:path*'],
};
