"use client";
import { useState, useEffect } from "react";
import { useTheme } from "./ThemeProvider";

// Stage colors — must stay in sync with mokuState.js
function getStage(level) {
  if (level <= 5) return "baby";
  if (level <= 10) return "teen";
  if (level <= 15) return "prince";
  return "legendary";
}
function getColors(level) {
  const stage = getStage(level);
  switch (stage) {
    case "baby":      return { c1: "#9b8df7", c2: "#7c6cf7", c3: "#5e40c8", glow: "#7c5ce7", tint: "#a89af8" };
    case "teen":      return { c1: "#5de6b8", c2: "#00bfa6", c3: "#008c7a", glow: "#00e5c8", tint: "#7ff0cc" };
    case "prince":    return { c1: "#ff9870", c2: "#f4511e", c3: "#c0351a", glow: "#ff6b35", tint: "#ffb39a" };
    case "legendary": return { c1: "#ffd54f", c2: "#ffb300", c3: "#e65100", glow: "#ffd700", tint: "#ffe680" };
    default:          return { c1: "#9b8df7", c2: "#7c6cf7", c3: "#5e40c8", glow: "#7c5ce7", tint: "#a89af8" };
  }
}

export default function MokuCreature({ size = 200, glow = true, expression = "happy", level = 1 }) {
  const t = useTheme();
  const [blink, setBlink] = useState(false);
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const b = setInterval(() => { setBlink(true); setTimeout(() => setBlink(false), 160); }, 3000 + Math.random() * 2400);
    const f = setInterval(() => setFrame(p => (p + 1) % 120), 60);
    return () => { clearInterval(b); clearInterval(f); };
  }, []);

  const stage = getStage(level);
  const colors = getColors(level);
  const dk = t.mode === "dark";

  const breathe = Math.sin(frame * .08) * 2.5;
  const wobble = Math.sin(frame * .05) * 1.5;
  const eyeH = blink ? 0.5 : (expression === "excited" ? 9.5 : expression === "sleepy" ? 4 : 8);

  // Glow scales with stage
  const glowPx = glow ? ({ baby: 16, teen: 22, prince: 32, legendary: 48 }[stage]) : 0;
  const glowOp = { baby: "40", teen: "55", prince: "70", legendary: "90" }[stage];
  const glowF = glow
    ? `drop-shadow(0 0 ${glowPx}px ${colors.glow}${glowOp})${stage === "legendary" ? ` drop-shadow(0 0 ${glowPx * 2}px ${colors.glow}30)` : ""}`
    : "none";

  const id = `m${size}${t.mode}${stage}`;
  const mouthD = expression === "excited" ? "M 88 112 Q 100 124 112 112" : expression === "sleepy" ? "M 92 114 Q 100 118 108 114" : "M 90 111 Q 100 120 110 111";

  return (
    <svg width={size} height={size} viewBox="0 0 200 200" style={{ filter: glowF, transition: "filter .5s", overflow: "visible" }}>
      <defs>
        <radialGradient id={`b${id}`} cx="50%" cy="36%" r="54%">
          <stop offset="0%" stopColor={colors.tint} />
          <stop offset="50%" stopColor={colors.c2} />
          <stop offset="100%" stopColor={colors.c3} />
        </radialGradient>
        <radialGradient id={`bl${id}`} cx="50%" cy="38%" r="50%">
          <stop offset="0%" stopColor={colors.tint} opacity=".4" />
          <stop offset="100%" stopColor={colors.c2} opacity=".04" />
        </radialGradient>
        <radialGradient id={`aura${id}`} cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor={colors.glow} opacity=".3" />
          <stop offset="100%" stopColor={colors.glow} opacity="0" />
        </radialGradient>
        <filter id={`g${id}`}><feGaussianBlur stdDeviation="2.8" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        <filter id={`soft${id}`}><feGaussianBlur stdDeviation="5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>

      {/* ── LEGENDARY: multi aura rings ── */}
      {stage === "legendary" && [0, 1, 2].map(i => (
        <ellipse key={i} cx="100" cy="108"
          rx={68 + i * 20 + Math.sin(frame * .04 + i * 1.2) * 5}
          ry={58 + i * 16 + Math.sin(frame * .04 + i * 1.2) * 4}
          fill="none" stroke={colors.glow} strokeWidth={3 - i}
          opacity={(.14 - i * .04 + Math.sin(frame * .05 + i) * .05).toFixed(2)}
        />
      ))}
      {/* LEGENDARY: ambient aura fill */}
      {stage === "legendary" && (
        <ellipse cx="100" cy="108" rx={80} ry={68} fill={`url(#aura${id})`} opacity={(.4 + Math.sin(frame * .03) * .15).toFixed(2)} />
      )}

      {/* ── PRINCE+: wide wings behind body ── */}
      {(stage === "prince" || stage === "legendary") && (
        <>
          {/* Left wing */}
          <path
            d={`M 76 115 Q ${44 + Math.sin(frame * .05) * 5} ${72 + Math.sin(frame * .04) * 5} ${38 + Math.sin(frame * .04) * 4} ${92 + Math.sin(frame * .03) * 4} Q 40 120 76 122`}
            fill={colors.c1} opacity={stage === "legendary" ? ".6" : ".45"}
            filter={`url(#g${id})`}
          />
          {/* Right wing */}
          <path
            d={`M 124 115 Q ${156 + Math.sin(frame * .05) * 5} ${72 + Math.sin(frame * .04) * 5} ${162 + Math.sin(frame * .04) * 4} ${92 + Math.sin(frame * .03) * 4} Q 160 120 124 122`}
            fill={colors.c1} opacity={stage === "legendary" ? ".6" : ".45"}
            filter={`url(#g${id})`}
          />
          {/* Wing veins */}
          <path d={`M 76 115 Q ${50 + Math.sin(frame * .05) * 4} ${80 + Math.sin(frame * .04) * 3} ${42 + Math.sin(frame * .04) * 3} ${96 + Math.sin(frame * .03) * 3}`} stroke={colors.tint} strokeWidth=".9" fill="none" opacity=".5" strokeLinecap="round" />
          <path d={`M 124 115 Q ${150 + Math.sin(frame * .05) * 4} ${80 + Math.sin(frame * .04) * 3} ${158 + Math.sin(frame * .04) * 3} ${96 + Math.sin(frame * .03) * 3}`} stroke={colors.tint} strokeWidth=".9" fill="none" opacity=".5" strokeLinecap="round" />
        </>
      )}

      {/* ── TEEN: small wing buds ── */}
      {stage === "teen" && (
        <>
          <ellipse cx="70" cy="116" rx={10 + Math.sin(frame * .06) * 1.5} ry="5" fill={colors.c1} opacity=".55" transform="rotate(-25 70 116)" filter={`url(#g${id})`} />
          <ellipse cx="130" cy="116" rx={10 + Math.sin(frame * .06) * 1.5} ry="5" fill={colors.c1} opacity=".55" transform="rotate(25 130 116)" filter={`url(#g${id})`} />
        </>
      )}

      <g transform={`translate(${wobble},${breathe})`}>
        {/* Shadow */}
        <ellipse cx="100" cy="152" rx={42 - breathe} ry={10 + breathe * .5} fill={colors.c2} opacity={dk ? ".08" : ".06"} />

        {/* ── Body ── */}
        <ellipse cx="100" cy="108" rx={52 + breathe * .3} ry={47 - breathe * .2} fill={`url(#b${id})`} />
        <ellipse cx="100" cy="118" rx="28" ry="20" fill={`url(#bl${id})`} />

        {/* Ear bumps */}
        <ellipse cx="74" cy="68" rx="7" ry={stage === "legendary" ? 15 : 12} fill={colors.c1} opacity=".8" transform="rotate(-12 74 68)" />
        <ellipse cx="126" cy="68" rx="7" ry={stage === "legendary" ? 15 : 12} fill={colors.c1} opacity=".8" transform="rotate(12 126 68)" />
        <ellipse cx="74" cy="63" rx="4" ry="6.5" fill={colors.glow} opacity=".55" transform="rotate(-12 74 63)" filter={`url(#g${id})`} />
        <ellipse cx="126" cy="63" rx="4" ry="6.5" fill={colors.glow} opacity=".55" transform="rotate(12 126 63)" filter={`url(#g${id})`} />

        {/* ── TEEN+: horns ── */}
        {stage !== "baby" && (
          <>
            {/* Left horn */}
            <path
              d={`M 86 62 Q ${80 + Math.sin(frame * .06) * 2} ${44 + Math.sin(frame * .06) * 3} ${84 + Math.sin(frame * .05) * 2} ${28 + Math.sin(frame * .06) * 2}`}
              stroke={colors.c1} strokeWidth={stage === "legendary" ? 6 : stage === "prince" ? 5 : 4}
              fill="none" strokeLinecap="round"
            />
            {/* Right horn */}
            <path
              d={`M 114 62 Q ${120 + Math.sin(frame * .06) * 2} ${44 + Math.sin(frame * .06) * 3} ${116 + Math.sin(frame * .05) * 2} ${28 + Math.sin(frame * .06) * 2}`}
              stroke={colors.c1} strokeWidth={stage === "legendary" ? 6 : stage === "prince" ? 5 : 4}
              fill="none" strokeLinecap="round"
            />
            {/* Horn glow tips */}
            <circle cx={84 + Math.sin(frame * .05) * 2} cy={28 + Math.sin(frame * .06) * 2} r={stage === "legendary" ? 6 : stage === "prince" ? 5 : 4} fill={colors.glow} opacity=".85" filter={`url(#g${id})`} />
            <circle cx={116 + Math.sin(frame * .05) * 2} cy={28 + Math.sin(frame * .06) * 2} r={stage === "legendary" ? 6 : stage === "prince" ? 5 : 4} fill={colors.glow} opacity=".85" filter={`url(#g${id})`} />
          </>
        )}

        {/* ── LEGENDARY: crown center spike ── */}
        {stage === "legendary" && (
          <>
            <path
              d={`M 100 52 Q ${97 + Math.sin(frame * .07) * 2} ${30 + Math.sin(frame * .07) * 4} ${100 + Math.sin(frame * .06) * 1} ${16 + Math.sin(frame * .07) * 3}`}
              stroke={colors.glow} strokeWidth="6" fill="none" strokeLinecap="round"
            />
            <circle cx={100 + Math.sin(frame * .06) * 1} cy={16 + Math.sin(frame * .07) * 3} r="7" fill={colors.glow} opacity=".95" filter={`url(#soft${id})`} />
            <circle cx={100 + Math.sin(frame * .06) * 1} cy={16 + Math.sin(frame * .07) * 3} r="4" fill="#fff" opacity=".7" />
          </>
        )}

        {/* ── Eyes ── */}
        {expression === "sleepy" ? (
          <>
            <path d="M 78 97 Q 85 93 92 97" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M 108 97 Q 115 93 122 97" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            <ellipse cx="85" cy="98" rx="9" ry={eyeH} fill="#fff" style={{ transition: "ry .12s" }} />
            <ellipse cx="115" cy="98" rx="9" ry={eyeH} fill="#fff" style={{ transition: "ry .12s" }} />
            {!blink && (
              stage === "legendary" ? (
                <>
                  {/* Legendary: glowing golden pupils */}
                  <ellipse cx={87 + wobble * .3} cy="98" rx="4.5" ry="5" fill={colors.c3} />
                  <ellipse cx={117 + wobble * .3} cy="98" rx="4.5" ry="5" fill={colors.c3} />
                  <circle cx={88 + wobble * .2} cy="95.5" r="2.5" fill={colors.glow} opacity=".9" filter={`url(#g${id})`} />
                  <circle cx={118 + wobble * .2} cy="95.5" r="2.5" fill={colors.glow} opacity=".9" filter={`url(#g${id})`} />
                </>
              ) : (
                <>
                  <ellipse cx={87 + wobble * .3} cy="98" rx="4.5" ry="5" fill={dk ? "#0e0a1a" : "#1a1230"} />
                  <ellipse cx={117 + wobble * .3} cy="98" rx="4.5" ry="5" fill={dk ? "#0e0a1a" : "#1a1230"} />
                  <circle cx={88 + wobble * .2} cy="95.5" r="1.8" fill="#fff" />
                  <circle cx={118 + wobble * .2} cy="95.5" r="1.8" fill="#fff" />
                </>
              )
            )}
          </>
        )}

        {/* Cheeks */}
        <ellipse cx="72" cy="108" rx="7" ry="4.5" fill={t.pink} opacity={expression === "excited" ? ".22" : ".13"} />
        <ellipse cx="128" cy="108" rx="7" ry="4.5" fill={t.pink} opacity={expression === "excited" ? ".22" : ".13"} />

        {/* Mouth */}
        <path d={mouthD} stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round" />

        {/* Body sparkle dots */}
        {[
          { cx: 66, cy: 108, r: 2.8, c: colors.glow, a: 0 },
          { cx: 134, cy: 103, r: 2.4, c: colors.tint, a: .8 },
          { cx: 84, cy: 128, r: 2, c: colors.c1, a: 1.2 },
          { cx: 120, cy: 126, r: 2.3, c: colors.glow, a: .4 },
          { cx: 95, cy: 136, r: 1.8, c: t.teal, a: 2 },
          { cx: 108, cy: 80, r: 2, c: colors.glow, a: 1.6 },
        ].slice(0, Math.min(Math.ceil(level / 3) + 1, 6)).map((s, i) => (
          <circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill={s.c} opacity={(.28 + Math.sin(frame * .06 + s.a) * .28).toFixed(2)} filter={`url(#g${id})`} />
        ))}

        {/* Tail */}
        <path d={`M 148 118 Q ${160 + Math.sin(frame * .09) * 3} 111 ${162 + Math.sin(frame * .07) * 2} 101 Q 163 95 158 97`} stroke={colors.c1} strokeWidth="4" fill="none" strokeLinecap="round" />
        <circle cx={158 + Math.sin(frame * .07) * 1.5} cy={97} r={stage === "legendary" ? 5 : 3} fill={colors.glow} opacity=".55" filter={`url(#g${id})`} />
      </g>

      {/* ── Orbiting particles — TEEN+ ── */}
      {stage !== "baby" && (() => {
        const count = { teen: 2, prince: 3, legendary: 5 }[stage];
        const orbitRx = { teen: 58, prince: 68, legendary: 80 }[stage];
        const emojis = ["✨", "⭐", "💫", "🌟", "🔥"];
        const emojiSize = { teen: 10, prince: 12, legendary: 15 }[stage];
        return Array.from({ length: count }).map((_, i) => {
          const angle = (frame * .025 + i * (Math.PI * 2 / count)) % (Math.PI * 2);
          const px = 100 + Math.cos(angle) * orbitRx;
          const py = 108 + Math.sin(angle) * (orbitRx * 0.52);
          return (
            <text key={i} x={px} y={py} fontSize={emojiSize} textAnchor="middle"
              opacity={(.5 + Math.sin(frame * .05 + i) * .35).toFixed(2)}
              style={{ pointerEvents: "none" }}>
              {emojis[i % emojis.length]}
            </text>
          );
        });
      })()}
    </svg>
  );
}
