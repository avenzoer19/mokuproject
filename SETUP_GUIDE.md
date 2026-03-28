# 🧠 MOKU — Setup Guide
## From VS Code to Published Website

---

## STEP 1: Prerequisites (Install sekali aja)

### 1a. Install Node.js
- Download dari https://nodejs.org (pilih LTS version)
- Setelah install, buka terminal/cmd, ketik: `node --version`
- Kalau muncul versi (misal v20.x.x), berarti berhasil

### 1b. Install Git
- Download dari https://git-scm.com
- Cek: `git --version`

---

## STEP 2: Setup Project (5 menit)

Buka terminal di VS Code, lalu jalankan satu per satu:

```bash
# 1. Masuk ke folder dimana kamu mau simpan project
cd Desktop

# 2. Buat Next.js project baru
npx create-next-app@latest moku --js --no-tailwind --no-eslint --app --src-dir --no-import-alias

# 3. Masuk ke folder project
cd moku

# 4. Install dependencies yang dibutuhkan
npm install @supabase/supabase-js
```

---

## STEP 3: Copy Files (10 menit)

Setelah project terbuat, **REPLACE** semua file di folder `moku/` dengan file-file dari folder yang aku generate.

Caranya:
1. Buka folder `moku` yang baru dibuat di VS Code
2. Delete isi folder `src/` yang auto-generated
3. Copy semua file dari folder yang aku kasih ke posisi yang sesuai

Struktur akhir harus seperti ini:
```
moku/
├── package.json          ← REPLACE dengan punyaku
├── next.config.mjs       ← REPLACE
├── .env.local            ← BUAT BARU (copy template dari file ku)
├── jsconfig.json         ← biarkan yang auto-generated
├── public/
│   └── (biarkan)
└── src/
    ├── app/
    │   ├── globals.css    ← REPLACE
    │   ├── layout.jsx     ← REPLACE
    │   ├── page.jsx       ← REPLACE (Landing Page)
    │   ├── about/page.jsx
    │   ├── pricing/page.jsx
    │   └── dashboard/
    │       ├── layout.jsx
    │       ├── page.jsx
    │       ├── laprak/page.jsx
    │       ├── modules/page.jsx
    │       ├── deepdive/page.jsx
    │       ├── study/page.jsx
    │       ├── room/page.jsx
    │       ├── planner/page.jsx
    │       ├── report/page.jsx
    │       └── settings/page.jsx
    ├── components/
    │   ├── ThemeProvider.jsx
    │   ├── MokuCreature.jsx
    │   └── Sidebar.jsx
    └── lib/
        ├── theme.js
        └── gemini.js
```

---

## STEP 4: Setup Environment Variables

Buat file `.env.local` di ROOT folder project (sejajar package.json):

```
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_key_here
```

Cara dapet Gemini API key:
1. Buka https://aistudio.google.com/apikey
2. Klik "Create API Key"
3. Copy key-nya, paste di `.env.local`

---

## STEP 5: Run Locally (Test dulu)

```bash
npm run dev
```

Buka browser → http://localhost:3000
- `/` = Landing Page
- `/about` = About
- `/pricing` = Pricing
- `/dashboard` = Dashboard Home
- `/dashboard/laprak` = Lab Report Generator
- `/dashboard/study` = Study Session
- ... dll

Kalau semua jalan → lanjut deploy!

---

## STEP 6: Push ke GitHub

```bash
# 1. Inisialisasi git (kalau belum)
git init

# 2. Add semua file
git add .

# 3. Commit
git commit -m "Initial commit - Moku Study Platform"

# 4. Buat repo baru di github.com (klik + → New Repository → nama: moku)
# JANGAN centang "Add README" — biarkan kosong

# 5. Connect dan push
git remote add origin https://github.com/USERNAME_KAMU/moku.git
git branch -M main
git push -u origin main
```

---

## STEP 7: Deploy ke Vercel (5 menit)

1. Buka https://vercel.com → Sign up dengan GitHub
2. Klik "Add New Project"
3. Pilih repo "moku" dari list GitHub kamu
4. Di bagian "Environment Variables", tambahkan:
   - Key: `NEXT_PUBLIC_GEMINI_API_KEY`
   - Value: (paste Gemini key kamu)
5. Klik "Deploy"
6. Tunggu 1-2 menit
7. SELESAI! Kamu dapet URL seperti: `moku-xxxxx.vercel.app`

---

## STEP 8: Custom Domain (Opsional)

1. Beli domain (misal di Niagahoster, Namecheap, atau Cloudflare)
   - Contoh: moku.study atau getmoku.com
2. Di Vercel → Settings → Domains → Add domain
3. Ikuti instruksi DNS yang dikasih Vercel
4. Selesai — website kamu bisa diakses via domain sendiri

---

## Workflow Sehari-hari (Setelah Setup)

```bash
# Edit file di VS Code
# Save
# Lalu:
git add .
git commit -m "deskripsi perubahan"
git push

# Vercel otomatis deploy ulang dalam 30 detik!
```

---

## Troubleshooting

### "Module not found"
→ Jalankan `npm install` lagi

### "Port 3000 already in use"
→ Kill process lama atau pakai `npm run dev -- -p 3001`

### Vercel deploy gagal
→ Cek error log di Vercel dashboard, biasanya typo atau missing file

### Halaman blank
→ Cek browser console (F12) untuk error message

---

## Phase Berikutnya (Setelah Website Live)

1. **Supabase Auth** — Google OAuth login
2. **Database** — User data, usage tracking
3. **Midtrans** — Real payment integration
4. **Spotify** — Web Playback SDK
5. **API Routes** — Centralized Gemini key (backend)

Ini semua bisa ditambahkan incremental — website tetap jalan selama proses.
