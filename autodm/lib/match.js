// Comparação de palavras-chave: ignora maiúsculas, acentos e pontuação.

export function normalize(text = '') {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * match = "contains" → a palavra aparece como palavra inteira no texto ("quero sim!" casa com "quero")
 * match = "exact"    → o texto inteiro é a palavra ("quero" casa, "quero sim" não)
 */
export function matchesKeyword(text, keyword, mode = 'contains') {
  const t = normalize(text);
  const k = normalize(keyword);
  if (!k) return false;
  if (mode === 'exact') return t === k;
  return ` ${t} `.includes(` ${k} `);
}

/**
 * Encontra a primeira regra ativa que casa com o texto.
 * @param {'comment'|'dm'} source
 */
export function findRule(rules, { text, mediaId, source }) {
  return (
    rules.find((r) => {
      if (r.active === false) return false;
      if (source === 'comment' && r.onComment === false) return false;
      if (source === 'dm' && !r.onDm) return false;
      if (source === 'comment' && r.mediaIds?.length && !r.mediaIds.includes(mediaId)) return false;
      return (r.keywords ?? []).some((k) => matchesKeyword(text, k, r.match));
    }) ?? null
  );
}

export function pickRandom(list) {
  const items = (list ?? []).filter((s) => s && s.trim());
  if (!items.length) return null;
  return items[Math.floor(Math.random() * items.length)];
}

/** Substitui {nome} / {username} pelo @ da pessoa. */
export function fillTemplate(text, { username } = {}) {
  const out = (text ?? '').replace(/\{(nome|username|user)\}/gi, username ? `@${username}` : '');
  return username ? out : out.replace(/ +([,!.?])/g, '$1').replace(/ {2,}/g, ' ');
}
