import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { normalize, matchesKeyword, findRule, fillTemplate } from '../lib/match.js';
import { handleWebhookPayload } from '../lib/handler.js';
import { saveRules, getEvents, _resetMemory } from '../lib/store.js';
import { isValidSignature, buildMessage } from '../lib/instagram.js';
import * as webhook from '../api/webhook.js';
import * as rulesApi from '../api/rules.js';

const MY_ID = '17841400000000000';

function fakeApi() {
  const calls = [];
  return {
    calls,
    replyToComment: async (id, msg) => calls.push(['reply', id, msg]),
    sendPrivateReply: async (me, id, msg) => calls.push(['private', me, id, msg]),
    sendDirectMessage: async (me, to, msg) => calls.push(['dm', me, to, msg]),
  };
}

const commentPayload = (text, { id = 'c1', fromId = '999', username = 'maria', mediaId = 'm1' } = {}) => ({
  object: 'instagram',
  entry: [{ id: MY_ID, time: 1, changes: [{ field: 'comments', value: { id, text, from: { id: fromId, username }, media: { id: mediaId } } }] }],
});

const baseRule = {
  id: 'r1', name: 'Ebook', active: true, keywords: ['QUERO'], match: 'contains', mediaIds: [],
  onComment: true, onDm: false, commentReplies: ['Te mandei no direct, {nome}!'],
  dmText: 'Oi {nome}, aqui está!', buttonTitle: 'Baixar', buttonUrl: 'https://exemplo.com/ebook',
};

beforeEach(() => _resetMemory());

test('normalize remove acentos, caixa e pontuação', () => {
  assert.equal(normalize('  QUÉRO!!  Sim? '), 'quero sim');
});

test('matchesKeyword contains x exact', () => {
  assert.ok(matchesKeyword('Eu quero muito!', 'QUERO'));
  assert.ok(!matchesKeyword('requeroo', 'quero'));
  assert.ok(matchesKeyword('Quero', 'quero', 'exact'));
  assert.ok(!matchesKeyword('quero sim', 'quero', 'exact'));
  assert.ok(matchesKeyword('me manda o LINK pfv', 'link'));
});

test('findRule respeita ativo, post e origem', () => {
  const rules = [
    { ...baseRule, id: 'a', active: false },
    { ...baseRule, id: 'b', mediaIds: ['outro'] },
    { ...baseRule, id: 'c' },
  ];
  assert.equal(findRule(rules, { text: 'quero', mediaId: 'm1', source: 'comment' }).id, 'c');
  assert.equal(findRule(rules, { text: 'quero', source: 'dm' }), null);
  assert.equal(findRule(rules, { text: 'nada', mediaId: 'm1', source: 'comment' }), null);
});

test('fillTemplate troca {nome}', () => {
  assert.equal(fillTemplate('Oi {nome}!', { username: 'ana' }), 'Oi @ana!');
});

test('comentário com palavra-chave → DM com botão + resposta pública', async () => {
  await saveRules([baseRule]);
  const api = fakeApi();
  const r = await handleWebhookPayload(commentPayload('EU QUERO!'), api);
  assert.equal(r.handled, 1);
  const priv = api.calls.find((c) => c[0] === 'private');
  assert.equal(priv[1], MY_ID);
  assert.equal(priv[2], 'c1');
  assert.equal(priv[3].attachment.payload.text, 'Oi @maria, aqui está!');
  assert.equal(priv[3].attachment.payload.buttons[0].url, 'https://exemplo.com/ebook');
  assert.deepEqual(api.calls.find((c) => c[0] === 'reply'), ['reply', 'c1', 'Te mandei no direct, @maria!']);
  const [ev] = await getEvents(10);
  assert.equal(ev.username, 'maria');
  assert.equal(ev.dmSent, true);
});

test('ignora comentário sem palavra-chave, da própria conta e repetido', async () => {
  await saveRules([baseRule]);
  const api = fakeApi();
  await handleWebhookPayload(commentPayload('lindo post'), api);
  await handleWebhookPayload(commentPayload('quero', { id: 'c2', fromId: MY_ID }), api);
  await handleWebhookPayload(commentPayload('quero', { id: 'c3' }), api);
  await handleWebhookPayload(commentPayload('quero', { id: 'c3' }), api); // webhook reenviado
  assert.equal(api.calls.filter((c) => c[0] === 'private').length, 1);
});

test('erro na API fica registrado no histórico sem derrubar o processamento', async () => {
  await saveRules([baseRule]);
  const api = fakeApi();
  api.sendPrivateReply = async () => { throw new Error('limite'); };
  await handleWebhookPayload(commentPayload('quero'), api);
  const [ev] = await getEvents(10);
  assert.match(ev.errors[0], /limite/);
  assert.equal(ev.replied, true);
});

test('palavra-chave no direct dispara DM quando onDm=true', async () => {
  await saveRules([{ ...baseRule, onDm: true, buttonTitle: '', buttonUrl: '' }]);
  const api = fakeApi();
  const payload = { object: 'instagram', entry: [{ id: MY_ID, messaging: [
    { sender: { id: '555' }, recipient: { id: MY_ID }, message: { mid: 'x1', text: 'quero' } },
    { sender: { id: MY_ID }, recipient: { id: '555' }, message: { mid: 'x2', text: 'quero', is_echo: true } },
  ] }] };
  await handleWebhookPayload(payload, api);
  assert.equal(api.calls.length, 1);
  assert.deepEqual(api.calls[0], ['dm', MY_ID, '555', { text: 'Oi, aqui está!' }]);
});

test('buildMessage sem botão anexa o link no texto', () => {
  assert.deepEqual(buildMessage({ text: 'Oi', buttonUrl: 'https://a.com' }), { text: 'Oi\n\nhttps://a.com' });
});

test('assinatura do webhook', () => {
  const body = '{"a":1}';
  const sig = 'sha256=' + crypto.createHmac('sha256', 'segredo').update(body).digest('hex');
  assert.ok(isValidSignature(body, sig, 'segredo'));
  assert.ok(!isValidSignature(body, sig, 'outro'));
  assert.ok(!isValidSignature(body, undefined, 'segredo'));
});

test('GET /api/webhook verificação da Meta', () => {
  process.env.WEBHOOK_VERIFY_TOKEN = 'meutoken';
  const ok = webhook.GET(new Request('https://x/api/webhook?hub.mode=subscribe&hub.verify_token=meutoken&hub.challenge=123'));
  assert.equal(ok.status, 200);
  const bad = webhook.GET(new Request('https://x/api/webhook?hub.mode=subscribe&hub.verify_token=errado&hub.challenge=123'));
  assert.equal(bad.status, 403);
});

test('POST /api/webhook rejeita assinatura inválida', async () => {
  process.env.IG_APP_SECRET = 'segredo';
  const res = await webhook.POST(new Request('https://x/api/webhook', { method: 'POST', body: '{}', headers: { 'x-hub-signature-256': 'sha256=00' } }));
  assert.equal(res.status, 401);
});

test('API de regras exige senha e valida dados', async () => {
  process.env.ADMIN_PASSWORD = 'admin123';
  const noAuth = await rulesApi.GET(new Request('https://x/api/rules'));
  assert.equal(noAuth.status, 401);
  const headers = { authorization: 'Bearer admin123' };
  const bad = await rulesApi.POST(new Request('https://x/api/rules', { method: 'POST', headers, body: JSON.stringify({ name: 'x' }) }));
  assert.equal(bad.status, 400);
  const ok = await rulesApi.POST(new Request('https://x/api/rules', { method: 'POST', headers, body: JSON.stringify({ name: 'Ebook', keywords: 'quero, link', dmText: 'oi' }) }));
  const { rule } = await ok.json();
  assert.deepEqual(rule.keywords, ['quero', 'link']);
  const list = await (await rulesApi.GET(new Request('https://x/api/rules', { headers }))).json();
  assert.equal(list.rules.length, 1);
});
