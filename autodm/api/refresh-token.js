// Renova o token do Instagram (chamado pelo cron da Vercel 1x por semana).
import { json } from '../lib/auth.js';
import { refreshToken } from '../lib/instagram.js';
import { getAccessToken, saveAccessToken, logEvent, hasRedis } from '../lib/store.js';

export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return json({ error: 'unauthorized' }, 401);
  }
  if (!hasRedis()) return json({ error: 'Configure o Upstash Redis para guardar o token renovado' }, 400);

  try {
    const data = await refreshToken(await getAccessToken());
    await saveAccessToken(data.access_token);
    await logEvent({ type: 'token', ok: true, expiresInDays: Math.round(data.expires_in / 86400) });
    return json({ ok: true, expires_in: data.expires_in });
  } catch (e) {
    await logEvent({ type: 'token', ok: false, errors: [e.message] });
    return json({ error: e.message }, 500);
  }
}
