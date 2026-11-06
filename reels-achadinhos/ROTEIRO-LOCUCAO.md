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

---

# Reels 2 — "Ofertas do dia" (formato cartão de oferta)

Vídeo: `out/ofertas-achadinhos.mp4` (9:16 · 24,4 s) · sem música: `out/ofertas-achadinhos-sem-musica.mp4`
Composição no código: `AchadinhosOfertas` (`src/Ofertas.tsx`; para trocar as ofertas, edite a lista `OFFERS`)

| Tempo | Na tela | Fala |
|---|---|---|
| 0,0 – 2,0 s | ACHADINHOS · ESSAS OFERTAS SOMEM RÁPIDO | "Essas ofertas somem rápido!" |
| 2,0 – 4,9 s | Smart TV TCL 65" · NA LOJA R$4.099 → NO GRUPO R$3.179 | "TV TCL de 65 polegadas: economia de mais de 900 reais!" |
| 4,9 – 7,9 s | Ducha Plenum -64% | "Ducha de 658 por 239!" |
| 7,9 – 10,9 s | Lustre LED -63% | "Lustre de 199 por 74!" |
| 10,9 – 13,8 s | 6 Taças Bohemia -55% | "Taças de cristal por 89!" |
| 13,8 – 16,8 s | Aparelho de jantar 20 peças -52% | "Aparelho de jantar pela metade do preço!" |
| 16,8 – 19,7 s | Aspirador Philco -46% | "Aspirador Philco por 129!" |
| 19,7 – 24,4 s | ENTRA NO GRUPO · ACHADINHOS · LINK NA BIO | "Quem tá no grupo compra primeiro. Link na bio!" |

Por que estas 6: maior desconto (Ducha -64%, Lustre -63%, Taças -55%, Jantar -52%, Aspirador -46%) e a maior
economia em reais (TV, R$919). O Kaiak e o Davidoff ficaram de fora porque as fotos têm a marca d'água "@promoradardohomem".
