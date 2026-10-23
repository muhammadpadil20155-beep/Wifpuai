# SecretLy Web (Supabase)
## 1. Supabase
Buat project, buka SQL Editor, jalankan isi `supabase.sql`.
Ambil di Project Settings > API: **Project URL** dan **service_role key** (rahasia).

## 2. Vercel
1. Upload isi folder ini ke root repo GitHub (server.js, package.json, vercel.json, api/, public/ langsung di root).
2. Import ke Vercel, Framework Preset: Other, build/output kosong.
3. Environment Variables:
   - SUPABASE_URL = Project URL
   - SUPABASE_SERVICE_KEY = service_role key
   - BOT_API_URL = http://IP-PANEL:PORT bot
   - BOT_API_KEY = sama dengan apiKey di config.js bot
   - JWT_SECRET = teks acak panjang
4. Redeploy setelah env diisi.
