// CRUD das regras de palavra-chave (usado pelo painel).
import crypto from 'node:crypto';
import { isAdmin, json, unauthorized } from '../lib/auth.js';
import { getRules, saveRules, hasRedis } from '../lib/store.js';

export async function GET(request) {
  if (!isAdmin(request)) return unauthorized();
  return json({ rules: await getRules(), persistent: hasRedis() });
}

export async function POST(request) {
  if (!isAdmin(request)) return unauthorized();
  const body = await request.json().catch(() => null);
  const rule = sanitize(body);
  if (!rule) return json({ error: 'Regra inválida: informe nome e ao menos uma palavra-chave' }, 400);

  const rules = await getRules();
  const idx = rules.findIndex((r) => r.id === rule.id);
  if (idx >= 0) rules[idx] = rule;
  else rules.push(rule);
  await saveRules(rules);
  return json({ rule });
}

export async function DELETE(request) {
  if (!isAdmin(request)) return unauthorized();
  const id = new URL(request.url).searchParams.get('id');
  const rules = await getRules();
  await saveRules(rules.filter((r) => r.id !== id));
  return json({ ok: true });
}

const list = (v) =>
  (Array.isArray(v) ? v : String(v ?? '').split(/[\n,]/)).map((s) => String(s).trim()).filter(Boolean);

function sanitize(b) {
  if (!b || typeof b !== 'object') return null;
  const keywords = list(b.keywords);
  const name = String(b.name ?? '').trim();
  if (!name || !keywords.length) return null;
  const buttonUrl = String(b.buttonUrl ?? '').trim();
  if (buttonUrl && !/^https?:\/\//i.test(buttonUrl)) return null;
  return {
    id: b.id || crypto.randomUUID(),
    name: name.slice(0, 80),
    active: b.active !== false,
    keywords,
    match: b.match === 'exact' ? 'exact' : 'contains',
    mediaIds: list(b.mediaIds),
    onComment: b.onComment !== false,
    onDm: Boolean(b.onDm),
    commentReplies: list(Array.isArray(b.commentReplies) ? b.commentReplies : String(b.commentReplies ?? '').split('\n')),
    dmText: String(b.dmText ?? '').trim().slice(0, 1000),
    buttonTitle: String(b.buttonTitle ?? '').trim().slice(0, 20),
    buttonUrl,
  };
}
