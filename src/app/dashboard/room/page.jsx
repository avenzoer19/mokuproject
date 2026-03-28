"use client";
import { useState, useEffect } from "react";
import { useTheme } from "@/components/ThemeProvider";

// ============ ROOM DATA ============
const WALLPAPERS = [
  { id: "default", name: "Basic Room", cost: 0, wall: "#f5efe5", floor: "#c8b898", owned: true },
  { id: "night", name: "Night Sky", cost: 50, wall: "#12122e", floor: "#2a2a5e", stars: true },
  { id: "forest", name: "Forest", cost: 80, wall: "#1e4a2e", floor: "#4a7a5a" },
  { id: "ocean", name: "Ocean", cost: 80, wall: "#0e3a5e", floor: "#3a7a9e" },
  { id: "sakura", name: "Sakura", cost: 120, wall: "#f8e0e8", floor: "#e0b8c0" },
  { id: "space", name: "Deep Space", cost: 200, wall: "#060618", floor: "#1a1a3a", stars: true },
];
const FURNITURE = [
  { id: "desk", name: "Study Desk", emoji: "🪑", cost: 0, owned: true, x: 55, y: 68 },
  { id: "lamp", name: "Desk Lamp", emoji: "💡", cost: 20, x: 62, y: 55 },
  { id: "books", name: "Bookshelf", emoji: "📚", cost: 30, x: 15, y: 45 },
  { id: "plant", name: "Indoor Plant", emoji: "🪴", cost: 25, x: 85, y: 65 },
  { id: "poster", name: "Science Poster", emoji: "🧬", cost: 40, x: 30, y: 25 },
  { id: "globe", name: "Globe", emoji: "🌍", cost: 50, x: 80, y: 45 },
  { id: "telescope", name: "Telescope", emoji: "🔭", cost: 80, x: 10, y: 55 },
  { id: "computer", name: "Computer", emoji: "💻", cost: 60, x: 50, y: 58 },
  { id: "cat", name: "Study Cat", emoji: "🐱", cost: 100, x: 70, y: 75 },
  { id: "coffee", name: "Coffee Machine", emoji: "☕", cost: 45, x: 90, y: 55 },
  { id: "medal", name: "Trophy", emoji: "🏆", cost: 150, x: 40, y: 30 },
  { id: "aquarium", name: "Mini Aquarium", emoji: "🐠", cost: 120, x: 20, y: 60 },
];
const ACCESSORIES = [
  { id: "none", name: "None", emoji: "—", cost: 0, owned: true },
  { id: "glasses", name: "Smart Glasses", emoji: "🤓", cost: 30 },
  { id: "hat", name: "Graduation Cap", emoji: "🎓", cost: 50 },
  { id: "scarf", name: "Cozy Scarf", emoji: "🧣", cost: 25 },
  { id: "crown", name: "Study King", emoji: "👑", cost: 200 },
  { id: "headphones", name: "Headphones", emoji: "🎧", cost: 40 },
];

// ============ MOKU IN ROOM ============
function MokuRoom({ size = 110, accessory = "none" }) {
  const [frame, setFrame] = useState(0);
  const [blink, setBlink] = useState(false);
  useEffect(() => {
    const f = setInterval(() => setFrame(p => (p + 1) % 80), 70);
    const b = setInterval(() => { setBlink(true); setTimeout(() => setBlink(false), 150); }, 3500 + Math.random() * 2000);
    return () => { clearInterval(f); clearInterval(b); };
  }, []);
  const breathe = Math.sin(frame * .1) * 2;
  const wobble = Math.sin(frame * .06) * 1;
  const eyeH = blink ? .5 : 8;
  const id = `mr${size}`;
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" style={{ filter: "drop-shadow(0 4px 12px rgba(108,92,231,.25))" }}>
      <defs>
        <radialGradient id={`b${id}`} cx="50%" cy="36%" r="54%"><stop offset="0%" stopColor="#9b8df7" /><stop offset="50%" stopColor="#7c6cf7" /><stop offset="100%" stopColor="#5e40c8" /></radialGradient>
        <filter id={`g${id}`}><feGaussianBlur stdDeviation="2.5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <g transform={`translate(${wobble},${breathe})`}>
        <ellipse cx="100" cy="150" rx="38" ry="8" fill="#7c6cf7" opacity=".08" />
        <ellipse cx="100" cy="108" rx={50 + breathe * .3} ry={45 - breathe * .2} fill={`url(#b${id})`} />
        <ellipse cx="100" cy="118" rx="26" ry="18" fill="#9f8df7" opacity=".2" />
        <ellipse cx="74" cy="70" rx="6.5" ry="11" fill="#9b8df7" opacity=".8" transform="rotate(-12 74 70)" />
        <ellipse cx="126" cy="70" rx="6.5" ry="11" fill="#9b8df7" opacity=".8" transform="rotate(12 126 70)" />
        <ellipse cx="74" cy="65" rx="4" ry="6" fill="#2dd4bf" opacity=".5" transform="rotate(-12 74 65)" filter={`url(#g${id})`} />
        <ellipse cx="126" cy="65" rx="4" ry="6" fill="#2dd4bf" opacity=".5" transform="rotate(12 126 65)" filter={`url(#g${id})`} />
        <ellipse cx="85" cy="98" rx="8.5" ry={eyeH} fill="#fff" style={{ transition: "ry .12s" }} />
        <ellipse cx="115" cy="98" rx="8.5" ry={eyeH} fill="#fff" style={{ transition: "ry .12s" }} />
        {!blink && <>
          <ellipse cx="87" cy="98" rx="4" ry="4.5" fill="#1a1230" />
          <ellipse cx="117" cy="98" rx="4" ry="4.5" fill="#1a1230" />
          <circle cx="88" cy="95.5" r="1.6" fill="#fff" />
          <circle cx="118" cy="95.5" r="1.6" fill="#fff" />
        </>}
        <ellipse cx="72" cy="108" rx="6" ry="4" fill="#f25d9c" opacity=".12" />
        <ellipse cx="128" cy="108" rx="6" ry="4" fill="#f25d9c" opacity=".12" />
        <path d="M 90 112 Q 100 120 110 112" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" />
        {[{ cx: 66, cy: 108, c: "#2dd4bf" }, { cx: 134, cy: 103, c: "#fb7fbe" }, { cx: 84, cy: 128, c: "#fbbf24" }].map((s, i) => (
          <circle key={i} cx={s.cx} cy={s.cy} r="2.2" fill={s.c} opacity={(.25 + Math.sin(frame * .06 + i) * .25).toFixed(2)} filter={`url(#g${id})`} />
        ))}
        <path d={`M 146 118 Q ${158 + Math.sin(frame * .08) * 3} 112 160 102`} stroke="#9b8df7" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        {accessory === "glasses" && <text x="100" y="92" fontSize="18" textAnchor="middle">🤓</text>}
        {accessory === "hat" && <text x="100" y="60" fontSize="22" textAnchor="middle">🎓</text>}
        {accessory === "crown" && <text x="100" y="58" fontSize="20" textAnchor="middle">👑</text>}
        {accessory === "headphones" && <text x="100" y="80" fontSize="18" textAnchor="middle">🎧</text>}
        {accessory === "scarf" && <text x="100" y="128" fontSize="16" textAnchor="middle">🧣</text>}
      </g>
    </svg>
  );
}

// ============ STARS ============
function Stars() {
  return <>{Array.from({ length: 20 }).map((_, i) => (
    <div key={i} style={{
      position: "absolute", width: 2 + Math.random() * 2, height: 2 + Math.random() * 2,
      borderRadius: "50%", background: "#fff",
      left: `${5 + Math.random() * 90}%`, top: `${5 + Math.random() * 40}%`,
      opacity: .3 + Math.random() * .5,
      animation: `twinkle ${2 + Math.random() * 3}s ease-in-out infinite ${Math.random() * 2}s`,
    }} />
  ))}</>;
}

// ============ MAIN ============
export default function RoomPage() {
  const t = useTheme();
  const [xp, setXp] = useState(350);
  const [wallpaper, setWallpaper] = useState(WALLPAPERS[0]);
  const [ownedWalls, setOwnedWalls] = useState(["default"]);
  const [placedFurniture, setPlacedFurniture] = useState(["desk"]);
  const [ownedFurniture, setOwnedFurniture] = useState(["desk"]);
  const [accessory, setAccessory] = useState("none");
  const [ownedAcc, setOwnedAcc] = useState(["none"]);
  const [shopTab, setShopTab] = useState("wallpaper");
  const [showShop, setShowShop] = useState(false);
  const [toast, setToast] = useState("");

  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const buyWall = (w) => {
    if (ownedWalls.includes(w.id)) { setWallpaper(w); notify(`Applied: ${w.name}!`); return; }
    if (xp < w.cost) { notify("XP tidak cukup! 😢"); return; }
    setXp(p => p - w.cost); setOwnedWalls(p => [...p, w.id]); setWallpaper(w); notify(`Bought & applied: ${w.name}! ✨`);
  };
  const buyFurn = (f) => {
    if (ownedFurniture.includes(f.id)) {
      if (placedFurniture.includes(f.id)) { setPlacedFurniture(p => p.filter(x => x !== f.id)); notify(`Removed: ${f.name}`); }
      else { setPlacedFurniture(p => [...p, f.id]); notify(`Placed: ${f.name}!`); }
      return;
    }
    if (xp < f.cost) { notify("XP tidak cukup! 😢"); return; }
    setXp(p => p - f.cost); setOwnedFurniture(p => [...p, f.id]); setPlacedFurniture(p => [...p, f.id]); notify(`Bought: ${f.name}! ✨`);
  };
  const buyAcc = (a) => {
    if (ownedAcc.includes(a.id)) { setAccessory(a.id); notify(`Equipped: ${a.name}!`); return; }
    if (xp < a.cost) { notify("XP tidak cukup! 😢"); return; }
    setXp(p => p - a.cost); setOwnedAcc(p => [...p, a.id]); setAccessory(a.id); notify(`Bought: ${a.name}! ✨`);
  };

  return (
    <div style={{ padding: "20px 16px" }}>
      <style>{`@keyframes twinkle{0%,100%{opacity:.3}50%{opacity:.8}}@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@keyframes bounceIn{0%{transform:scale(.9);opacity:0}60%{transform:scale(1.03)}100%{transform:scale(1);opacity:1}}`}</style>

      {/* Toast */}
      {toast && <div style={{ position: "fixed", top: 70, left: "50%", transform: "translateX(-50%)", background: t.card, border: `2px solid ${t.green}30`, borderRadius: 14, padding: "10px 20px", fontSize: 13, fontWeight: 700, color: t.green, boxShadow: t.shadow, zIndex: 100, animation: "bounceIn .3s ease" }}>{toast}</div>}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>🏡 Moku&apos;s Room</h1>
          <p style={{ fontSize: 11, color: t.dim, margin: 0 }}>Dekorasi ruangan Moku-mu</p>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <div style={{ padding: "5px 12px", borderRadius: 10, background: t.amberBg, border: `1px solid ${t.amber}25`, fontSize: 12, fontWeight: 800, color: t.amber }}>⚡ {xp} XP</div>
          <button onClick={() => setShowShop(!showShop)} style={{ padding: "6px 14px", borderRadius: 10, border: `1.5px solid ${t.primary}30`, background: t.primaryBg, color: t.primary, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>{showShop ? "✕ Close" : "🛒 Shop"}</button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {/* Room view */}
        <div style={{ flex: "1 1 480px" }}>
          <div style={{ position: "relative", borderRadius: 24, overflow: "hidden", height: 380, boxShadow: t.shadow, border: `2px solid ${t.border}` }}>
            <div style={{ position: "absolute", inset: 0, bottom: "35%", background: wallpaper.wall, transition: "background .5s" }} />
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "35%", background: wallpaper.floor, transition: "background .5s" }} />
            <div style={{ position: "absolute", left: 0, right: 0, top: "65%", height: 2, background: "rgba(0,0,0,.1)" }} />
            {wallpaper.stars && <Stars />}
            <div style={{ position: "absolute", top: "10%", left: "40%", width: 80, height: 60, borderRadius: 8, border: "3px solid rgba(255,255,255,.2)", background: "rgba(135,206,250,.15)" }}>
              <div style={{ position: "absolute", top: 0, bottom: 0, left: "50%", width: 2, background: "rgba(255,255,255,.15)" }} />
              <div style={{ position: "absolute", left: 0, right: 0, top: "50%", height: 2, background: "rgba(255,255,255,.15)" }} />
            </div>
            {FURNITURE.filter(f => placedFurniture.includes(f.id)).map(f => (
              <div key={f.id} style={{ position: "absolute", left: `${f.x}%`, top: `${f.y}%`, transform: "translate(-50%, -50%)", fontSize: 32, cursor: "pointer", transition: "transform .2s", filter: "drop-shadow(0 2px 4px rgba(0,0,0,.2))" }}
                onMouseEnter={e => e.currentTarget.style.transform = "translate(-50%, -50%) scale(1.2)"}
                onMouseLeave={e => e.currentTarget.style.transform = "translate(-50%, -50%) scale(1)"}
                title={f.name}>{f.emoji}</div>
            ))}
            <div style={{ position: "absolute", left: "38%", top: "42%", transform: "translate(-50%, -50%)" }}>
              <MokuRoom size={110} accessory={accessory} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <div style={{ padding: "6px 14px", borderRadius: 10, background: t.bg2, border: `1px solid ${t.border}`, fontSize: 11, fontWeight: 700, color: t.sub }}>🎨 {wallpaper.name}</div>
            <div style={{ padding: "6px 14px", borderRadius: 10, background: t.bg2, border: `1px solid ${t.border}`, fontSize: 11, fontWeight: 700, color: t.sub }}>🪑 {placedFurniture.length} items</div>
            <div style={{ padding: "6px 14px", borderRadius: 10, background: t.bg2, border: `1px solid ${t.border}`, fontSize: 11, fontWeight: 700, color: t.sub }}>{ACCESSORIES.find(a => a.id === accessory)?.emoji} {ACCESSORIES.find(a => a.id === accessory)?.name}</div>
          </div>
        </div>

        {/* Shop */}
        {showShop && (
          <div style={{ flex: "0 1 320px", animation: "fadeIn .3s ease" }}>
            <div style={{ background: t.card, border: `1.5px solid ${t.border}`, borderRadius: 20, padding: 16, boxShadow: t.shadow }}>
              <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 12 }}>🛒 Moku Shop</div>
              <div style={{ display: "flex", gap: 4, background: t.bg2, borderRadius: 10, padding: 3, marginBottom: 14 }}>
                {[{ id: "wallpaper", label: "🎨 Walls" }, { id: "furniture", label: "🪑 Items" }, { id: "accessory", label: "🎭 Outfit" }].map(tb => (
                  <button key={tb.id} onClick={() => setShopTab(tb.id)} style={{ flex: 1, padding: "7px 8px", borderRadius: 8, border: "none", background: shopTab === tb.id ? t.card : "transparent", color: shopTab === tb.id ? t.primary : t.sub, fontSize: 11, fontWeight: shopTab === tb.id ? 800 : 600, cursor: "pointer", boxShadow: shopTab === tb.id ? t.shadow : "none" }}>{tb.label}</button>
                ))}
              </div>
              <div style={{ maxHeight: 300, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
                {shopTab === "wallpaper" && WALLPAPERS.map(w => {
                  const owned = ownedWalls.includes(w.id); const active = wallpaper.id === w.id;
                  return (
                    <button key={w.id} onClick={() => buyWall(w)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, border: `1.5px solid ${active ? t.primary + "40" : t.border}`, background: active ? t.primaryBg : t.bg2, cursor: "pointer", textAlign: "left", transition: "all .15s", width: "100%" }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: w.wall, border: `2px solid ${w.floor}`, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 700, color: active ? t.primary : t.text }}>{w.name}</div><div style={{ fontSize: 10, color: t.dim }}>{owned ? (active ? "✓ Active" : "Owned") : `⚡ ${w.cost} XP`}</div></div>
                    </button>
                  );
                })}
                {shopTab === "furniture" && FURNITURE.map(f => {
                  const owned = ownedFurniture.includes(f.id); const placed = placedFurniture.includes(f.id);
                  return (
                    <button key={f.id} onClick={() => buyFurn(f)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, border: `1.5px solid ${placed ? t.green + "40" : t.border}`, background: placed ? t.greenBg : t.bg2, cursor: "pointer", textAlign: "left", transition: "all .15s", width: "100%" }}>
                      <div style={{ fontSize: 22, width: 36, textAlign: "center", flexShrink: 0 }}>{f.emoji}</div>
                      <div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 700, color: placed ? t.green : t.text }}>{f.name}</div><div style={{ fontSize: 10, color: t.dim }}>{owned ? (placed ? "✓ Placed — tap to remove" : "Owned — tap to place") : `⚡ ${f.cost} XP`}</div></div>
                    </button>
                  );
                })}
                {shopTab === "accessory" && ACCESSORIES.map(a => {
                  const owned = ownedAcc.includes(a.id); const active = accessory === a.id;
                  return (
                    <button key={a.id} onClick={() => buyAcc(a)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, border: `1.5px solid ${active ? t.primary + "40" : t.border}`, background: active ? t.primaryBg : t.bg2, cursor: "pointer", textAlign: "left", transition: "all .15s", width: "100%" }}>
                      <div style={{ fontSize: 22, width: 36, textAlign: "center", flexShrink: 0 }}>{a.emoji}</div>
                      <div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 700, color: active ? t.primary : t.text }}>{a.name}</div><div style={{ fontSize: 10, color: t.dim }}>{owned ? (active ? "✓ Equipped" : "Owned") : `⚡ ${a.cost} XP`}</div></div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}