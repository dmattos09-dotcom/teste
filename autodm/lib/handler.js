// Regras de negócio do webhook: recebe o payload da Meta e decide o que fazer.
import { findRule, pickRandom, fillTemplate } from './match.js';
import * as ig from './instagram.js';
import { getRules, logEvent, markProcessed } from './store.js';

export async function handleWebhookPayload(payload, api = ig) {
  if (payload?.object !== 'instagram') return { handled: 0 };
  const rules = await getRules();
  let handled = 0;

  for (const entry of payload.entry ?? []) {
    const myId = entry.id;

    for (const change of entry.changes ?? []) {
      if (change.field !== 'comments') continue;
      if (await handleComment(myId, change.value, rules, api)) handled++;
    }

    for (const event of entry.messaging ?? []) {
      if (await handleMessage(myId, event, rules, api)) handled++;
    }
  }
  return { handled };
}

async function handleComment(myId, value, rules, api) {
  const commentId = value?.id;
  const text = value?.text ?? '';
  const from = value?.from ?? {};
  if (!commentId || !text) return false;
  if (from.id && from.id === myId) return false; // não responder a si mesmo

  const rule = findRule(rules, { text, mediaId: value.media?.id, source: 'comment' });
  if (!rule) return false;
  if (!(await markProcessed(`c:${commentId}`))) return false; // webhook repetido

  const log = { type: 'comment', rule: rule.name, username: from.username, text, commentId, mediaId: value.media?.id };
  const errors = [];

  if (rule.dmText) {
    try {
      const msg = ig.buildMessage({
        text: fillTemplate(rule.dmText, from),
        buttonTitle: rule.buttonTitle,
        buttonUrl: rule.buttonUrl,
      });
      await api.sendPrivateReply(myId, commentId, msg);
      log.dmSent = true;
    } catch (e) {
      errors.push(`DM: ${e.message}`);
    }
  }

  const publicReply = pickRandom(rule.commentReplies);
  if (publicReply) {
    try {
      await api.replyToComment(commentId, fillTemplate(publicReply, from));
      log.replied = true;
    } catch (e) {
      errors.push(`Resposta: ${e.message}`);
    }
  }

  if (errors.length) log.errors = errors;
  await logEvent(log);
  return true;
}

async function handleMessage(myId, event, rules, api) {
  const msg = event?.message;
  const senderId = event?.sender?.id;
  if (!msg?.text || msg.is_echo || !senderId || senderId === myId) return false;

  const rule = findRule(rules, { text: msg.text, source: 'dm' });
  if (!rule || !rule.dmText) return false;
  if (!(await markProcessed(`m:${msg.mid}`))) return false;

  const log = { type: 'dm', rule: rule.name, senderId, text: msg.text };
  try {
    await api.sendDirectMessage(
      myId,
      senderId,
      ig.buildMessage({ text: fillTemplate(rule.dmText), buttonTitle: rule.buttonTitle, buttonUrl: rule.buttonUrl }),
    );
    log.dmSent = true;
  } catch (e) {
    log.errors = [`DM: ${e.message}`];
  }
  await logEvent(log);
  return true;
}
