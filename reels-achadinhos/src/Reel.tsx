// Reels "Achadinhos" — 9:16, 30fps, sincronizado com house-vibez (122.05 BPM).
// Roteiro (batidas):
//   b0–b4   HOOK      "PARA DE / PAGAR / CARO!" (slam por batida) → celular sobe
//   b4–b22  GRUPO     rolagem real do grupo; 3 paradas: círculo vermelho no preço →
//                     crash-zoom-punch → selo de desconto → rolagem com freio
//   b22–b33 DECK      deck-deal-flyin: as ofertas saem do celular como um monte de
//                     cartas e são "distribuídas" na grade (+50 ofertas todo dia)
//   b33–b42 CTA       "ENTRA NO GRUPO" + ACHADINHOS + botão + "LINK NA BIO"
// Renderização determinística: nada de Math.random/Date.now.
import {
  AbsoluteFill, Audio, Easing, Img, Sequence, interpolate, staticFile, useCurrentFrame,
} from 'remotion';

// ---------- grade de batidas (librosa: período 0.4916 s, fase 0.078 s) ----------
const bf = (n: number) => Math.round(2.34 + 14.748 * n);
export const REEL_DURATION = bf(42) + 18;

const CL = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const FONT = 'Inter, "Noto Color Emoji", sans-serif';

// ---------- paleta (WhatsApp dark + Black November do avatar do grupo) ----------
const C = {
  bg: '#0b141a',
  bubble: '#1f2c34',
  green: '#25D366',
  red: '#ff2b2b',
  gold: '#ffc83d',
  white: '#ffffff',
  muted: '#8696a0',
};

// ---------- celular ----------
const NATIVE_W = 1184;
const NATIVE_H = 2576;
const K = 0.56;
const PH_W = NATIVE_W * K;
const PH_L = (1080 - PH_W) / 2;
const PH_T = 395;
const CHAT_TOP = 341;
const CHAT_H = 1997;
const N_CHATS = 9;

type Stop = { L: number; chat: number; box: [number, number, number, number]; z: number; off: string; name: string; de: string; por: string };
const STOPS: Stop[] = [
  { L: 4, chat: 0, box: [145, 1745, 895, 1825], z: 2.1, off: '-51%', name: 'FONE SAMSUNG GALAXY', de: 'R$349', por: 'R$170' },
  { L: 10, chat: 3, box: [145, 1940, 960, 2085], z: 1.95, off: '-75%', name: 'ESPELHO ORGÂNICO 100x50', de: 'R$399', por: 'R$99' },
  { L: 16, chat: 7, box: [145, 1822, 785, 1902], z: 2.3, off: '-63%', name: 'LUSTRE LED 3 ARCOS', de: 'R$199', por: 'R$74' },
];

const dampedSettle = (t: number, freq: number, damping: number) =>
  t <= 0 ? 0 : Math.exp(-damping * t) * Math.sin(2 * Math.PI * freq * t);

// rolagem (px nativos): parada exata em cada print → tela idêntica ao original
const SCROLLS: { a: number; b: number; from: number; to: number }[] = [
  { a: bf(8), b: bf(10), from: 0, to: 3 * CHAT_H },
  { a: bf(14), b: bf(16), from: 3 * CHAT_H, to: 7 * CHAT_H },
  { a: bf(20), b: bf(22), from: 7 * CHAT_H, to: 8 * CHAT_H },
];
const SCROLL_EASE = Easing.bezier(0.6, 0, 0.15, 1);
const scrollAt = (f: number): number => {
  let s = 0;
  for (const sc of SCROLLS) {
    if (f >= sc.a) {
      s = interpolate(f, [sc.a, sc.b], [sc.from, sc.to], { ...CL, easing: SCROLL_EASE });
      if (f > sc.b) s += 34 * dampedSettle(f - sc.b, 0.07, 0.22); // freio com leve passada
    }
  }
  return s;
};

// câmera do celular (crash-zoom-punch: 6f ease-in, pico +6%, assenta em 5f)
const camAt = (f: number) => {
  for (const st of STOPS) {
    const a = bf(st.L + 2);
    const b = bf(st.L + 4);
    const tx = PH_L + ((st.box[0] + st.box[2]) / 2) * K;
    const ty = PH_T + ((st.box[1] + st.box[3]) / 2) * K;
    if (f >= a && f < b) {
      const z = interpolate(f, [a, a + 6, a + 11], [1, st.z * 1.06, st.z], { ...CL, easing: Easing.bezier(0.55, 0, 0.7, 1) });
      const cx = interpolate(f, [a, a + 6], [540, tx], { ...CL, easing: Easing.in(Easing.quad) });
      const cy = interpolate(f, [a, a + 6], [960, ty], { ...CL, easing: Easing.in(Easing.quad) });
      return { z, cx, cy };
    }
    if (f >= b && f < b + 10) {
      const t = interpolate(f, [b, b + 9], [0, 1], { ...CL, easing: Easing.inOut(Easing.cubic) });
      return { z: st.z + (1 - st.z) * t, cx: tx + (540 - tx) * t, cy: ty + (960 - ty) * t };
    }
  }
  return { z: 1, cx: 540, cy: 960 };
};

// ---------- peças ----------
const HandCircle: React.FC<{ box: [number, number, number, number]; t: number; opacity: number }> = ({ box, t, opacity }) => {
  const [x0, y0, x1, y1] = box;
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const rx = (x1 - x0) / 2 + 42;
  const ry = (y1 - y0) / 2 + 30;
  const pts: string[] = [];
  const N = 64;
  for (let i = 0; i <= N; i++) {
    const th = -0.5 + (i / N) * (Math.PI * 2 + 0.75); // passa do ponto inicial = traço à mão
    const wob = 1 + 0.035 * Math.sin(th * 3 + 0.7) + 0.02 * (i / N);
    const x = cx + rx * wob * Math.cos(th);
    const y = cy + ry * wob * Math.sin(th) - 6 * Math.cos(th); // leve inclinação
    pts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return (
    <svg width={NATIVE_W} height={NATIVE_H} style={{ position: 'absolute', left: 0, top: 0, opacity, overflow: 'visible' }}>
      <path d={pts.join(' ')} pathLength={1} fill="none" stroke={C.red} strokeWidth={15} strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray="1 1" strokeDashoffset={1 - t} style={{ filter: 'drop-shadow(0 0 10px rgba(255,43,43,.65))' }} />
    </svg>
  );
};

const Burst: React.FC<{ size: number; label: string }> = ({ size, label }) => {
  const pts: string[] = [];
  const n = 16;
  for (let i = 0; i < n * 2; i++) {
    const r = (i % 2 === 0 ? 0.5 : 0.41) * size;
    const a = (i / (n * 2)) * Math.PI * 2;
    pts.push(`${size / 2 + r * Math.cos(a)},${size / 2 + r * Math.sin(a)}`);
  }
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ position: 'absolute', inset: 0, filter: 'drop-shadow(0 8px 18px rgba(0,0,0,.45))' }}>
        <polygon points={pts.join(' ')} fill={C.red} stroke={C.white} strokeWidth={8} strokeLinejoin="round" />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, color: C.white, lineHeight: 0.9 }}>
        <div style={{ fontWeight: 900, fontSize: size * 0.3, letterSpacing: -2 }}>{label}</div>
        <div style={{ fontWeight: 900, fontSize: size * 0.13, color: C.gold }}>OFF</div>
      </div>
    </div>
  );
};

const Phone: React.FC<{ frame: number }> = ({ frame }) => {
  const S = scrollAt(frame);
  const v = Math.abs(scrollAt(frame + 0.5) - scrollAt(frame - 0.5)) * K;
  const blur = Math.min(v / 45, 1) * 7;
  return (
    <div style={{ position: 'absolute', left: PH_L - 18, top: PH_T - 18, width: PH_W + 36, height: NATIVE_H * K + 36, borderRadius: 78, background: '#111', boxShadow: '0 0 0 3px #3a3f44, 0 40px 90px rgba(0,0,0,.6), 0 0 120px rgba(37,211,102,.18)' }}>
      <div style={{ position: 'absolute', left: 18, top: 18, width: NATIVE_W, height: NATIVE_H, transform: `scale(${K})`, transformOrigin: '0 0', borderRadius: 104, overflow: 'hidden', background: C.bg }}>
        {/* conversa */}
        <div style={{ position: 'absolute', left: 0, top: CHAT_TOP, width: NATIVE_W, height: CHAT_H, overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, transform: `translateY(${-S}px)`, filter: blur > 0.2 ? `blur(${blur / K}px)` : undefined }}>
            {Array.from({ length: N_CHATS }, (_, i) =>
              Math.abs(i * CHAT_H - S) < CHAT_H * 1.6 ? (
                <Img key={i} src={staticFile(`img/chat${i + 1}.jpg`)} style={{ position: 'absolute', left: 0, top: i * CHAT_H, width: NATIVE_W, height: CHAT_H, display: 'block' }} />
              ) : null,
            )}
          </div>
        </div>
        <Img src={staticFile('img/header.png')} style={{ position: 'absolute', left: 0, top: 0, width: NATIVE_W, height: CHAT_TOP }} />
        <Img src={staticFile('img/footer.png')} style={{ position: 'absolute', left: 0, top: CHAT_TOP + CHAT_H, width: NATIVE_W, height: NATIVE_H - CHAT_TOP - CHAT_H }} />
        {/* círculo + selo em cada parada */}
        {STOPS.map((st, i) => {
          const d0 = bf(st.L + 1);
          const out0 = bf(st.L + 4) + 2;
          if (frame < d0 || frame > out0 + 8) return null;
          const t = interpolate(frame, [d0, d0 + 10], [0, 1], { ...CL, easing: Easing.out(Easing.quad) });
          const op = interpolate(frame, [out0, out0 + 6], [1, 0], CL);
          const s0 = bf(st.L + 2) + 7;
          const bs = interpolate(frame, [s0, s0 + 8], [0, 1], { ...CL, easing: Easing.out(Easing.back(2.6)) });
          const wig = Math.sin((frame - s0) * 0.35) * 3;
          return (
            <div key={i}>
              <HandCircle box={st.box} t={t} opacity={op} />
              {frame >= s0 ? (
                <div style={{ position: 'absolute', left: st.box[2] - 270, top: st.box[1] - 290, transform: `rotate(${-12 + wig}deg) scale(${bs})`, opacity: op }}>
                  <Burst size={250} label={st.off} />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Caption: React.FC<{ frame: number }> = ({ frame }) => {
  const st = STOPS.find((s) => frame >= bf(s.L) && frame < bf(s.L + 4) + 6);
  if (!st) return null;
  const f0 = bf(st.L);
  const pop = interpolate(frame, [f0, f0 + 7], [0, 1], { ...CL, easing: Easing.out(Easing.back(2)) });
  const out = interpolate(frame, [bf(st.L + 4), bf(st.L + 4) + 6], [1, 0], CL);
  return (
    <>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 420, opacity: out, background: 'linear-gradient(180deg, rgba(11,20,26,.92) 0%, rgba(11,20,26,.85) 70%, rgba(11,20,26,0) 100%)' }} />
    <div style={{ position: 'absolute', left: 0, right: 0, top: 170, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, transform: `scale(${pop})`, opacity: out, fontFamily: FONT }}>
      <div style={{ background: C.white, color: C.bg, fontWeight: 900, fontSize: 46, padding: '10px 26px', borderRadius: 18, letterSpacing: -0.5 }}>{st.name}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, fontWeight: 900 }}>
        <span style={{ fontSize: 58, color: C.white, opacity: 0.75, textDecoration: 'line-through', textDecorationColor: C.red, textDecorationThickness: 7 }}>{st.de}</span>
        <span style={{ fontSize: 50, color: C.gold }}>➜</span>
        <span style={{ fontSize: 78, color: C.bg, background: C.green, padding: '0 22px', borderRadius: 16, letterSpacing: -1 }}>{st.por}</span>
      </div>
    </div>
    </>
  );
};

const slam = (frame: number, land: number, from = 2.4, dur = 5) => {
  const s = interpolate(frame, [land - dur, land], [from, 1], { ...CL, easing: Easing.in(Easing.quad) });
  const o = interpolate(frame, [land - dur, land - dur + 2], [0, 1], CL);
  const t = frame - land;
  const shake = t > 0 ? 12 * Math.exp(-t / 1.8) * Math.sin(t * 2.6) : 0;
  return { s, o, shake };
};

const Hook: React.FC<{ frame: number }> = ({ frame }) => {
  const words = [
    { t: 'PARA DE', land: bf(0), color: C.white, size: 150 },
    { t: 'PAGAR', land: bf(1), color: C.white, size: 200 },
    { t: 'CARO!', land: bf(2), color: C.red, size: 240 },
  ];
  const exit = interpolate(frame, [bf(3), bf(3) + 8], [0, 1], { ...CL, easing: Easing.in(Easing.cubic) });
  if (frame > bf(3) + 9) return null;
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 560, display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: FONT, transform: `translateY(${-760 * exit}px)`, opacity: 1 - exit }}>
      {words.map((w, i) => {
        if (frame < w.land - 5) return <div key={i} style={{ height: w.size * 0.98 }} />;
        const { s, o, shake } = slam(frame, w.land);
        return (
          <div key={i} style={{ fontWeight: 900, fontSize: w.size, lineHeight: 0.98, letterSpacing: -4, color: w.color, opacity: o, transform: `translateX(${shake}px) scale(${s}) rotate(${i === 2 ? -3 : 0}deg)`, textShadow: i === 2 ? `0 0 40px rgba(255,43,43,.55), 0 10px 0 ${C.gold}` : '0 10px 30px rgba(0,0,0,.5)' }}>
            {w.t}
          </div>
        );
      })}
    </div>
  );
};

// ---------- deck-deal-flyin (adaptado 9:16, sem orbit: o monte nasce do celular) ----------
const PRODS = [
  { de: 'R$349', por: 'R$170' }, { de: 'R$849', por: 'R$399' }, { de: 'R$325', por: 'R$142' },
  { de: 'R$399', por: 'R$99' }, { de: 'R$99', por: 'R$53' }, { de: 'R$241', por: 'R$129' },
  { de: 'R$199', por: 'R$89' }, { de: 'R$199', por: 'R$74' }, { de: 'R$127', por: 'R$97' },
];
const N_CARDS = 18;
const CARD_W = 300;
const CARD_H = 410;
const COLS = [60, 390, 720];
const ROW0 = 470;
const ROW_P = 440;
const DS = bf(23);
const PILE = { x: 390, y: 730 };
const STACK_STEP = 3;
const DIVE_EASE = Easing.bezier(0.3, 0, 0.2, 1);
const SETTLE_EASE = Easing.bezier(0.3, 0, 0.25, 1.15);
const HOVER = 40;
const ANT = { from: DS - 9, to: DS, down: 48, pull: 30 };
const DECK = Array.from({ length: N_CARDS }, (_, k) => ({
  prod: k < 9 ? k : (k * 4 + 2) % 9,
  x: COLS[k % 3],
  y: ROW0 + Math.floor(k / 3) * ROW_P,
  cue: DS + 4 * k - 0.0792 * k * (k - 1),
  px: PILE.x + (((k * 7) % 9) - 4) * 2,
  py: PILE.y + (((k * 5) % 7) - 3) * 2,
  rot: ((k * 11) % 7) - 3,
  pz: (N_CARDS - k) * STACK_STEP,
}));
const LAST_LAND = DECK[N_CARDS - 1].cue + 12;
const ZOOM_OUT = [DS + 77, bf(29)] as const;

const deckCam = (f: number) => {
  const ty = interpolate(f, [DS + 12, DS + 40, DS + 62], [0, 560, 1290], { ...CL, easing: Easing.in(Easing.quad) });
  const t = interpolate(f, [ZOOM_OUT[0], ZOOM_OUT[1]], [0, 1], { ...CL, easing: Easing.inOut(Easing.cubic) });
  const z = 1 + (0.56 - 1) * t;
  const cy = 960 + ty + (1775 - (960 + ty)) * t;
  return { z, cx: 540, cy };
};

const Card: React.FC<{ prod: number; style: React.CSSProperties }> = ({ prod, style }) => (
  <div style={{ position: 'absolute', width: CARD_W, height: CARD_H, borderRadius: 26, overflow: 'hidden', background: C.bubble, border: '2px solid rgba(255,255,255,.08)', ...style }}>
    <Img src={staticFile(`img/prod${prod + 1}.jpg`)} style={{ position: 'absolute', left: 0, top: 0, width: CARD_W, height: CARD_W, display: 'block' }} />
    <div style={{ position: 'absolute', left: 0, right: 0, top: CARD_W, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, fontFamily: FONT, fontWeight: 900 }}>
      <span style={{ fontSize: 30, color: C.muted, textDecoration: 'line-through', textDecorationColor: C.red, textDecorationThickness: 4 }}>{PRODS[prod].de}</span>
      <span style={{ fontSize: 48, color: C.green, letterSpacing: -1 }}>{PRODS[prod].por}</span>
    </div>
  </div>
);

const Deck: React.FC<{ frame: number }> = ({ frame }) => {
  const enter = interpolate(frame, [bf(22), bf(22) + 8], [0, 1], { ...CL, easing: Easing.out(Easing.cubic) });
  const antT = interpolate(frame, [ANT.from, ANT.to], [0, 1], { ...CL, easing: Easing.out(Easing.quad) });
  const cam = deckCam(frame);
  const ctaT = interpolate(frame, [bf(33), bf(33) + 10], [0, 1], { ...CL, easing: Easing.inOut(Easing.cubic) });
  return (
    <AbsoluteFill style={{ filter: ctaT > 0 ? `blur(${16 * ctaT}px) brightness(${1 - 0.55 * ctaT})` : undefined }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: 3200, transformOrigin: '0 0', transform: `translate(${540 - cam.cx * cam.z}px, ${960 - cam.cy * cam.z}px) scale(${cam.z})` }}>
        {DECK.map((c, k) => {
          const diveT = interpolate(frame, [c.cue, c.cue + 8], [0, 1], { ...CL, easing: DIVE_EASE });
          const settleT = interpolate(frame, [c.cue + 8, c.cue + 12], [0, 1], { ...CL, easing: SETTLE_EASE });
          const inPile = frame < c.cue;
          const landed = frame >= c.cue + 12;
          const dx = (c.px - c.x) * (1 - diveT);
          const dy = (c.py - c.y) * (1 - diveT);
          const arc = Math.sin(diveT * Math.PI) * 90;
          const zDive = interpolate(diveT, [0, 1], [c.pz, HOVER]) + arc;
          const z = inPile ? c.pz : zDive * (1 - settleT);
          const press = interpolate(frame, [c.cue + 10, c.cue + 11, c.cue + 12], [1, 0.996, 1], CL);
          const scale = (1 + z / 1400) * (1 + Math.sin(diveT * Math.PI) * 0.06) * press;
          const antDy = inPile ? ANT.down * antT : 0;
          const antPull = k === 0 && inPile ? ANT.pull * antT : 0;
          const pileIn = inPile ? 0.6 + 0.4 * enter : 1;
          const transform = landed
            ? 'none'
            : inPile
              ? `translate(${c.px - c.x + antPull * 0.7}px, ${c.py - c.y + antDy + antPull * 0.7 - c.pz}px) rotate(${c.rot}deg) scale(${pileIn * (1 + c.pz / 1400)})`
              : `translate(${dx}px, ${dy - z}px) rotate(${c.rot * (1 - diveT)}deg) scale(${scale})`;
          const shadow = landed
            ? '0 6px 16px rgba(0,0,0,.35)'
            : inPile
              ? '0 2px 5px rgba(0,0,0,.45)'
              : `0 ${36 - 30 * settleT}px ${70 - 54 * settleT}px rgba(0,0,0,${0.55 - 0.3 * settleT})`;
          const zIndex = landed ? 1 + k : inPile ? 100 + (N_CARDS - k) : 1000;
          const ghost = diveT > 0.02 && diveT < 0.98;
          return (
            <div key={k} style={{ position: 'absolute', left: c.x, top: c.y, zIndex, opacity: inPile ? enter : 1 }}>
              {ghost ? (
                <Card prod={c.prod} style={{ left: 0, top: 0, opacity: 0.25 * (1 - diveT), filter: 'blur(6px)', transform: `translate(${dx + (c.px - c.x) * 0.05}px, ${dy - z + (c.py - c.y) * 0.05}px) scale(${scale})` }} />
              ) : null}
              <Card prod={c.prod} style={{ left: 0, top: 0, transform, boxShadow: shadow }} />
            </div>
          );
        })}
      </div>
      <DeckText frame={frame} />
    </AbsoluteFill>
  );
};

const DeckText: React.FC<{ frame: number }> = ({ frame }) => {
  const n = Math.round(interpolate(frame, [DS, LAST_LAND], [0, 50], { ...CL, easing: Easing.in(Easing.quad) }));
  const pillOp = interpolate(frame, [DS - 4, DS + 4, ZOOM_OUT[0], ZOOM_OUT[0] + 6], [0, 1, 1, 0], CL);
  const hl = slam(frame, bf(30), 2.2);
  const scrim = interpolate(frame, [ZOOM_OUT[1], bf(30)], [0, 0.62], CL);
  const out = interpolate(frame, [bf(33), bf(33) + 8], [0, 1], { ...CL, easing: Easing.in(Easing.cubic) });
  const chips = ['AMAZON', 'MERCADO LIVRE', 'SHOPEE'];
  return (
    <>
      {pillOp > 0 ? (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 230, display: 'flex', justifyContent: 'center', opacity: pillOp, fontFamily: FONT }}>
          <div style={{ background: C.green, color: C.bg, fontWeight: 900, fontSize: 64, padding: '12px 34px', borderRadius: 22, boxShadow: '0 12px 40px rgba(0,0,0,.5)' }}>
            +{n} OFERTAS HOJE
          </div>
        </div>
      ) : null}
      <AbsoluteFill style={{ background: `rgba(11,20,26,${scrim * (1 - out)})` }} />
      {frame >= bf(30) - 5 && out < 1 ? (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 640, display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: FONT, opacity: hl.o * (1 - out), transform: `translateX(${hl.shake}px) scale(${hl.s * (1 + out * 0.4)})` }}>
          <div style={{ fontWeight: 900, fontSize: 200, lineHeight: 0.95, letterSpacing: -6, color: C.white, textShadow: '0 12px 40px rgba(0,0,0,.6)' }}>
            <span style={{ color: C.green }}>+50</span>
          </div>
          <div style={{ fontWeight: 900, fontSize: 118, lineHeight: 1, letterSpacing: -3, color: C.white, textShadow: '0 12px 40px rgba(0,0,0,.6)' }}>OFERTAS</div>
          <div style={{ marginTop: 18, fontWeight: 900, fontSize: 92, color: C.bg, background: C.gold, padding: '4px 30px', borderRadius: 18, transform: 'rotate(-3deg)' }}>TODO DIA</div>
          <div style={{ marginTop: 60, display: 'flex', gap: 16 }}>
            {chips.map((t, i) => {
              const f0 = bf(31) + i * 4;
              const p = interpolate(frame, [f0, f0 + 7], [0, 1], { ...CL, easing: Easing.out(Easing.back(2.4)) });
              return (
                <div key={t} style={{ transform: `scale(${p})`, background: C.white, color: C.bg, fontWeight: 900, fontSize: 38, padding: '10px 22px', borderRadius: 40 }}>{t}</div>
              );
            })}
          </div>
        </div>
      ) : null}
    </>
  );
};

// ---------- CTA ----------
const WaIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <path d="M50 8C27 8 9 26 9 48c0 8 2 15 6 21L9 91l23-6c5 3 11 4 18 4 23 0 41-18 41-41S73 8 50 8z" fill={C.white} />
    <path d="M36 30c-2 0-4 1-5 3-2 3-3 7-1 12 3 8 10 16 19 20 5 2 9 1 12-1 2-1 3-3 3-5l-1-2-8-4c-1 0-2 0-3 1l-2 3c-1 1-2 1-3 0-4-2-8-6-10-10 0-1 0-2 1-3l2-2c1-1 1-2 0-3l-3-8c-1-1-1-1-1-1z" fill={C.green} />
  </svg>
);

const Cta: React.FC<{ frame: number }> = ({ frame }) => {
  if (frame < bf(34) - 6) return null;
  const l1 = slam(frame, bf(34));
  const l2 = slam(frame, bf(34) + 4, 2.6);
  const wm = interpolate(frame, [bf(35), bf(35) + 9], [0, 1], { ...CL, easing: Easing.out(Easing.back(2.2)) });
  const btn = interpolate(frame, [bf(36) - 4, bf(36) + 4], [0, 1], { ...CL, easing: Easing.out(Easing.back(2)) });
  const tap = interpolate(frame, [bf(37), bf(37) + 3, bf(37) + 8], [1, 0.92, 1], CL);
  const ripple = interpolate(frame, [bf(37), bf(37) + 18], [0, 1], CL);
  const pulse = frame > bf(37) + 8 ? 1 + 0.03 * Math.max(0, Math.cos(((frame - bf(38)) / 14.748) * Math.PI * 2)) : 1;
  const bio = interpolate(frame, [bf(38) - 4, bf(38) + 4], [0, 1], { ...CL, easing: Easing.out(Easing.back(2)) });
  const bob = frame > bf(38) ? -14 * Math.abs(Math.sin(((frame - bf(38)) / 14.748) * Math.PI)) : 0;
  return (
    <AbsoluteFill style={{ alignItems: 'center', fontFamily: FONT }}>
      <div style={{ position: 'absolute', top: 360, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ fontWeight: 900, fontSize: 130, letterSpacing: -4, lineHeight: 1, color: C.white, opacity: l1.o, transform: `translateX(${l1.shake}px) scale(${l1.s})` }}>ENTRA NO</div>
        <div style={{ fontWeight: 900, fontSize: 200, letterSpacing: -6, lineHeight: 1, color: C.green, opacity: frame >= bf(34) - 1 ? l2.o : 0, transform: `translateX(${l2.shake}px) scale(${l2.s})`, textShadow: '0 0 50px rgba(37,211,102,.45)' }}>GRUPO</div>
      </div>
      <div style={{ position: 'absolute', top: 820, transform: `rotate(-3deg) scale(${wm})` }}>
        <div style={{ background: C.gold, color: C.bg, fontWeight: 900, fontSize: 112, letterSpacing: -3, padding: '6px 40px 14px', borderRadius: 26, boxShadow: `14px 14px 0 ${C.red}` }}>ACHADINHOS</div>
      </div>
      <div style={{ position: 'absolute', top: 1110, transform: `scale(${btn * tap * pulse})` }}>
        <div style={{ position: 'absolute', left: '50%', top: '50%', width: 760, height: 150, marginLeft: -380, marginTop: -75, borderRadius: 80, border: `6px solid ${C.green}`, opacity: ripple > 0 && ripple < 1 ? 1 - ripple : 0, transform: `scale(${1 + ripple * 0.35})` }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 22, background: C.green, color: C.white, fontWeight: 900, fontSize: 62, padding: '26px 54px', borderRadius: 80, boxShadow: '0 18px 50px rgba(37,211,102,.45)' }}>
          <WaIcon size={74} /> ENTRAR NO GRUPO
        </div>
      </div>
      <div style={{ position: 'absolute', top: 1330, display: 'flex', alignItems: 'center', gap: 18, transform: `translateY(${bob}px) scale(${bio})`, fontWeight: 900, fontSize: 64, color: C.white }}>
        <span style={{ color: C.gold, fontSize: 76 }}>↑</span> LINK NA BIO <span style={{ color: C.gold, fontSize: 76 }}>↑</span>
      </div>
    </AbsoluteFill>
  );
};

// ---------- som ----------
type Sfx = { f: number; src: string; v: number };
const SFX: Sfx[] = [
  { f: bf(0) - 1, src: 'hit-weak', v: 0.9 },
  { f: bf(1) - 1, src: 'hit-weak', v: 0.9 },
  { f: bf(2) - 1, src: 'bass-hit-short', v: 1 },
  { f: bf(3) - 2, src: 'whoosh-fast', v: 0.7 },
  ...STOPS.flatMap((st) => [
    { f: bf(st.L + 1), src: 'marker-pen-line', v: 0.9 },
    { f: bf(st.L + 2), src: 'impact-zoom-quick', v: 0.85 },
    { f: bf(st.L + 2) + 7, src: 'pop', v: 0.9 },
    { f: bf(st.L + 4), src: 'swoosh-quick', v: 0.8 },
  ]),
  { f: bf(22) - 2, src: 'sweep-fast', v: 0.55 },
  { f: DS - 2, src: 'whoosh-big', v: 0.7 },
  { f: DS + 22, src: 'whoosh-fast', v: 0.55 },
  { f: ZOOM_OUT[0], src: 'swoosh-quick', v: 0.6 },
  { f: bf(30) - 1, src: 'bass-hit-short', v: 1 },
  { f: bf(31), src: 'pop', v: 0.55 },
  { f: bf(31) + 4, src: 'pop', v: 0.5 },
  { f: bf(31) + 8, src: 'pop', v: 0.45 },
  { f: bf(34) - 1, src: 'hit-fast-exciting', v: 0.85 },
  { f: bf(35), src: 'pop', v: 0.8 },
  { f: bf(37), src: 'ui-message-pop', v: 0.9 },
  { f: bf(38), src: 'sparkle', v: 0.45 },
];

// ---------- composição ----------
export const Reel: React.FC<{ bgm: boolean }> = ({ bgm }) => {
  const frame = useCurrentFrame();
  const phoneY = interpolate(frame, [bf(3), bf(4)], [1500, 0], { ...CL, easing: Easing.out(Easing.back(1.15)) });
  const phoneOut = interpolate(frame, [bf(22), bf(22) + 8], [0, 1], { ...CL, easing: Easing.in(Easing.cubic) });
  const cam = camAt(frame);
  const showPhone = frame >= bf(3) && frame <= bf(22) + 9;
  return (
    <AbsoluteFill style={{ background: C.bg, overflow: 'hidden' }}>
      <AbsoluteFill style={{ background: `radial-gradient(900px 700px at 50% 0%, rgba(229,57,53,.22), transparent 70%), radial-gradient(1000px 800px at 50% 100%, rgba(37,211,102,.20), transparent 70%)` }} />
      <AbsoluteFill style={{ opacity: 0.06, backgroundImage: 'radial-gradient(#fff 2px, transparent 2px)', backgroundSize: '44px 44px' }} />

      <Hook frame={frame} />

      {showPhone ? (
        <AbsoluteFill style={{ transformOrigin: '0 0', transform: `translate(${540 - cam.cx * cam.z}px, ${960 - cam.cy * cam.z}px) scale(${cam.z})` }}>
          <AbsoluteFill style={{ transform: `translateY(${phoneY}px) scale(${1 - 0.55 * phoneOut})`, opacity: 1 - phoneOut, transformOrigin: '540px 935px' }}>
            <Phone frame={frame} />
          </AbsoluteFill>
        </AbsoluteFill>
      ) : null}
      {showPhone && phoneOut === 0 ? <Caption frame={frame} /> : null}

      {frame >= bf(22) ? <Deck frame={frame} /> : null}
      <Cta frame={frame} />

      {bgm ? (
        <Audio src={staticFile('audio/bgm.mp3')} volume={(f) => interpolate(f, [0, 3, REEL_DURATION - 20, REEL_DURATION], [0, 0.55, 0.55, 0], CL)} />
      ) : null}
      {SFX.map((s, i) => (
        <Sequence key={i} from={Math.max(0, s.f)} durationInFrames={90} layout="none">
          <Audio src={staticFile(`audio/sfx/${s.src}.mp3`)} volume={s.v} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
