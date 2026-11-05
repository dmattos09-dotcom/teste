import crypto from 'node:crypto';

/** Confere o header Authorization: Bearer <ADMIN_PASSWORD>. */
export function isAdmin(request) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const given = (request.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  const a = crypto.createHash('sha256').update(given).digest();
  const b = crypto.createHash('sha256').update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

export const unauthorized = () => json({ error: 'Senha inválida' }, 401);
