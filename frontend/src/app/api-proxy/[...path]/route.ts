import { NextRequest, NextResponse } from 'next/server';

/** Rewrites в Next 16 ломают POST body; проксируем API явно. */
export const dynamic = 'force-dynamic';

const backendBase =
  process.env.BACKEND_INTERNAL_URL?.replace(/\/$/, '') ?? 'http://127.0.0.1:4000';

const hopByHop = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailers',
  'transfer-encoding',
  'upgrade',
  'host',
  'content-length',
]);

function targetUrl(path: string[] | undefined, search: string) {
  const sub = path?.length ? path.join('/') : '';
  return `${backendBase}/api/${sub}${search}`;
}

async function proxy(req: NextRequest, path: string[] | undefined) {
  const url = new URL(req.url);
  const target = targetUrl(path, url.search);

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (hopByHop.has(key.toLowerCase())) return;
    headers.set(key, value);
  });

  const init: RequestInit = {
    method: req.method,
    headers,
    redirect: 'manual',
  };

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const buf = await req.arrayBuffer();
    if (buf.byteLength > 0) init.body = buf;
  }

  const res = await fetch(target, init);
  const out = new Headers(res.headers);
  hopByHop.forEach((h) => out.delete(h));
  return new NextResponse(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: out,
  });
}

type Ctx = { params: Promise<{ path?: string[] }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  return proxy(req, (await ctx.params).path);
}

export async function POST(req: NextRequest, ctx: Ctx) {
  return proxy(req, (await ctx.params).path);
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  return proxy(req, (await ctx.params).path);
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  return proxy(req, (await ctx.params).path);
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  return proxy(req, (await ctx.params).path);
}
