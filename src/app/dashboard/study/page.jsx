"use client";
import { useState, useEffect, useRef } from "react";
import { useTheme } from "@/components/ThemeProvider";

// ============ INTERACTIVE MOKU ============
function MokuInteractive({ size = 160, state = "idle", progress = 0 }) {
  const t = useTheme();
  const [frame, setFrame] = useState(0);
  const [blink, setBlink] = useState(false);
  const [petted, setPetted] = useState(false);
  const [hearts, setHearts] = useState([]);

  useEffect(() => {
    const f = setInterval(() => setFrame(p => (p + 1) % 120), 60);
    const b = setInterval(() => { setBlink(true); setTimeout(() => setBlink(false), 160); }, 3500 + Math.random() * 2000);
    return () => { clearInterval(f); clearInterval(b); };
  }, []);

  const handlePet = () => {
    setPetted(true);
    const id = Date.now();
    setHearts(p => [...p, { id, x: 30 + Math.random() * 40, y: 10 + Math.random() * 20 }]);
    setTimeout(() => setPetted(false), 600);
    setTimeout(() => setHearts(p => p.filter(h => h.id !== id)), 1500);
  };

  const dk = t.mode === "dark";
  const breathe = Math.sin(frame * .08) * 2.5;
  const wobble = Math.sin(frame * .05) * 1.5;
  const petSquish = petted ? 1.06 : 1;
  const eyeH = blink ? 0.5 : petted ? 10 : (state === "focus" ? 7 : state === "eating" ? 10 : state === "done" ? 9 : state === "break" ? 4 : 8);
  const mouthD = petted ? "M 86 112 Q 100 126 114 112" : state === "eating" ? "M 94 113 Q 100 108 106 113 Q 100 120 94 113" : state === "done" ? "M 86 112 Q 100 126 114 112" : state === "break" ? "M 92 114 Q 100 118 108 114" : "M 90 112 Q 100 120 110 112";
  const mouthFill = state === "eating" ? (dk ? "#2a1040" : "#1a1030") : "none";
  const mouthStroke = state === "eating" ? "none" : "#fff";
  const glowI = 12 + progress * 0.3;
  const bodyC1 = dk ? "#9b8df7" : "#8b7bf0";
  const bodyC2 = dk ? "#7c6cf7" : "#7565e0";
  const bodyC3 = dk ? "#5e40c8" : "#5840b5";
  const id = `ms${t.mode}`;
  const sizeBoost = progress * 0.04;
  const particles = state === "focus" || state === "eating";
  const sleeping = state === "break";
  const celebrating = state === "done";

  return (
    <div style={{ position: "relative", cursor: "pointer", display: "inline-block" }} onClick={handlePet}>
      {/* Floating hearts on pet */}
      {hearts.map(h => (
        <div key={h.id} style={{
          position: "absolute", left: `${h.x}%`, top: `${h.y}%`, fontSize: 20, pointerEvents: "none",
          animation: "heartFloat 1.2s ease forwards", zIndex: 10,
        }}>💜</div>
      ))}

      <svg width={size} height={size} viewBox="0 0 200 200" style={{ filter: `drop-shadow(0 0 ${glowI}px ${t.primary}${dk ? "55" : "30"})`, transition: "filter .5s, transform .2s", transform: `scale(${petSquish})` }}>
        <defs>
          <radialGradient id={`b${id}`} cx="50%" cy="36%" r="54%"><stop offset="0%" stopColor={bodyC1} /><stop offset="50%" stopColor={bodyC2} /><stop offset="100%" stopColor={bodyC3} /></radialGradient>
          <radialGradient id={`bl${id}`} cx="50%" cy="38%" r="50%"><stop offset="0%" stopColor={t.primarySoft || "#9f8df7"} opacity=".4" /><stop offset="100%" stopColor={t.primary} opacity=".05" /></radialGradient>
          <filter id={`g${id}`}><feGaussianBlur stdDeviation="2.5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>

        {particles && [0,1,2,3,4].map(i => {
          const angle = (frame * .02 + i * 1.25) % (Math.PI * 2);
          const radius = 70 + Math.sin(frame * .03 + i) * 10;
          const px = 100 + Math.cos(angle) * radius;
          const py = 100 + Math.sin(angle) * radius * 0.6;
          return <text key={i} x={px} y={py} fontSize="12" textAnchor="middle" opacity={(.3 + Math.sin(frame * .04 + i) * .3).toFixed(2)}>{"📖💡✏️🧪⚡"[i] || "✨"}</text>;
        })}

        {celebrating && [0,1,2,3,4,5].map(i => {
          const angle = (frame * .03 + i * 1.05) % (Math.PI * 2);
          const r = 75 + Math.sin(frame * .05 + i * 2) * 15;
          return <text key={i} x={100 + Math.cos(angle) * r} y={100 + Math.sin(angle) * r * 0.5} fontSize="14" textAnchor="middle" opacity={(.4 + Math.sin(frame * .06 + i) * .4).toFixed(2)}>⭐</text>;
        })}

        <g transform={`translate(${wobble},${breathe + (sleeping ? 4 : 0)})`}>
          <ellipse cx="100" cy="152" rx={42 - breathe + sizeBoost * 3} ry={10 + breathe * .4} fill={t.primary} opacity={dk ? ".06" : ".05"} />
          <ellipse cx="100" cy="108" rx={52 + breathe * .3 + sizeBoost * 3} ry={47 - breathe * .2 + sizeBoost * 2} fill={`url(#b${id})`} />
          <ellipse cx="100" cy="118" rx={28 + sizeBoost} ry={20 + sizeBoost * .5} fill={`url(#bl${id})`} />
          <ellipse cx="74" cy="68" rx="7" ry={12 + sizeBoost * .5} fill={bodyC1} opacity=".8" transform="rotate(-12 74 68)" />
          <ellipse cx="126" cy="68" rx="7" ry={12 + sizeBoost * .5} fill={bodyC1} opacity=".8" transform="rotate(12 126 68)" />
          <ellipse cx="74" cy="63" rx="4" ry="6.5" fill={t.teal} opacity=".55" transform="rotate(-12 74 63)" filter={`url(#g${id})`} />
          <ellipse cx="126" cy="63" rx="4" ry="6.5" fill={t.teal} opacity=".55" transform="rotate(12 126 63)" filter={`url(#g${id})`} />

          {sleeping ? <>
            <path d="M 78 97 Q 85 93 92 97" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M 108 97 Q 115 93 122 97" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" />
          </> : <>
            <ellipse cx="85" cy="98" rx="9" ry={eyeH} fill="#fff" style={{ transition: "ry .15s" }} />
            <ellipse cx="115" cy="98" rx="9" ry={eyeH} fill="#fff" style={{ transition: "ry .15s" }} />
            {!blink && <>
              <ellipse cx={87 + wobble * .3} cy="98" rx="4.5" ry="5" fill={dk ? "#0e0a1a" : "#1a1230"} />
              <ellipse cx={117 + wobble * .3} cy="98" rx="4.5" ry="5" fill={dk ? "#0e0a1a" : "#1a1230"} />
              <circle cx={88 + wobble * .2} cy="95.5" r="1.8" fill="#fff" />
              <circle cx={118 + wobble * .2} cy="95.5" r="1.8" fill="#fff" />
            </>}
          </>}

          <ellipse cx="72" cy="108" rx="7" ry="4.5" fill={t.pink} opacity={petted || state === "done" ? ".3" : ".12"} />
          <ellipse cx="128" cy="108" rx="7" ry="4.5" fill={t.pink} opacity={petted || state === "done" ? ".3" : ".12"} />
          <path d={mouthD} stroke={mouthStroke} strokeWidth="2.2" fill={mouthFill} strokeLinecap="round" />

          {state === "eating" && frame % 40 < 20 && (
            <text x={100 + Math.sin(frame * .15) * 3} y={106 - (frame % 20) * 0.3} fontSize="10" textAnchor="middle" opacity={1 - (frame % 20) * .05}>📚</text>
          )}

          {[{ cx: 66, cy: 108, r: 2.8, c: t.teal, a: 0 }, { cx: 134, cy: 103, r: 2.4, c: t.pink, a: .8 }, { cx: 82, cy: 130, r: 2, c: t.amber, a: 1.2 }, { cx: 120, cy: 127, r: 2.3, c: t.teal, a: .4 }].map((s, i) => (
            <circle key={i} cx={s.cx} cy={s.cy} r={s.r + sizeBoost * .2} fill={s.c} opacity={(.2 + Math.sin(frame * .06 + s.a) * (state === "focus" ? .4 : .25)).toFixed(2)} filter={`url(#g${id})`} />
          ))}

          <path d={`M 148 118 Q ${160 + Math.sin(frame * .09) * (state === "done" || petted ? 6 : 3)} 111 ${162 + Math.sin(frame * .07) * 2} 101 Q 163 95 158 97`} stroke={bodyC1} strokeWidth="4" fill="none" strokeLinecap="round" />
          <circle cx={158 + Math.sin(frame * .07) * 1.5} cy={97} r="3" fill={t.teal} opacity=".5" filter={`url(#g${id})`} />
        </g>

        {sleeping && [0,1,2].map(i => (
          <text key={i} x={135 + i * 12} y={70 - i * 14 + Math.sin(frame * .04 + i) * 3} fontSize={10 + i * 3} fill={t.primary} opacity={(.3 + Math.sin(frame * .05 + i * 1.5) * .3).toFixed(2)} fontWeight="800">z</text>
        ))}
      </svg>

      {/* Tap hint */}
      {state === "idle" && <div style={{ textAlign: "center", fontSize: 10, color: t.dim, marginTop: 4, animation: "pulse 2s infinite" }}>tap Moku to pet! 💜</div>}
    </div>
  );
}

// ============ CIRCULAR TIMER ============
function CircleTimer({ progress, timeStr, label, color, size = 220 }) {
  const t = useTheme();
  const r = (size - 16) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - progress);
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={t.bg3} strokeWidth="5" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="5" strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: "stroke-dashoffset .5s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 42, fontWeight: 900, letterSpacing: -2, fontVariantNumeric: "tabular-nums" }}>{timeStr}</div>
        <div style={{ fontSize: 13, fontWeight: 700, color, marginTop: 4 }}>{label}</div>
      </div>
    </div>
  );
}

// ============ MAIN ============
export default function StudyPage() {
  const t = useTheme();
  const [duration, setDuration] = useState(25 * 60);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState("idle");
  const [breakTime] = useState(5 * 60);
  const intervalRef = useRef(null);
  const [xp, setXp] = useState(0);
  const [sessionsToday, setSessionsToday] = useState(0);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [feedCount, setFeedCount] = useState(0);
  const [mokuState, setMokuState] = useState("idle");
  const [speech, setSpeech] = useState("Siap belajar? Pilih durasi dan mulai! 🎯");
  const speechTimeout = useRef(null);

  const say = (msg, ms = 4000) => { setSpeech(msg); if (speechTimeout.current) clearTimeout(speechTimeout.current); speechTimeout.current = setTimeout(() => setSpeech(""), ms); };

  useEffect(() => {
    if (running && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            if (phase === "focus") {
              setPhase("done"); setMokuState("done");
              const earned = Math.round(duration / 60) * 2;
              setXp(p => p + earned); setSessionsToday(p => p + 1); setTotalMinutes(p => p + Math.round(duration / 60)); setFeedCount(p => p + 1);
              say(`Yeay! 🎉 Sesi selesai! +${earned} XP`, 6000); setRunning(false);
            } else if (phase === "break") {
              setPhase("idle"); setMokuState("idle"); say("Break selesai! Mau lanjut? 💪"); setRunning(false);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, phase, duration, timeLeft]);

  useEffect(() => {
    if (phase !== "focus" || !running) return;
    const eatInterval = setInterval(() => { setMokuState("eating"); setTimeout(() => { if (running) setMokuState("focus"); }, 1500); }, 8000);
    return () => clearInterval(eatInterval);
  }, [phase, running]);

  // Random Moku speech during focus
  useEffect(() => {
    if (phase !== "focus" || !running) return;
    const msgs = ["Kamu keren! Tetap fokus~ 🔥", "Moku bangga! 💜", "Ilmu masuk... nyam! 📖", "Jangan nyerah ya! 💪", "Almost there... ✨"];
    const chatInterval = setInterval(() => { say(msgs[Math.floor(Math.random() * msgs.length)], 3000); }, 20000);
    return () => clearInterval(chatInterval);
  }, [phase, running]);

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
  const progress = phase === "idle" ? 0 : phase === "done" ? 1 : 1 - (timeLeft / (phase === "break" ? breakTime : duration));
  const startFocus = (mins) => { setDuration(mins * 60); setTimeLeft(mins * 60); setPhase("focus"); setMokuState("focus"); setRunning(true); say(`Oke, ${mins} menit! Moku siap nemenin 📖`, 3000); };
  const startBreak = () => { setTimeLeft(breakTime); setPhase("break"); setMokuState("break"); setRunning(true); say("Istirahat~ Moku tidur dulu 😴", 3000); };
  const timerColor = phase === "focus" ? t.primary : phase === "break" ? t.teal : phase === "done" ? t.green : t.dim;
  const phaseLabel = phase === "focus" ? "Fokus..." : phase === "break" ? "Istirahat" : phase === "done" ? "Selesai! 🎉" : "Siap belajar";

  return (
    <div style={{ padding: "24px 16px", maxWidth: 560, margin: "0 auto" }}>
      <style>{`
        @keyframes heartFloat { 0% { opacity:1; transform:translateY(0) scale(1); } 100% { opacity:0; transform:translateY(-60px) scale(1.3); } }
        @keyframes bounceIn { 0% { transform:scale(.8); opacity:0; } 50% { transform:scale(1.05); } 100% { transform:scale(1); opacity:1; } }
        @keyframes pulse { 0%,100% { opacity:.5; } 50% { opacity:1; } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      {/* Stats */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, justifyContent: "center" }}>
        {[{ icon: "⚡", val: xp, label: "XP", color: t.amber }, { icon: "🔥", val: sessionsToday, label: "Sesi", color: t.pink }, { icon: "⏱️", val: `${totalMinutes}m`, label: "Total", color: t.teal }, { icon: "🍕", val: feedCount, label: "Fed", color: t.green }].map((s, i) => (
          <div key={i} style={{ background: t.card, border: `1.5px solid ${t.border}`, borderRadius: 14, padding: "8px 14px", textAlign: "center", boxShadow: t.shadow, flex: 1 }}>
            <div style={{ fontSize: 14 }}>{s.icon}</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 9, color: t.dim, fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Main card */}
      <div style={{ background: t.card, border: `1.5px solid ${t.border}`, borderRadius: 24, padding: "28px 20px", boxShadow: t.shadow, textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 150, height: 150, borderRadius: "50%", background: `radial-gradient(circle, ${timerColor}08 0%, transparent 70%)`, pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -30, left: -30, width: 120, height: 120, borderRadius: "50%", background: `radial-gradient(circle, ${t.teal}06 0%, transparent 70%)`, pointerEvents: "none" }} />

        {/* Timer */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
          <CircleTimer progress={progress} timeStr={formatTime(timeLeft)} label={phaseLabel} color={timerColor} size={220} />
        </div>

        {/* Moku — below timer, interactive */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 16 }}>
          {/* Speech bubble */}
          {speech && (
            <div style={{ background: t.bg2, border: `1.5px solid ${t.border}`, borderRadius: 16, padding: "8px 16px", marginBottom: 8, fontSize: 13, color: t.sub, fontWeight: 600, position: "relative", animation: "fadeIn .3s ease", maxWidth: 280 }}>
              {speech}
              <div style={{ position: "absolute", bottom: -6, left: "50%", transform: "translateX(-50%) rotate(45deg)", width: 10, height: 10, background: t.bg2, borderRight: `1.5px solid ${t.border}`, borderBottom: `1.5px solid ${t.border}` }} />
            </div>
          )}
          <MokuInteractive size={140} state={mokuState} progress={progress * 100} />
        </div>

        {/* Level bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center", marginBottom: 20 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: t.amber }}>Lv.{Math.floor(feedCount / 3) + 1}</span>
          <div style={{ width: 100, height: 5, background: t.bg3, borderRadius: 3, overflow: "hidden" }}>
            <div style={{ width: `${((feedCount % 3) / 3) * 100}%`, height: "100%", background: `linear-gradient(90deg, ${t.primary}, ${t.teal})`, borderRadius: 3, transition: "width .5s cubic-bezier(.34,1.56,.64,1)" }} />
          </div>
          <span style={{ fontSize: 9, color: t.dim }}>{feedCount % 3}/3</span>
        </div>

        {/* Controls */}
        {phase === "idle" && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: t.sub, marginBottom: 10 }}>Pilih durasi:</div>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
              {[15, 25, 30, 45, 60].map(m => (
                <button key={m} onClick={() => startFocus(m)} style={{
                  padding: "10px 18px", borderRadius: 12, border: `2px solid ${t.border}`, background: t.bg2, color: t.text, fontSize: 15, fontWeight: 800, cursor: "pointer", transition: "all .15s", minWidth: 64,
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = t.primary; e.currentTarget.style.color = t.primary; e.currentTarget.style.background = t.primaryBg; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.color = t.text; e.currentTarget.style.background = t.bg2; }}
                >{m}<span style={{ fontSize: 10, fontWeight: 600, color: t.dim, marginLeft: 2 }}>m</span></button>
              ))}
            </div>
          </div>
        )}

        {(phase === "focus" || phase === "break") && (
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            {running ? (
              <button onClick={() => { setRunning(false); say("Pause ⏸️"); }} style={{ padding: "10px 28px", borderRadius: 12, border: "none", background: t.amber, color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>⏸️ Pause</button>
            ) : (
              <button onClick={() => { setRunning(true); say("Lanjut! 🔥"); }} style={{ padding: "10px 28px", borderRadius: 12, border: "none", background: t.green, color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>▶️ Lanjut</button>
            )}
            <button onClick={() => { setRunning(false); setPhase("idle"); setMokuState("idle"); setTimeLeft(duration); say("Reset! 🎯"); }} style={{ padding: "10px 20px", borderRadius: 12, border: `2px solid ${t.border}`, background: "transparent", color: t.sub, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>✕ Reset</button>
          </div>
        )}

        {phase === "done" && (
          <div style={{ animation: "bounceIn .5s ease" }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: t.green, marginBottom: 12 }}>🎉 +{Math.round(duration / 60) * 2} XP</div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={startBreak} style={{ padding: "10px 24px", borderRadius: 12, border: "none", background: t.teal, color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>☕ Break 5m</button>
              <button onClick={() => startFocus(Math.round(duration / 60))} style={{ padding: "10px 24px", borderRadius: 12, border: "none", background: t.primary, color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>🔄 Lagi!</button>
              <button onClick={() => { setRunning(false); setPhase("idle"); setMokuState("idle"); setTimeLeft(duration); }} style={{ padding: "10px 20px", borderRadius: 12, border: `2px solid ${t.border}`, background: "transparent", color: t.sub, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Selesai</button>
            </div>
          </div>
        )}
      </div>

      {/* Tips */}
      <div style={{ background: t.card, border: `1.5px solid ${t.border}`, borderRadius: 16, padding: "14px 18px", marginTop: 16, boxShadow: t.shadow }}>
        <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 6 }}>💡 Tips</div>
        <div style={{ fontSize: 11, color: t.sub, lineHeight: 1.7 }}>
          {phase === "idle" && "Mulai dengan 25 menit (Pomodoro klasik). Moku akan menemani dan makan ilmu selama kamu fokus!"}
          {phase === "focus" && "Tetap fokus! Moku sedang makan ilmu kamu. Klik Moku untuk pet dia 💜"}
          {phase === "break" && "Istirahat! Peregangan, minum air. Moku juga lagi tidur 😴"}
          {phase === "done" && "Sesi selesai! Ambil break atau lanjut. Consistency is key!"}
        </div>
      </div>
    </div>
  );
}