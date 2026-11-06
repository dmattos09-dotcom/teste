# Reels Achadinhos — roteiro da locução

Vídeo: `out/reels-achadinhos.mp4` (9:16 · 21,4 s · música house 122 BPM)
Sem música (só efeitos, pra você pôr a sua): `out/reels-achadinhos-sem-musica.mp4`

Grave a voz por cima (CapCut, Instagram ou o próprio celular), com energia e falando rápido.
Os tempos batem com o que aparece na tela:

| Tempo | Na tela | Fala |
|---|---|---|
| 0,0 – 2,0 s | PARA DE / PAGAR / CARO! | "Para de pagar caro!" |
| 2,0 – 5,0 s | Fone Samsung + círculo + zoom no preço | "Olha esse fone Samsung: de 349 por 170!" |
| 5,0 – 7,9 s | Espelho + zoom no preço | "Espelho de 399 por 99 reais!" |
| 7,9 – 10,9 s | Lustre + zoom no preço | "Lustre LED de 199 por 74!" |
| 10,9 – 16,3 s | Ofertas voando pra grade, +50 OFERTAS TODO DIA | "E todo dia são mais de 50 ofertas assim: Amazon, Mercado Livre e Shopee." |
| 16,3 – 21,4 s | ENTRA NO GRUPO · ACHADINHOS · LINK NA BIO | "Entra no grupo Achadinhos. O link tá na bio!" |

Sugestão de legenda do post:
> Para de pagar caro 🛑 Todo dia +50 achadinhos da Amazon, Mercado Livre e Shopee direto no seu WhatsApp. Entra no grupo, link na bio 👆 #achadinhos #ofertas #promoção #blackfriday

## Editar e renderizar de novo
```
npm ci
npx remotion studio src/index.ts              # editor visual
npx remotion render src/index.ts AchadinhosReel out/reels-achadinhos.mp4
```
Preços, nomes e descontos: constantes `STOPS` e `PRODS` em `src/Reel.tsx`.
Música e efeitos: Mixkit Free License, uso comercial sem crédito (veja `public/audio/ATTRIBUTION.md`).
