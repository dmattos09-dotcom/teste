// Chamadas à API do Instagram (Instagram API com login do Instagram — graph.instagram.com).
import crypto from 'node:crypto';
import { getAccessToken } from './store.js';

const base = () => `https://graph.instagram.com/${process.env.IG_API_VERSION || 'v23.0'}`;

async function call(path, { method = 'POST', body } = {}) {
  const token = await getAccessToken();
  if (!token) throw new Error('IG_ACCESS_TOKEN não configurado');
  const res = await fetch(`${base()}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    throw new Error(`Instagram API ${res.status}: ${data.error?.message ?? JSON.stringify(data)}`);
  }
  return data;
}

/** Resposta pública ao comentário. */
export function replyToComment(commentId, message) {
  return call(`/${commentId}/replies`, { body: { message } });
}

/** Monta a mensagem: texto simples, ou texto + botão com link. */
export function buildMessage({ text, buttonTitle, buttonUrl }) {
  if (buttonTitle && buttonUrl) {
    return {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'button',
          text: text.slice(0, 640),
          buttons: [{ type: 'web_url', url: buttonUrl, title: buttonTitle.slice(0, 20) }],
        },
      },
    };
  }
  return { text: buttonUrl ? `${text}\n\n${buttonUrl}` : text };
}

/** DM a partir de um comentário ("private reply" — 1 por comentário, até 7 dias). */
export function sendPrivateReply(igUserId, commentId, message) {
  return call(`/${igUserId}/messages`, {
    body: { recipient: { comment_id: commentId }, message },
  });
}

/** DM para alguém que mandou mensagem (janela de 24h). */
export function sendDirectMessage(igUserId, recipientId, message) {
  return call(`/${igUserId}/messages`, {
    body: { recipient: { id: recipientId }, message },
  });
}

/** Renova o token de longa duração (vale 60 dias; renovar antes de vencer). */
export async function refreshToken(currentToken) {
  const url = `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(currentToken)}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(`Falha ao renovar token: ${data.error?.message ?? res.status}`);
  return data; // { access_token, token_type, expires_in }
}

/** Confere a assinatura X-Hub-Signature-256 enviada pela Meta. */
export function isValidSignature(rawBody, header, secret) {
  if (!secret) return false;
  if (!header?.startsWith('sha256=')) return false;
  const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(header);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
