"use client";
import { useState, useEffect } from "react";
import { useTheme } from "./ThemeProvider";

export default function MokuCreature({ size = 200, glow = true, expression = "happy", level = 1 }) {
  const t = useTheme();
  const [blink, setBlink] = useState(false);
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const b = setInterval(() => { setBlink(true); setTimeout(() => setBlink(false), 160); }, 3000 + Math.random() * 2400);
    const f = setInterval(() => setFrame(p => (p + 1) % 120), 60);
    return () => { clearInterval(b); clearInterval(f); };
  }, []);

  const breathe = Math.sin(frame * .08) * 2.5;
  const wobble = Math.sin(frame * .05) * 1.5;
  const eyeH = blink ? 0.5 : (expression === "excited" ? 9.5 : expression === "sleepy" ? 4 : 8);
  const dk = t.mode === "dark";
  const bodyC1 = dk ? "#9b8df7" : "#8b7bf0";
  const bodyC2 = dk ? "#7c6cf7" : "#7565e0";
  const bodyC3 = dk ? "#5e40c8" : "#5840b5";
  const glowF = glow ? `drop-shadow(0 0 ${dk ? 24 : 16}px ${t.primary}${dk ? "55" : "30"})` : "none";
  const id = `m${size}${t.mode}${Math.random().toString(36).slice(2,5)}`;

  const spotCount = Math.min(Math.max(level, 1), 6);
  const mouthD = expression === "excited" ? "M 88 112 Q 100 124 112 112" : expression === "sleepy" ? "M 92 114 Q 100 118 108 114" : "M 90 111 Q 100 120 110 111";

  return (
    <svg width={size} height={size} viewBox="0 0 200 200" style={{ filter: glowF, transition: "filter .4s" }}>
      <defs>
        <radialGradient id={`b${id}`} cx="50%" cy="36%" r="54%"><stop offset="0%" stopColor={bodyC1} /><stop offset="50%" stopColor={bodyC2} /><stop offset="100%" stopColor={bodyC3} /></radialGradient>
        <radialGradient id={`bl${id}`} cx="50%" cy="38%" r="50%"><stop offset="0%" stopColor={t.primarySoft} opacity=".4" /><stop offset="100%" stopColor={t.primary} opacity=".05" /></radialGradient>
        <filter id={`g${id}`}><feGaussianBlur stdDeviation="2.8" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <g transform={`translate(${wobble},${breathe})`} style={{ transition: "transform .6s cubic-bezier(.34,1.56,.64,1)" }}>
        <ellipse cx="100" cy="152" rx={42 - breathe} ry={10 + breathe * .5} fill={t.primary} opacity={dk ? ".08" : ".06"} />
        <ellipse cx="100" cy="108" rx={52 + breathe * .3} ry={47 - breathe * .2} fill={`url(#b${id})`} />
        <ellipse cx="100" cy="118" rx="28" ry="20" fill={`url(#bl${id})`} />
        <ellipse cx="74" cy="68" rx="7" ry="12" fill={bodyC1} opacity=".8" transform="rotate(-12 74 68)" />
        <ellipse cx="126" cy="68" rx="7" ry="12" fill={bodyC1} opacity=".8" transform="rotate(12 126 68)" />
        <ellipse cx="74" cy="63" rx="4" ry="6.5" fill={t.teal} opacity=".55" transform="rotate(-12 74 63)" filter={`url(#g${id})`} />
        <ellipse cx="126" cy="63" rx="4" ry="6.5" fill={t.teal} opacity=".55" transform="rotate(12 126 63)" filter={`url(#g${id})`} />
        {expression === "sleepy" ? <>
          <path d="M 78 97 Q 85 93 92 97" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M 108 97 Q 115 93 122 97" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" />
        </> : <>
          <ellipse cx="85" cy="98" rx="9" ry={eyeH} fill="#fff" style={{ transition: "ry .12s" }} />
          <ellipse cx="115" cy="98" rx="9" ry={eyeH} fill="#fff" style={{ transition: "ry .12s" }} />
          {!blink && <>
            <ellipse cx={87 + wobble * .3} cy="98" rx="4.5" ry="5" fill={dk ? "#0e0a1a" : "#1a1230"} />
            <ellipse cx={117 + wobble * .3} cy="98" rx="4.5" ry="5" fill={dk ? "#0e0a1a" : "#1a1230"} />
            <circle cx={88 + wobble * .2} cy="95.5" r="1.8" fill="#fff" />
            <circle cx={118 + wobble * .2} cy="95.5" r="1.8" fill="#fff" />
          </>}
        </>}
        <ellipse cx="72" cy="108" rx="7" ry="4.5" fill={t.pink} opacity={expression === "excited" ? ".2" : ".12"} />
        <ellipse cx="128" cy="108" rx="7" ry="4.5" fill={t.pink} opacity={expression === "excited" ? ".2" : ".12"} />
        <path d={mouthD} stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        {[
          { cx: 66, cy: 108, r: 2.8, c: t.teal, a: 0 },
          { cx: 134, cy: 103, r: 2.4, c: t.pink, a: .8 },
          { cx: 84, cy: 128, r: 2, c: t.amber, a: 1.2 },
          { cx: 120, cy: 126, r: 2.3, c: t.teal, a: .4 },
          { cx: 95, cy: 136, r: 1.8, c: t.green, a: 2 },
          { cx: 108, cy: 80, r: 2, c: t.primarySoft, a: 1.6 },
        ].slice(0, spotCount).map((s, i) => (
          <circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill={s.c} opacity={(.3 + Math.sin(frame * .06 + s.a) * .3).toFixed(2)} filter={`url(#g${id})`} />
        ))}
        <path d={`M 148 118 Q ${160 + Math.sin(frame * .09) * 3} 111 ${162 + Math.sin(frame * .07) * 2} 101 Q 163 95 158 97`} stroke={bodyC1} strokeWidth="4" fill="none" strokeLinecap="round" />
        <circle cx={158 + Math.sin(frame * .07) * 1.5} cy={97} r="3" fill={t.teal} opacity=".5" filter={`url(#g${id})`} />
      </g>
    </svg>
  );
}
