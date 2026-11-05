// URL do webhook que você cadastra na Meta: https://SEU-PROJETO.vercel.app/api/webhook
import { handleWebhookPayload } from '../lib/handler.js';
import { isValidSignature } from '../lib/instagram.js';

// Verificação inicial feita pela Meta ao cadastrar o webhook
export function GET(request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token && token === process.env.WEBHOOK_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }
  return new Response('Forbidden', { status: 403 });
}

// Eventos (comentários e mensagens)
export async function POST(request) {
  const raw = await request.text();
  const signature = request.headers.get('x-hub-signature-256');

  if (!isValidSignature(raw, signature, process.env.IG_APP_SECRET)) {
    return new Response('Invalid signature', { status: 401 });
  }

  try {
    await handleWebhookPayload(JSON.parse(raw));
  } catch (e) {
    console.error('Erro ao processar webhook', e);
  }
  // Sempre 200 para a Meta não reenviar em loop
  return new Response('EVENT_RECEIVED', { status: 200 });
}
