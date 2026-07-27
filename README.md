# LEVER — Sistem Anti-Prokrastinasi

Aplikasi produktivitas multi-user berbasis riset. Bukan to-do list generik:
setiap fitur diturunkan dari **Temporal Motivation Theory** (Steel, 2007) dan
**implementation intentions** (Gollwitzer, 1999). Prokrastinasi diperlakukan
sebagai masalah regulasi emosi, bukan manajemen waktu.

Metrik utamanya bukan "berapa tugas selesai", melainkan **time-to-start** —
jeda antara saat kamu berencana mulai dan saat kamu benar-benar mulai.

---

## Daftar isi

1. [Fitur](#fitur)
2. [Stack](#stack)
3. [Prasyarat](#prasyarat)
4. [Setup lokal](#setup-lokal)
5. [Environment variables](#environment-variables)
6. [Database dengan Docker](#database-dengan-docker)
7. [Migrasi Prisma](#migrasi-prisma)
8. [Setup Google Cloud](#setup-google-cloud)
9. [Menjalankan aplikasi](#menjalankan-aplikasi)
10. [Pintasan keyboard](#pintasan-keyboard)
11. [Skrip npm](#skrip-npm)
12. [Build produksi & deploy](#build-produksi--deploy)
13. [Struktur proyek](#struktur-proyek)
14. [Catatan arsitektur](#catatan-arsitektur)

---

## Fitur

| Modul | Ringkasan |
| --- | --- |
| **North Star Goals** | Maksimal 5 tujuan aktif, 1 disematkan sebagai North Star di dashboard. Progres diperbarui manual — memaksa refleksi, bukan otomatis dari tugas. |
| **Task manager** | Empat tampilan (Hari ini, Semua, Terlambat, Selesai), quick-add, drag-to-reorder, optimistic complete/skip dengan rollback. |
| **Formula Steel** | Slider E/V/I/D, skor 0–100 dihitung ulang di server, plus intervensi yang ditargetkan ke variabel yang macet. |
| **Niat jika-maka** | Implementation intentions terikat ke satu tugas, dengan tingkat aktivasi dari sesi yang benar-benar dimulai. |
| **Sesi fokus** | Pomodoro / deep work dengan setup 4 langkah, timer full-screen anti-drift, dan refleksi pasca-sesi. |
| **Refleksi harian** | Modal otomatis setelah pukul 18.00 waktu lokal pengguna, menyelesaikan tugas yang menggantung. |
| **Analitik 30 hari** | Tujuh grafik plus temuan terhitung: jam paling rawan menunda, hari terbaik, dan delta minggu ini vs minggu lalu. |
| **Google Calendar** | Sesi fokus tersinkron dua arah, deteksi bentrok, dan penanganan `invalid_grant` yang jelas. |

---

## Stack

| Lapisan | Teknologi |
| --- | --- |
| Framework | Next.js 14 (App Router, TypeScript strict) |
| Database | PostgreSQL 16 + Prisma ORM 6 |
| Auth | NextAuth.js v5 (Google OAuth + Credentials) |
| Styling | Tailwind CSS + CSS Variables |
| Font | Poppins (UI) + JetBrains Mono (angka) |
| Ikon | Lucide React |
| Chart | Recharts |
| State | Zustand (client) + SWR (server) |
| Kalender | Google Calendar API v3 (`googleapis`) |
| Validasi | Zod |
| Email | Resend |

---

## Prasyarat

| Kebutuhan | Versi | Catatan |
| --- | --- | --- |
| **Node.js** | 20 LTS atau lebih baru | Diuji pada Node 24. |
| **npm** | 10+ | Ikut bawaan Node. |
| **Docker Desktop** | terbaru | Hanya untuk PostgreSQL lokal. Boleh dilewati kalau memakai Supabase. |
| **Akun Google Cloud** | — | Hanya kalau ingin integrasi kalender. |

Cek versi:

```bash
node --version && npm --version && docker --version
```

---

## Setup lokal

### 1. Clone dan install

```bash
git clone <url-repo> lever
cd lever
npm install
```

### 2. Siapkan environment

```bash
cp .env.example .env
```

Lalu isi nilainya — lihat bagian berikutnya.

---

## Environment variables

Semua variabel tinggal di satu file `.env`. **Jangan buat `.env.local`** —
Next.js memberinya prioritas lebih tinggi, sedangkan Prisma CLI hanya membaca
`.env`, sehingga keduanya mudah tidak sinkron.

| Variabel | Wajib | Fungsi |
| --- | --- | --- |
| `DATABASE_URL` | ya | Connection string PostgreSQL. Dipakai Prisma untuk migrasi dan runtime. |
| `NEXTAUTH_URL` | ya | Base URL aplikasi. Harus sama persis dengan redirect URI di Google Cloud. |
| `NEXTAUTH_SECRET` | ya | Kunci penandatangan JWT sesi. Mengubahnya membuat semua sesi lama tidak valid. |
| `GOOGLE_CLIENT_ID` | opsional | OAuth client ID. Tanpa ini, tombol "Masuk dengan Google" gagal; login email tetap jalan. |
| `GOOGLE_CLIENT_SECRET` | opsional | OAuth client secret, pasangan dari ID di atas. |
| `TOKEN_ENCRYPTION_KEY` | ya | Kunci AES-256-CBC untuk mengenkripsi token Google sebelum disimpan. **Wajib 64 karakter hex.** |
| `RESEND_API_KEY` | opsional | Email selamat datang. Kalau kosong, pendaftaran tetap berhasil dan pengiriman dilewati. |
| `RESEND_FROM_EMAIL` | opsional | Alamat pengirim terverifikasi di Resend. |
| `NEXT_PUBLIC_APP_URL` | ya | Dipakai di metadata dan tautan email. |
| `NEXT_PUBLIC_APP_NAME` | ya | Nama aplikasi yang tampil di UI. Default `LEVER`. |

Generate dua rahasia yang bisa dibuat sendiri:

```bash
openssl rand -base64 32
```

```bash
openssl rand -hex 32
```

Yang pertama untuk `NEXTAUTH_SECRET`, yang kedua untuk `TOKEN_ENCRYPTION_KEY`.
Di Windows tanpa OpenSSL, pakai Node:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## Database dengan Docker

Jalankan PostgreSQL 16 di port 5434 (menghindari bentrok dengan Postgres lain
yang mungkin sudah memakai 5432):

```bash
docker run --name lever-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=lever -p 5434:5432 -d postgres:16
```

Isi `DATABASE_URL` sesuai:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5434/lever?schema=public"
```

Perintah harian:

```bash
docker start lever-db
```

```bash
docker stop lever-db
```

> Kalau memakai port 5432, ganti `-p 5434:5432` menjadi `-p 5432:5432` dan
> sesuaikan `DATABASE_URL`.

### Alternatif: Supabase

Buat project baru, lalu salin connection string ke `DATABASE_URL`. Gunakan
**Direct connection** untuk migrasi dan **Transaction pooler** untuk runtime.

---

## Migrasi Prisma

```bash
npm run db:migrate
```

Perintah ini menerapkan seluruh migrasi dan meng-generate Prisma Client.
Untuk membuka data secara visual:

```bash
npm run db:studio
```

> **Catatan Windows:** `npm run build` menjalankan `prisma generate`, yang tidak
> bisa menimpa `query_engine-windows.dll.node` selagi dev server berjalan.
> Hentikan dev server sebelum build.

---

## Setup Google Cloud

Diperlukan hanya untuk login Google dan sinkronisasi kalender.

### 1. Buat project

Buka [console.cloud.google.com](https://console.cloud.google.com) → **Select a
project** → **New Project** → beri nama, misalnya `lever-dev`.

### 2. Aktifkan Google Calendar API

**APIs & Services → Library** → cari **Google Calendar API** → **Enable**.
Tanpa langkah ini, semua panggilan kalender gagal meski OAuth sudah benar.

### 3. Konfigurasi OAuth consent screen

**APIs & Services → OAuth consent screen**

1. User type: **External**
2. Isi App name, User support email, dan Developer contact
3. Di langkah **Scopes**, tambahkan:
   - `openid`
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `https://www.googleapis.com/auth/calendar.events`
   - `https://www.googleapis.com/auth/calendar.readonly`
4. Di langkah **Test users**, tambahkan alamat Gmail yang akan dipakai menguji.
   Selama status masih *Testing*, hanya akun di daftar ini yang bisa masuk.

### 4. Buat OAuth client

**APIs & Services → Credentials → Create Credentials → OAuth client ID**

- Application type: **Web application**
- Authorized JavaScript origins: `http://localhost:3000`
- Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`

> Redirect URI harus sama persis, termasuk `http`, port, dan tanpa garis miring
> di akhir. Ketidakcocokan menghasilkan `redirect_uri_mismatch`.

Salin **Client ID** dan **Client Secret** ke `.env`.

### 5. Untuk produksi

Tambahkan origin dan redirect URI domain produksi ke OAuth client yang sama:

- Origin: `https://<domain-kamu>`
- Redirect: `https://<domain-kamu>/api/auth/callback/google`

---

## Menjalankan aplikasi

```bash
npm run dev
```

Buka <http://localhost:3000>.

Alur pertama kali: daftar → onboarding 3 langkah (North Star → zona waktu →
kalender opsional) → dashboard.

---

## Pintasan keyboard

| Tombol | Aksi |
| --- | --- |
| `Ctrl` + `K` | Buka command palette (cari tugas, tambah tugas, navigasi) |
| `N` | Tambah tugas baru |
| `F` | Buka halaman sesi fokus |
| `1` `2` `3` `4` | Dashboard · Tugas · Analitik · Tujuan |
| `?` | Tampilkan daftar pintasan |
| `Esc` | Tutup dialog, panel, atau input |

Semua pintasan satu-huruf otomatis nonaktif saat kursor berada di dalam kolom
isian, sehingga tidak pernah mengganggu pengetikan.

---

## Skrip npm

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Build produksi (menjalankan `prisma generate` lebih dulu) |
| `npm start` | Menjalankan hasil build |
| `npm run typecheck` | TypeScript tanpa emit |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Buat dan terapkan migrasi (development) |
| `npm run db:deploy` | Terapkan migrasi (produksi) |
| `npm run db:push` | Sinkronkan skema tanpa migrasi |
| `npm run db:studio` | Prisma Studio |

---

## Build produksi & deploy

### Build lokal

```bash
npm run build && npm start
```

### Vercel + Supabase

**1. Database.** Buat project Supabase, lalu jalankan migrasi dari mesin lokal
dengan `DATABASE_URL` menunjuk ke **Direct connection**:

```bash
npx prisma migrate deploy
```

**2. Import repo ke Vercel.** Build command bawaan sudah benar; tidak perlu
diubah.

**3. Environment variables di Vercel.** Isi semua variabel dari
`.env.example`, dengan penyesuaian:

- `DATABASE_URL` → **Transaction pooler** Supabase (runtime perlu pooling)
- `NEXTAUTH_URL` dan `NEXT_PUBLIC_APP_URL` → domain produksi
- `NEXTAUTH_SECRET` dan `TOKEN_ENCRYPTION_KEY` → **nilai baru**, jangan pakai
  ulang nilai development

**4. Google Cloud.** Tambahkan redirect URI produksi seperti dijelaskan di atas.

**5. Verifikasi.** Buka domain produksi, daftar, dan pastikan onboarding sampai
dashboard berjalan.

> `TOKEN_ENCRYPTION_KEY` mengenkripsi token Google yang tersimpan. Mengubahnya
> setelah ada data membuat token lama tidak bisa didekripsi, dan pengguna harus
> menghubungkan ulang kalendernya.

---

## Struktur proyek

```
app/
  (app)/            — halaman yang butuh sesi; tiap folder punya
                      page.tsx, loading.tsx, dan error.tsx
  auth/             — signin & signup
  onboarding/       — wizard 3 langkah
  api/              — route handlers, semua mengembalikan { data, error }
components/
  ui/               — primitif (Button, Input, Modal, Drawer, Select, ...)
  layout/           — AppShell, Sidebar, TopBar, CommandPalette, shortcuts
  goals/ tasks/ sessions/ intentions/ analytics/ calendar/ checkin/
lib/
  auth.ts           — NextAuth (Node runtime: Prisma + bcrypt)
  auth.config.ts    — potongan config yang aman untuk Edge/middleware
  crypto.ts         — AES-256-CBC untuk token Google
  google-calendar.ts— wrapper Calendar API + penanganan invalid_grant
  steel-formula.ts  — perhitungan motivasi dan intervensi
  daily-metrics.ts  — agregasi harian + sinkronisasi DailyCheckin
  analytics.ts      — helper agregasi 30 hari
prisma/
  schema.prisma
  migrations/
```

---

## Catatan arsitektur

**Zona waktu.** Semua perhitungan harian memakai zona waktu pengguna, bukan UTC
maupun zona browser. Pengguna Jakarta melihat harinya berganti pukul 00.00 WIB.

**Envelope API.** Setiap route mengembalikan `{ data, error }`. Pesan error
selalu spesifik dan berbahasa Indonesia — `"Gagal menyimpan"` tidak dianggap
memadai.

**Kegagalan kalender tidak pernah memblokir.** Setiap panggilan Google dibungkus
`safeCalendar()`. Google yang sedang bermasalah tidak boleh membuat penyimpanan
tugas atau sesi ikut gagal.

**Optimistic updates.** Perubahan status tugas langsung terlihat dan otomatis
di-rollback disertai toast bila server menolak.

**DailyCheckin sebagai snapshot.** Angka objektif dihitung ulang setiap kali ada
mutasi, sedangkan nilai subjektif (energi, kualitas fokus, catatan) hanya ditulis
oleh pengguna dan tidak pernah tertimpa.
