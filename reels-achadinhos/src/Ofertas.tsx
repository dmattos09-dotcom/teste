// Reels "Ofertas do dia" — formato cartão de oferta (uma oferta por tela).
// Grade de batidas igual ao primeiro Reels (house-vibez 122 BPM).
//   b0–b4    INTRO   ACHADINHOS · ESSAS OFERTAS / SOMEM RÁPIDO · quem tá no grupo compra primeiro
//   b4–b40   6 OFERTAS × 6 batidas: flash → título + cartões entram → NA LOJA → círculo no print
//            → NO GRUPO (slam) → selo de desconto → ECONOMIA DE R$ → respira
//   b40–b48  CTA     ENTRA NO GRUPO · ACHADINHOS · botão · LINK NA BIO
import {
  AbsoluteFill, Audio, Easing, Img, Sequence, interpolate, staticFile, useCurrentFrame,
} from 'remotion';
import { bf, CL, FONT, C, Burst, WaIcon, slam } from './Reel';
import PR from './prints.json';

export const OFERTAS_DURATION = bf(48) + 18;

type Offer = { id: keyof typeof PR; title: string; loja: string; grupo: string; off: string; eco: string; store: string };
const OFFERS: Offer[] = [
  { id: 'tv', title: 'SMART TV TCL 65" 4K', loja: 'R$ 4.099,00', grupo: '3.179,67', off: '-22%', eco: 'R$ 919,33', store: 'MERCADO LIVRE' },
  { id: 'ducha', title: 'DUCHA PLENUM 3 FUNÇÕES', loja: 'R$ 658,30', grupo: '239,67', off: '-64%', eco: 'R$ 418,63', store: 'AMAZON' },
  { id: 'lustre', title: 'LUSTRE LED 3 ARCOS', loja: 'R$ 199,99', grupo: '74,25', off: '-63%', eco: 'R$ 125,74', store: 'MERCADO LIVRE' },
  { id: 'tacas', title: '6 TAÇAS BOHEMIA CRISTAL', loja: 'R$ 199,99', grupo: '89,99', off: '-55%', eco: 'R$ 110,00', store: 'MERCADO LIVRE' },
  { id: 'jantar', title: 'APARELHO DE JANTAR 20 PÇS', loja: 'R$ 349,90', grupo: '168,49', off: '-52%', eco: 'R$ 181,41', store: 'MERCADO LIVRE' },
  { id: 'aspirador', title: 'ASPIRADOR PHILCO 2 EM 1', loja: 'R$ 241,00', grupo: '129,90', off: '-46%', eco: 'R$ 111,10', store: 'AMAZON' },
];
const SCENE_BEATS = 6;
const sceneStart = (i: number) => 4 + SCENE_BEATS * i; // em batidas
const CTA_B = 4 + SCENE_BEATS * OFFERS.length; // 40

const G = {
  panel: '#15161b',
  gold1: '#ffe08a',
  gold2: '#ffb02e',
};
const GOLD_TEXT: React.CSSProperties = {
  background: `linear-gradient(180deg, ${G.gold1} 0%, ${C.gold} 45%, ${G.gold2} 100%)`,
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
};

const ease = (frame: number, a: number, b: number, e = Easing.out(Easing.cubic)) => interpolate(frame, [a, b], [0, 1], { ...CL, easing: e });

// ---------- fundo ----------
const Background: React.FC<{ frame: number }> = ({ frame }) => (
  <AbsoluteFill style={{ background: G.panel, overflow: 'hidden' }}>
    <AbsoluteFill style={{ background: 'radial-gradient(700px 520px at 18% 30%, rgba(255,176,46,.32), transparent 70%), radial-gradient(640px 520px at 88% 58%, rgba(255,200,61,.24), transparent 70%), radial-gradient(800px 600px at 50% 100%, rgba(37,211,102,.12), transparent 70%)' }} />
    {[0, 1].map((r) => (
      <div key={r} style={{ position: 'absolute', top: 1380 + r * 210, left: -200 + (r ? -1 : 1) * ((frame * 1.2) % 400), whiteSpace: 'nowrap', fontFamily: FONT, fontWeight: 900, fontStyle: 'italic', fontSize: 230, letterSpacing: -6, color: 'transparent', WebkitTextStroke: '3px rgba(255,200,61,.10)' }}>
        ECONOMIZE ECONOMIZE ECONOMIZE
      </div>
    ))}
  </AbsoluteFill>
);

// ---------- círculo à mão no print ----------
const PrintCircle: React.FC<{ w: number; h: number; box: number[]; t: number }> = ({ w, h, box, t }) => {
  const [x0, y0, x1, y1] = box;
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const rx = (x1 - x0) / 2 + 30;
  const ry = (y1 - y0) / 2 + 26;
  const d: string[] = [];
  for (let i = 0; i <= 60; i++) {
    const th = -0.5 + (i / 60) * (Math.PI * 2 + 0.7);
    const wob = 1 + 0.035 * Math.sin(th * 3 + 0.7) + 0.02 * (i / 60);
    d.push(`${i ? 'L' : 'M'}${(cx + rx * wob * Math.cos(th)).toFixed(1)},${(cy + ry * wob * Math.sin(th) - 6 * Math.cos(th)).toFixed(1)}`);
  }
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}>
      <path d={d.join(' ')} pathLength={1} fill="none" stroke={C.red} strokeWidth={18} strokeLinecap="round" strokeDasharray="1 1" strokeDashoffset={1 - t} style={{ filter: 'drop-shadow(0 0 8px rgba(255,43,43,.7))' }} />
    </svg>
  );
};

// ---------- uma oferta ----------
const PRINT_W = 312;
const OfferScene: React.FC<{ o: Offer; frame: number; t0: number }> = ({ o, frame, t0 }) => {
  const b = (n: number) => bf(n); // batidas absolutas
  const s0 = sceneStart(OFFERS.indexOf(o));
  const pr = PR[o.id];
  const printH = Math.min(650, (PRINT_W * pr.ph) / pr.pw);
  const f = frame;

  const titleT = ease(f, t0, t0 + 7, Easing.out(Easing.back(1.6)));
  const prodT = ease(f, t0 + 1, t0 + 12, Easing.out(Easing.back(1.25)));
  const printT = ease(f, t0 + 5, t0 + 16, Easing.out(Easing.back(1.25)));
  const lojaT = ease(f, b(s0 + 1) - 3, b(s0 + 1) + 5);
  const strikeT = ease(f, b(s0 + 1) + 3, b(s0 + 1) + 9, Easing.out(Easing.quad));
  const circleT = ease(f, b(s0 + 1.5), b(s0 + 1.5) + 10, Easing.out(Easing.quad));
  const g = slam(f, b(s0 + 2), 2.3, 5);
  const burstT = ease(f, b(s0 + 2.5) - 2, b(s0 + 2.5) + 7, Easing.out(Easing.back(2.6)));
  const ecoT = ease(f, b(s0 + 3) - 3, b(s0 + 3) + 6, Easing.out(Easing.back(1.8)));
  const push = 1 + 0.035 * ease(f, t0, b(s0 + SCENE_BEATS), Easing.inOut(Easing.quad));
  const float = Math.sin((f - t0) / 14) * 6;
  const gFont = Math.min(170, 600 / (o.grupo.length * 0.6));

  return (
    <AbsoluteFill style={{ fontFamily: FONT, transform: `scale(${push})` }}>
      {/* selo "saiu no grupo" */}
      <div style={{ position: 'absolute', right: 56, top: 262, transform: `translateY(${(1 - titleT) * -40}px) rotate(-2deg)`, opacity: titleT }}>
        <div style={{ background: `linear-gradient(90deg, ${C.red}, #ff6a2b)`, color: C.white, fontWeight: 900, fontSize: 30, padding: '10px 22px', borderRadius: 12, letterSpacing: 0.5, boxShadow: '0 8px 24px rgba(255,43,43,.35)' }}>
          ⚡ SAIU NO GRUPO ACHADINHOS
        </div>
      </div>
      {/* título */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 336, textAlign: 'center', fontWeight: 900, fontStyle: 'italic', fontSize: 66, letterSpacing: -1.5, color: C.white, textShadow: '0 6px 24px rgba(0,0,0,.6)', transform: `scale(${0.6 + 0.4 * titleT})`, opacity: titleT }}>
        {o.title}
      </div>
      {/* foto do produto */}
      <div style={{ position: 'absolute', left: 54, top: 460 + float * 0.6, width: 610, height: 610, transform: `translateX(${(1 - prodT) * -760}px) rotate(${-3 + 3 * prodT}deg)`, borderRadius: 34, padding: 8, background: `linear-gradient(135deg, ${G.gold1}, ${G.gold2})`, boxShadow: '0 30px 70px rgba(0,0,0,.55), 0 0 60px rgba(255,176,46,.35)' }}>
        <Img src={staticFile(`img/o_${o.id}.jpg`)} style={{ width: '100%', height: '100%', borderRadius: 28, display: 'block', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', left: 24, bottom: 22, background: 'rgba(11,20,26,.85)', color: C.white, fontWeight: 800, fontSize: 24, padding: '6px 14px', borderRadius: 10 }}>{o.store}</div>
      </div>
      {/* print do grupo */}
      <div style={{ position: 'absolute', left: 692, top: 470 - float * 0.5, width: PRINT_W, transform: `translateX(${(1 - printT) * 520}px) rotate(${4 * printT + 10 * (1 - printT)}deg)` }}>
        <div style={{ position: 'absolute', left: 30, top: -40, background: C.gold, color: C.bg, fontWeight: 900, fontSize: 24, padding: '6px 16px', borderRadius: '10px 10px 0 0', zIndex: 2 }}>PRINT DO GRUPO</div>
        <div style={{ position: 'relative', width: PRINT_W, height: printH, borderRadius: 20, overflow: 'hidden', border: '6px solid #fff', boxShadow: '0 24px 60px rgba(0,0,0,.6)', background: C.bg }}>
          <div style={{ position: 'absolute', left: 0, bottom: 0, width: PRINT_W - 12, height: ((PRINT_W - 12) * pr.ph) / pr.pw }}>
            <Img src={staticFile(`img/p_${o.id}.jpg`)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />
            <PrintCircle w={pr.pw} h={pr.ph} box={pr.box} t={circleT} />
          </div>
        </div>
      </div>
      {/* selo de desconto */}
      <div style={{ position: 'absolute', left: 520, top: 392, transform: `rotate(-12deg) scale(${burstT})` }}>
        <Burst size={230} label={o.off} />
      </div>
      {/* preços */}
      <div style={{ position: 'absolute', left: 70, top: 1236, opacity: lojaT, transform: `translateY(${(1 - lojaT) * 30}px)` }}>
        <div style={{ fontWeight: 800, fontSize: 30, letterSpacing: 3, color: C.gold }}>NA LOJA</div>
        <div style={{ position: 'relative', fontWeight: 900, fontSize: 48, color: 'rgba(255,255,255,.72)' }}>
          {o.loja}
          <div style={{ position: 'absolute', left: -6, top: '52%', height: 6, width: `calc(${strikeT * 100}% + 12px)`, background: C.red, borderRadius: 3, transform: 'rotate(-4deg)' }} />
        </div>
      </div>
      {f >= b(s0 + 2) - 5 ? (
        <div style={{ position: 'absolute', right: 56, top: 1180, textAlign: 'right', opacity: g.o, transform: `translateX(${g.shake}px) scale(${g.s})`, transformOrigin: '100% 60%' }}>
          <div style={{ fontWeight: 800, fontSize: 30, letterSpacing: 3, color: C.green }}>NO GRUPO</div>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', lineHeight: 0.95, filter: 'drop-shadow(0 0 28px rgba(255,176,46,.45)) drop-shadow(0 8px 0 rgba(0,0,0,.35))' }}>
            <span style={{ ...GOLD_TEXT, fontWeight: 900, fontSize: gFont * 0.42, marginTop: gFont * 0.1, marginRight: 8 }}>R$</span>
            <span style={{ ...GOLD_TEXT, fontWeight: 900, fontStyle: 'italic', fontSize: gFont, letterSpacing: -5 }}>{o.grupo}</span>
          </div>
        </div>
      ) : null}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1440, display: 'flex', justifyContent: 'center', opacity: ecoT, transform: `scale(${0.7 + 0.3 * ecoT})` }}>
        <div style={{ fontWeight: 900, fontStyle: 'italic', fontSize: 48, color: C.white, background: 'rgba(37,211,102,.16)', border: `3px solid ${C.green}`, padding: '10px 30px', borderRadius: 60 }}>
          ECONOMIA DE <span style={{ color: C.green }}>{o.eco}</span> 💪
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- intro ----------
const Intro: React.FC<{ frame: number }> = ({ frame }) => {
  if (frame > bf(4) + 2) return null;
  const wm = slam(frame, bf(0) + 4, 2.2);
  const l1 = slam(frame, bf(1));
  const l2 = slam(frame, bf(2), 2.6);
  const sub = ease(frame, bf(3) - 4, bf(3) + 6, Easing.out(Easing.back(1.6)));
  return (
    <AbsoluteFill style={{ fontFamily: FONT, alignItems: 'center' }}>
      <div style={{ position: 'absolute', top: 420, opacity: wm.o, transform: `rotate(-3deg) scale(${wm.s})` }}>
        <div style={{ background: C.gold, color: C.bg, fontWeight: 900, fontSize: 112, letterSpacing: -3, padding: '6px 40px 14px', borderRadius: 26, boxShadow: `14px 14px 0 ${C.red}` }}>ACHADINHOS</div>
      </div>
      {frame >= bf(1) - 5 ? (
        <div style={{ position: 'absolute', left: 0, right: 0, textAlign: 'center', whiteSpace: 'nowrap', top: 760, fontWeight: 900, fontStyle: 'italic', fontSize: 128, letterSpacing: -4, color: C.white, opacity: l1.o, transform: `translateX(${l1.shake}px) scale(${l1.s})`, textShadow: '0 10px 30px rgba(0,0,0,.5)' }}>ESSAS OFERTAS</div>
      ) : null}
      {frame >= bf(2) - 5 ? (
        <div style={{ position: 'absolute', left: 0, right: 0, textAlign: 'center', whiteSpace: 'nowrap', top: 900, fontWeight: 900, fontStyle: 'italic', fontSize: 140, letterSpacing: -5, opacity: l2.o, transform: `translateX(${l2.shake}px) scale(${l2.s})`, filter: 'drop-shadow(0 0 30px rgba(255,176,46,.5))' }}>
          <span style={GOLD_TEXT}>SOMEM RÁPIDO</span>
        </div>
      ) : null}
      <div style={{ position: 'absolute', left: 0, right: 0, textAlign: 'center', top: 1100, fontWeight: 700, fontSize: 44, color: C.white, opacity: sub, transform: `translateY(${(1 - sub) * 30}px)` }}>
        ⏳ Quem tá no grupo compra primeiro
      </div>
    </AbsoluteFill>
  );
};

// ---------- CTA ----------
const Cta: React.FC<{ frame: number }> = ({ frame }) => {
  const B = CTA_B;
  if (frame < bf(B) - 2) return null;
  const bgT = ease(frame, bf(B), bf(B) + 10);
  const l1 = slam(frame, bf(B + 1));
  const l2 = slam(frame, bf(B + 1) + 4, 2.6);
  const wm = ease(frame, bf(B + 2), bf(B + 2) + 9, Easing.out(Easing.back(2.2)));
  const btn = ease(frame, bf(B + 3) - 4, bf(B + 3) + 4, Easing.out(Easing.back(2)));
  const tap = interpolate(frame, [bf(B + 4), bf(B + 4) + 3, bf(B + 4) + 8], [1, 0.92, 1], CL);
  const ripple = interpolate(frame, [bf(B + 4), bf(B + 4) + 18], [0, 1], CL);
  const bio = ease(frame, bf(B + 5) - 4, bf(B + 5) + 4, Easing.out(Easing.back(2)));
  const bob = frame > bf(B + 5) ? -14 * Math.abs(Math.sin(((frame - bf(B + 5)) / 14.748) * Math.PI)) : 0;
  return (
    <AbsoluteFill style={{ fontFamily: FONT, alignItems: 'center', opacity: bgT }}>
      {/* mosaico das ofertas ao fundo */}
      <AbsoluteFill style={{ filter: 'blur(14px) brightness(.38)', transform: `scale(${1.1 - 0.05 * bgT})` }}>
        {OFFERS.map((o, i) => (
          <Img key={o.id} src={staticFile(`img/o_${o.id}.jpg`)} style={{ position: 'absolute', width: 540, height: 640, objectFit: 'cover', left: (i % 2) * 540, top: Math.floor(i / 2) * 640 }} />
        ))}
      </AbsoluteFill>
      <div style={{ position: 'absolute', top: 360, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ fontWeight: 900, fontSize: 130, letterSpacing: -4, lineHeight: 1, color: C.white, opacity: frame >= bf(B + 1) - 5 ? l1.o : 0, transform: `translateX(${l1.shake}px) scale(${l1.s})` }}>ENTRA NO</div>
        <div style={{ fontWeight: 900, fontSize: 200, letterSpacing: -6, lineHeight: 1, color: C.green, opacity: frame >= bf(B + 1) - 1 ? l2.o : 0, transform: `translateX(${l2.shake}px) scale(${l2.s})`, textShadow: '0 0 50px rgba(37,211,102,.45)' }}>GRUPO</div>
      </div>
      <div style={{ position: 'absolute', top: 820, transform: `rotate(-3deg) scale(${wm})` }}>
        <div style={{ background: C.gold, color: C.bg, fontWeight: 900, fontSize: 112, letterSpacing: -3, padding: '6px 40px 14px', borderRadius: 26, boxShadow: `14px 14px 0 ${C.red}` }}>ACHADINHOS</div>
      </div>
      <div style={{ position: 'absolute', top: 1110, transform: `scale(${btn * tap})` }}>
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
const SFX: { f: number; src: string; v: number }[] = [
  { f: bf(0) + 3, src: 'bass-hit-short', v: 0.9 },
  { f: bf(1) - 1, src: 'hit-weak', v: 0.9 },
  { f: bf(2) - 1, src: 'bass-hit-short', v: 1 },
  { f: bf(3) - 3, src: 'pop', v: 0.6 },
  ...OFFERS.flatMap((_, i) => {
    const s = sceneStart(i);
    return [
      { f: bf(s) - 3, src: i % 2 ? 'swoosh-quick' : 'whoosh-fast', v: 0.65 },
      { f: bf(s) + 5, src: 'air-woosh-quick', v: 0.45 },
      { f: bf(s + 1.5), src: 'marker-pen-line', v: 0.75 },
      { f: bf(s + 2) - 1, src: 'bass-hit-short', v: 0.9 },
      { f: bf(s + 2.5) - 1, src: 'pop', v: 0.85 },
      { f: bf(s + 3), src: 'ui-success-soft', v: 0.5 },
    ];
  }),
  { f: bf(CTA_B) - 3, src: 'whoosh-big', v: 0.6 },
  { f: bf(CTA_B + 1) - 1, src: 'hit-fast-exciting', v: 0.85 },
  { f: bf(CTA_B + 2), src: 'pop', v: 0.8 },
  { f: bf(CTA_B + 4), src: 'ui-message-pop', v: 0.9 },
  { f: bf(CTA_B + 5), src: 'sparkle', v: 0.4 },
];

export const Ofertas: React.FC<{ bgm: boolean }> = ({ bgm }) => {
  const frame = useCurrentFrame();
  const idx = OFFERS.findIndex((_, i) => frame >= bf(sceneStart(i)) && frame < bf(sceneStart(i + 1)));
  // flash branco em cada troca de tela (como no modelo)
  const cuts = [...OFFERS.map((_, i) => bf(sceneStart(i))), bf(CTA_B)];
  const flash = Math.max(0, ...cuts.map((c) => interpolate(frame, [c - 1, c, c + 5], [0, 0.85, 0], CL)));
  return (
    <AbsoluteFill style={{ background: G.panel }}>
      <Background frame={frame} />
      <Intro frame={frame} />
      {idx >= 0 ? <OfferScene key={idx} o={OFFERS[idx]} frame={frame} t0={bf(sceneStart(idx))} /> : null}
      <Cta frame={frame} />
      <AbsoluteFill style={{ background: '#fff', opacity: flash, pointerEvents: 'none' }} />
      {bgm ? (
        <Audio src={staticFile('audio/bgm.mp3')} volume={(f) => interpolate(f, [0, 3, OFERTAS_DURATION - 20, OFERTAS_DURATION], [0, 0.55, 0.55, 0], CL)} />
      ) : null}
      {SFX.map((s, i) => (
        <Sequence key={i} from={Math.max(0, s.f)} durationInFrames={90} layout="none">
          <Audio src={staticFile(`audio/sfx/${s.src}.mp3`)} volume={s.v} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
