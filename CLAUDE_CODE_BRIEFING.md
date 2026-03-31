# MOKU STUDY PLATFORM — BRIEFING FOR CLAUDE CODE
## Complete Context & Pending Tasks

---

## PROJECT OVERVIEW

**Moku** (Mo(dal) Ku(liah)) is an AI-powered study companion web app for Indonesian university students. It features a cute creature called "Moku" that grows as users study. Built with Next.js (App Router) + Vercel + Supabase + Gemini 2.5 Flash API.

**Live URL:** https://mokuproject.vercel.app/
**GitHub:** https://github.com/avenzoer19/mokuproject
**Tagline:** "Study must be fun for everyone"

---

## DESIGN SYSTEM

- **Font:** Nunito (Google Fonts)
- **Light mode:** warm cream bg (#fffcf7), card (#ffffff)
- **Dark mode:** deep purple bg (#0e0c15), card (#1a1628)
- **Colors:** purple (#7c5ce7), teal (#00bfa6), pink (#f25d9c), amber (#f0a030), green (#22c980)
- **Style:** Rounded corners (14-22px), soft shadows, playful but clean
- **Theme system:** `src/lib/theme.js` has all palettes, `src/components/ThemeProvider.jsx` provides context
- Use `useTheme()` to get current colors, `useThemeToggle()` to toggle dark/light

---

## CURRENT FILE STRUCTURE

```
moku/
├── .env.local                  ← API keys (DO NOT commit)
├── package.json
├── next.config.mjs
├── jsconfig.json
├── .gitignore
│
├── src/
│   ├── app/
│   │   ├── globals.css          ← Fonts + all keyframe animations
│   │   ├── layout.jsx           ← Root layout (ThemeProvider)
│   │   ├── page.jsx             ← Landing Page
│   │   ├── about/page.jsx       ← About Page
│   │   ├── pricing/page.jsx     ← Pricing Page
│   │   └── dashboard/
│   │       ├── layout.jsx       ← Dashboard shell (Sidebar)
│   │       ├── page.jsx         ← Dashboard Home
│   │       ├── laprak/page.jsx  ← Lab Report V3.2
│   │       ├── modules/page.jsx ← Modules + QnA + Quiz
│   │       ├── deepdive/page.jsx ← Deep Dive
│   │       ├── study/page.jsx   ← Study Session
│   │       ├── room/page.jsx    ← Moku Room
│   │       ├── planner/page.jsx ← Planner
│   │       ├── report/page.jsx  ← Weekly Report
│   │       └── settings/page.jsx ← Settings (placeholder)
│   ├── components/
│   │   ├── ThemeProvider.jsx    ← Light/dark context
│   │   ├── MokuCreature.jsx     ← Shared Moku SVG creature
│   │   └── Sidebar.jsx          ← Dashboard sidebar navigation
│   └── lib/
│       ├── theme.js             ← Color palettes
│       └── gemini.js            ← Centralized Gemini API helper
```

---

## TASK 1: AUTH SETUP (Google OAuth via Supabase)

### Credentials (already configured):
- **Supabase Project URL:** `https://efzwrtmyviruvekvwprw.supabase.co`
- **Supabase Publishable Key:** `sb_publishable_WyEZeGnNBP_NV9lN33pj2A_JnRVOeku`
- **Google OAuth Client ID:** `400203192227-pibqgrl3oei9aio79eg8rnqhothiu0j2.apps.googleusercontent.com`
- **Google OAuth** is already enabled in Supabase dashboard (Providers → Google → enabled with Client ID + Secret saved)
- **Redirect URI** configured: `https://efzwrtmyviruvekvwprw.supabase.co/auth/v1/callback`

### What needs to be done:

1. **Install Supabase client:**
   ```bash
   npm install @supabase/supabase-js
   ```

2. **Create `src/lib/supabase.js`:**
   ```js
   import { createClient } from '@supabase/supabase-js';
   const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
   const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
   export const supabase = createClient(supabaseUrl, supabaseAnonKey);
   ```

3. **Create `src/components/AuthProvider.jsx`:**
   - React context providing: `user`, `loading`, `signIn()` (Google OAuth), `signOut()`
   - Uses `supabase.auth.signInWithOAuth({ provider: "google" })`
   - Listens to `supabase.auth.onAuthStateChange`
   - `signIn` should redirect to `/dashboard` after login

4. **Update `src/app/layout.jsx`:**
   - Wrap children with `<AuthProvider>` inside `<ThemeProvider>`
   - Add `suppressHydrationWarning` to `<html>` tag

5. **Create `src/app/auth/callback/page.jsx`:**
   - Handles OAuth redirect
   - Listens for `SIGNED_IN` event → redirect to `/dashboard`

6. **Update `src/app/dashboard/layout.jsx`:**
   - Import `useAuth()`
   - If `!loading && !user` → redirect to `/`
   - Show loading state while checking auth

7. **Update `src/components/Sidebar.jsx`:**
   - Import `useAuth()` to get user info
   - Show real user name: `user?.user_metadata?.full_name`
   - Show Google avatar: `user?.user_metadata?.avatar_url`
   - Add sign out button that calls `signOut()` and redirects to `/`
   - Currently hardcoded "Rifqi" and "Free Plan" — replace with real data

8. **Update `src/app/dashboard/page.jsx` (Dashboard Home):**
   - Import `useAuth()`
   - Replace hardcoded "Selamat datang!" with `Selamat datang, ${user?.user_metadata?.full_name?.split(" ")[0]}!`
   - Stats should show 0 for new users (not dummy data)

9. **Update `src/app/page.jsx` (Landing Page):**
   - Import `useAuth()`
   - "Masuk" button: if user exists → go to `/dashboard`, if not → call `signIn()`
   - If user is logged in, show their avatar + "Dashboard" button instead of "Masuk"

10. **Update `.env.local`:**
    ```
    NEXT_PUBLIC_SUPABASE_URL=https://efzwrtmyviruvekvwprw.supabase.co
    NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_WyEZeGnNBP_NV9lN33pj2A_JnRVOeku
    NEXT_PUBLIC_GEMINI_API_KEY=<user will add this>
    ```

11. **Add env vars to Vercel:**
    - Go to Vercel dashboard → Settings → Environment Variables
    - Add both SUPABASE vars

---

## TASK 2: CENTRALIZE GEMINI API KEY

Currently, some pages (Laprak, Modules, Deep Dive) have a temporary API key input field where users paste their own Gemini key. The goal is to remove this and use a centralized key from `.env.local`.

### What needs to be done:
- `src/lib/gemini.js` already has a centralized `callGemini()` function that uses `process.env.NEXT_PUBLIC_GEMINI_API_KEY`
- **In `src/app/dashboard/laprak/page.jsx`:** Remove the API key input UI. Replace all `callGemini(apiKey, ...)` calls with importing from `@/lib/gemini` and using the centralized function (no apiKey parameter needed)
- **In `src/app/dashboard/modules/page.jsx`:** Same — remove API key input, use centralized
- **In `src/app/dashboard/deepdive/page.jsx`:** Same

### IMPORTANT: For Laprak V3.2
The Laprak page has its own `callGemini` function defined locally. Replace it to use the centralized one from `@/lib/gemini`. The function signature should stay the same (it accepts systemPrompt, userMessage, images, docs). Also update `searchCrossRef` to use the one from `@/lib/gemini` if available, or keep it local since it doesn't need an API key.

---

## TASK 3: PRICING MODEL (Final — already implemented in UI)

```
🌱 Free — Gratis
   3 laprak/bulan, 1 revisi/laprak, 25 chat/hari, 3 quiz/hari
   
⚡ Plus — Rp 24.900/bulan
   10 laprak/bulan, 5 revisi/laprak, 50 chat/hari, unlimited quiz
   
🔥 Pro — Rp 49.900/bulan
   Unlimited semua (fair use policy — throttle at >100 calls/day)
```

Non-AI features (Study Session, Room, Planner, Report) are always FREE unlimited.
Payment will be via Midtrans (GoPay, OVO, Dana, ShopeePay) — NOT implemented yet, just mock UI.

---

## TASK 4: UI/UX FIXES NEEDED

### 4a. Landing Page responsive issues
- On mobile, the layout may break — ensure flex-wrap works properly
- Nav links should collapse to hamburger on mobile

### 4b. Sidebar collapse behavior
- When sidebar collapses, the main content `marginLeft` should also adjust
- Currently hardcoded `marginLeft: 220` — should be dynamic based on sidebar state

### 4c. About page
- Founder quote should use Rifqi's real quote:
  "Aku bikin Moku karena aku tau rasanya overwhelmed — saat semua tugas datang barengan dan kamu gak tau harus mulai dari mana. Laprak itu rutin, dan justru karena rutin, dia jadi exhausting. Bukan malas yang bikin kita nunda — tapi burn out. Dan begitu satu ketinggalan, semuanya ikut ketinggalan. Ujung-ujungnya cuma 'yang penting selesai.' Aku gak mau kayak gitu terus. Aku mau sesuatu yang nemenin, bukan cuma nyelesaiin. Sesuatu yang jujur, yang gak pura-pura tau, dan yang bikin proses belajar terasa... warm. Moku adalah jawaban itu. Dan sekarang, aku share ke kamu."

### 4d. Study Session — Moku should be BELOW timer, not overlapping
- Timer ring should be clean with just numbers
- Moku creature rendered separately below the timer circle
- Moku should be interactive (clickable — squish animation, hearts float up, expression change)
- Random speech bubbles during focus ("Kamu keren!", "Ilmu masuk...", etc)

### 4e. Dashboard — remove dummy data for new users
- Stats should show 0/empty for new users
- Moku messages should still work

---

## TASK 5: LAPRAK V3.2 — CRITICAL RULES

The Laprak page is the MOST important feature. It was built by another Claude instance. Rules:

1. **LOGIC IS 100% LOCKED** — Do NOT change any AI generation logic, validation, confidence scoring, deterministic math engine, HITL pipeline, or DOCX generation
2. **ONLY change theme/styling** — Colors, fonts, border-radius, shadows to match Moku design system
3. **Profile is DYNAMIC** — User inputs their own name, NIM, prodi, etc. (not hardcoded)
4. **Deterministic Math Engine** — AI generates JavaScript code → executed in browser → results are mathematically guaranteed correct. This is a core differentiator. Do NOT modify this flow.
5. **3-Tier Reference System** — ✅ Full-text (PDF upload), 📋 Abstract (CrossRef with abstract), ⚠️ Metadata (CrossRef without abstract). AI must be HONEST about which tier it's using.
6. **DOCX Export** — Uses docx npm package, generates proper Word document with cover page, 2-column content, Roman numeral sections. Currently in the original artifact but not yet in Next.js version (uses .txt export as fallback). To add .docx support, `npm install docx` and adapt the DOCX code from the original.

---

## TASK 6: FUTURE FEATURES (DO NOT BUILD YET)

- Spotify Web Playback SDK integration
- Midtrans real payment
- Custom domain
- Database schema for usage tracking
- Supabase tables: users, usage_logs, subscriptions

---

## DEPLOYMENT

After making changes:
```bash
git add .
git commit -m "description"
git push
```
Vercel auto-deploys from GitHub in ~30 seconds.

---

## NOTES

- The project uses Next.js App Router (not Pages Router)
- All pages are client-side rendered ("use client") — no SSR needed for now
- Theme is managed via React Context, NOT CSS variables or Tailwind
- The `MokuCreature` component is an SVG creature with breathing, blinking, bioluminescent spots — it's shared across pages
- localStorage is used for Laprak data persistence (will migrate to Supabase later)
- All images/emojis are inline (no external assets needed)
