// Histórico de quem comentou / recebeu DM (para o painel e para exportar leads).
import { isAdmin, json, unauthorized } from '../lib/auth.js';
import { getEvents } from '../lib/store.js';

export async function GET(request) {
  if (!isAdmin(request)) return unauthorized();
  const count = Math.min(Number(new URL(request.url).searchParams.get('count')) || 200, 500);
  return json({ events: await getEvents(count) });
}
