"use client";
import { useState } from "react";
import { useTheme, useThemeToggle } from "@/components/ThemeProvider";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";

const TIERS = [
  { id:"free", name:"Free", price:0, priceStr:"Gratis", period:"", emoji:"🌱", color:"teal", desc:"Coba semua fitur Moku",
    limits:{ laprak:3, revisi:1, chat:25, quiz:3 },
    features:[ {text:"3 laprak / bulan",icon:"📄"}, {text:"1 revisi / laprak",icon:"🔄"}, {text:"25 chat / hari",icon:"💬"}, {text:"3 quiz / hari",icon:"📝"}, {text:"Study Session & Timer",icon:"🧘",free:true}, {text:"Moku Room & Planner",icon:"🏡",free:true}, {text:"Weekly Report",icon:"📊",free:true} ] },
  { id:"plus", name:"Plus", price:24900, priceStr:"24.900", period:"/bulan", emoji:"⚡", color:"primary", desc:"Belajar lebih serius", popular:true,
    limits:{ laprak:10, revisi:5, chat:50, quiz:-1 },
    features:[ {text:"10 laprak / bulan",icon:"📄"}, {text:"5 revisi / laprak",icon:"🔄"}, {text:"50 chat / hari",icon:"💬"}, {text:"Unlimited quiz",icon:"📝",highlight:true}, {text:"Semua fitur gratis",icon:"✨",free:true} ] },
  { id:"pro", name:"Pro", price:49900, priceStr:"49.900", period:"/bulan", emoji:"🔥", color:"amber", desc:"Unlimited — tanpa batas",
    limits:{ laprak:-1, revisi:-1, chat:-1, quiz:-1 }, note:"Fair use policy berlaku",
    features:[ {text:"Unlimited laprak",icon:"📄",highlight:true}, {text:"Unlimited revisi",icon:"🔄",highlight:true}, {text:"Unlimited chat",icon:"💬",highlight:true}, {text:"Unlimited quiz",icon:"📝",highlight:true}, {text:"Priority response",icon:"⚡",highlight:true}, {text:"Early access fitur baru",icon:"🚀",highlight:true}, {text:"Semua fitur gratis",icon:"✨",free:true} ] },
];

const ROWS = [
  { label:"Laprak / bulan", icon:"📄", vals:["3","10","Unlimited"] },
  { label:"Revisi / laprak", icon:"🔄", vals:["1","5","Unlimited"] },
  { label:"Chat / hari", icon:"💬", vals:["25","50","Unlimited"] },
  { label:"Quiz / hari", icon:"📝", vals:["3","Unlimited","Unlimited"] },
  { label:"Study Session", icon:"🧘", vals:["✅","✅","✅"] },
  { label:"Moku Room", icon:"🏡", vals:["✅","✅","✅"] },
  { label:"Planner", icon:"🗓️", vals:["✅","✅","✅"] },
  { label:"Weekly Report", icon:"📊", vals:["✅","✅","✅"] },
  { label:"Priority response", icon:"⚡", vals:["—","—","✅"] },
  { label:"Early access", icon:"🚀", vals:["—","—","✅"] },
];

export default function PricingPage() {
  const t = useTheme();
  const toggle = useThemeToggle();
  const { user } = useAuth();
  const router = useRouter();

  return (
    <div style={{ minHeight:"100vh", background:t.bg, color:t.text, transition:"background .3s" }}>
      <div style={{ padding:"14px 24px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <a href="/" style={{ display:"flex", alignItems:"center", gap:8, textDecoration:"none" }}>
            <div style={{ width:30, height:30, borderRadius:8, background:"linear-gradient(135deg,#7c5ce7,#00bfa6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:900, color:"#fff" }}>M</div>
            <span style={{ fontSize:15, fontWeight:800, color:t.text }}>moku</span>
          </a>
          {user && (
            <button onClick={() => router.push("/dashboard")} style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 14px", borderRadius:10, border:`1.5px solid ${t.border}`, background:t.bg2, color:t.sub, fontSize:12, fontWeight:700, cursor:"pointer" }}>← Dashboard</button>
          )}
        </div>
        <button onClick={toggle} style={{ width:32, height:32, borderRadius:8, border:`1.5px solid ${t.border}`, background:t.bg2, cursor:"pointer", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center" }}>{t.mode==="dark"?"🌙":"☀️"}</button>
      </div>

      <div style={{ maxWidth:880, margin:"0 auto", padding:"40px 16px 80px" }}>
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <h1 style={{ fontSize:28, fontWeight:900, letterSpacing:-.5, marginBottom:6 }}>Pilih paket yang cocok</h1>
          <p style={{ fontSize:14, color:t.sub }}>Semua fitur unlocked. Yang beda cuma limitnya.</p>
        </div>

        {/* Comparison table */}
        <div style={{ background:t.card, border:`1.5px solid ${t.border}`, borderRadius:22, overflow:"hidden", boxShadow:t.shadow, marginBottom:20 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1.2fr 1fr 1fr 1fr", borderBottom:`1.5px solid ${t.border}` }}>
            <div style={{ padding:"18px 16px" }} />
            {TIERS.map(tier => {
              const c = t[tier.color];
              return (
                <div key={tier.id} style={{ padding:"18px 14px", textAlign:"center", borderLeft:`1px solid ${t.border}`, position:"relative", background:tier.popular ? c+"06":"transparent" }}>
                  {tier.popular && <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:c }} />}
                  <div style={{ fontSize:24, marginBottom:4 }}>{tier.emoji}</div>
                  <div style={{ fontSize:16, fontWeight:900 }}>{tier.name}</div>
                  <div style={{ marginTop:6 }}>
                    {tier.price===0 ? <span style={{ fontSize:20, fontWeight:900, color:c }}>Gratis</span> :
                      <><span style={{ fontSize:11, color:t.dim }}>Rp </span><span style={{ fontSize:20, fontWeight:900, color:c }}>{tier.priceStr}</span><span style={{ fontSize:10, color:t.dim }}>{tier.period}</span></>}
                  </div>
                  <div style={{ fontSize:10, color:t.dim, marginTop:4 }}>{tier.desc}</div>
                </div>
              );
            })}
          </div>
          {ROWS.map((row, ri) => (
            <div key={ri} style={{ display:"grid", gridTemplateColumns:"1.2fr 1fr 1fr 1fr", borderBottom:ri < ROWS.length-1 ? `1px solid ${t.border}`:"none", background:ri%2===0?"transparent":t.bg2+"40" }}>
              <div style={{ padding:"10px 16px", fontSize:12, fontWeight:700, display:"flex", alignItems:"center", gap:6 }}><span>{row.icon}</span>{row.label}</div>
              {row.vals.map((val, vi) => {
                const c = t[TIERS[vi].color]; const isU = val==="Unlimited"; const isC = val==="✅"; const isD = val==="—";
                return <div key={vi} style={{ padding:"10px 14px", textAlign:"center", borderLeft:`1px solid ${t.border}`, fontSize:12, fontWeight:isU?800:600, color:isD?t.dim:isU?c:isC?t.green:t.text, background:TIERS[vi].popular?c+"04":"transparent" }}>{val}</div>;
              })}
            </div>
          ))}
          <div style={{ display:"grid", gridTemplateColumns:"1.2fr 1fr 1fr 1fr", borderTop:`1.5px solid ${t.border}` }}>
            <div style={{ padding:"14px 16px" }} />
            {TIERS.map(tier => {
              const c = t[tier.color];
              return (
                <div key={tier.id} style={{ padding:"14px", textAlign:"center", borderLeft:`1px solid ${t.border}`, background:tier.popular?c+"06":"transparent" }}>
                  <a href="/dashboard" style={{ display:"block", padding:"9px 12px", borderRadius:10, background:tier.popular?c:c+"15", color:tier.popular?"#fff":c, fontSize:12, fontWeight:800, textDecoration:"none" }}>
                    {tier.price===0 ? "Mulai Gratis" : `Pilih ${tier.name}`}
                  </a>
                </div>
              );
            })}
          </div>
        </div>

        {/* Fair use */}
        <div style={{ background:t.amberBg, border:`1.5px solid ${t.amber}20`, borderRadius:14, padding:"12px 16px", marginBottom:16, display:"flex", gap:10, alignItems:"flex-start" }}>
          <span style={{ fontSize:16 }}>ℹ️</span>
          <div style={{ fontSize:11, color:t.sub, lineHeight:1.7 }}><strong style={{ color:t.amber }}>Fair Use Policy (Pro):</strong> Pro unlimited tapi bukan infinite. Penggunaan konsisten &gt;100 AI calls/hari mungkin di-throttle. Normal usage gak akan kena.</div>
        </div>

        {/* FAQ */}
        <div style={{ background:t.card, border:`1.5px solid ${t.border}`, borderRadius:18, padding:"18px 20px", boxShadow:t.shadow }}>
          <div style={{ fontSize:14, fontWeight:900, marginBottom:12 }}>❓ FAQ</div>
          {[
            { q:"Fitur apa yang gratis tanpa limit?", a:"Study Session, Moku Room, Planner, Weekly Report, Docx Export — unlimited di semua tier." },
            { q:"Limit laprak reset kapan?", a:"Setiap tanggal 1 bulan. Chat & quiz reset setiap hari jam 00:00 WIB." },
            { q:"Bisa downgrade atau cancel?", a:"Kapan aja. Berlaku di akhir periode. Gak ada lock-in." },
            { q:"Kenapa harus pakai Moku?", a:"Moku bukan cuma AI — tapi full study ecosystem. Laprak langsung jadi .docx, math 100% deterministik, study timer + gamification, Moku yang tumbuh bareng kamu. Semua terintegrasi dalam satu tempat, gak perlu copy-paste kemana-mana." },
          ].map((faq, i) => (
            <div key={i} style={{ padding:"10px 0", borderBottom:i<3?`1px solid ${t.border}`:"none" }}>
              <div style={{ fontSize:12, fontWeight:800, marginBottom:4 }}>{faq.q}</div>
              <div style={{ fontSize:11, color:t.sub, lineHeight:1.6 }}>{faq.a}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
