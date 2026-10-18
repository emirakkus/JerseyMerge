# Jersey Merge — Veritabanı Kurulumu (Adım Adım)

Uygulama PostgreSQL ister (hesaplar, skorlar, daily sıralama, rozetler, ilerleme).
Misafir mod DB'siz de oynanabilir; hesap özellikleri için DB gerekir.

Doğrulama komutu (her adımın sonunda işe yarar):

```bash
curl http://localhost:3000/api/health
# Beklenen:  { "ok": true, "db": true, "dbLatencyMs": ~5, "databaseUrl": "set" }
```

---

## 1. adım — PostgreSQL'i çalıştır (üç seçenek)

### Seçenek A: Docker (önerilen, her OS'te aynı)
```bash
docker run --name jersey-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=app_db \
  -p 5432:5432 -d postgres:16
```
Bağlantı dizesi: `postgresql://postgres:postgres@127.0.0.1:5432/app_db`
Kontrol: `docker ps` → `jersey-pg` (Up) görünsün.

### Seçenek B: Sistem Postgres (macOS Homebrew / Windows / Linux)
```bash
brew install postgresql@16 && brew services start postgresql@16   # macOS
sudo -u postgres createuser --interactive                        # Linux
```
Ardından kullanıcınızı şifre verin ve DB oluşturun:
```sql
ALTER USER postgres PASSWORD 'postgres';
CREATE DATABASE app_db;
```
(Windows: "SQL Server Object Explorer" → Databases → New Database → `app_db`.)

### Seçenek C: Bulut — Neon / Vercel Postgres (üretim + Capacitor mobil için önerilen)
1. [neon.tech](https://neon.tech) veya Vercel → "Add Database" ile boş proje oluşturun.
2. Panelden **pooled connection string**'i kopyalayın:
   `postgresql://USER:PASS@ep-xxx.region.aws.neon.tech/appdb?sslmode=require`
3. Bu dize size `DATABASE_URL` olacak (4. adım).

> Mobil (Capacitor) notu: Webview tarayıcı olduğu için doğrudan DB'ye bağlanamaz.
> DB **sunucu tarafında** kalır: uygulamayı (Next.js API route'larıyla birlikte)
> Vercel/Render'a deploy edin ve oraya `DATABASE_URL` ekleyin.

---

## 2. adım — Veritabanı kontrolü

```bash
psql "postgresql://postgres:postgres@127.0.0.1:5432/app_db" -c "\dt"
# Henüz tablo yoksa boş liste normaldir.
```

---

## 3. adım — `.env` dosyası (Neon URL'si ve Google OAuth)

Proje kökündeki `.env.example` dosyasını `.env` olarak kopyalayın ve değerleri doldurun. `.env` Git tarafından yok sayılır; bu dosyayı commit etmeyin.

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB_NAME?sslmode=require
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

Kuralları:
- Tek satır, tırnak **yok**, `#` yorum başlatır.
- URL formatı: `postgresql://KULLANICI:PAROLA@HOST:PORT/DB_AD`.
- Özel host'ta parola içinde `@ % /` varsa URL-encode edin (`@` → `%40`).
- Bulut (Neon) için: `?sslmode=require` sonunu koruyun.
- `.env` asla commit'lenmemeli (`.gitignore`'da olmalı).

Windows PowerShell'de şablonu kopyalamak için: `Copy-Item .env.example .env`.
Neon panelinden **pooled connection string**'i `DATABASE_URL` olarak kullanın.

Google ile giriş için Google Cloud Console'da bir OAuth istemcisi (Web application) oluşturun. Authorized redirect URI alanına tam olarak `http://localhost:3000/api/auth/google/callback` ekleyin; canlı alan adınız varsa onun `/api/auth/google/callback` adresini de ekleyin. Client ID ve Client Secret değerlerini `.env`'deki Google alanlarına girin. `GOOGLE_REDIRECT_URI`, Google Console'daki adresle birebir aynı olmalı.

---

## 4. adım — Şemayı uygula (tabloları oluştur)

**Yöntem A (en kolay) — hazır SQL betiği:**
```bash
psql "$DATABASE_URL" -f db/setup.sql
# .env'i kaynak olarak kullanmak isterseniz:
source .env && psql "$DATABASE_URL" -f db/setup.sql
```

**Yöntem B — Drizzle (schema.ts'ten üretir):**
```bash
npx drizzle-kit push
```
Not: Her iki yöntem de idempotent'tir (varsa atlar). `drizzle.config.ts`
`DATABASE_URL`'i otomatik okur (`.env` yüklenir).

Doğrulama:
```bash
psql "$DATABASE_URL" -c "\dt"
# users, sessions, scores, user_badges, player_progress,
# daily_scores, daily_quest_claims  (7 tablo)
```

---

## 5. adım — Uygulamayı başlat ve doğrula

```bash
npm install
npm run dev
# ayrı terminalde:
curl http://localhost:3000/api/health
# { "ok": true, "db": true, "dbLatencyMs": 5, "databaseUrl": "set" }
curl http://localhost:3000/api/auth/config
# Google OAuth yapılandırıldıysa: { "google": true }
```
`.env` değerlerini değiştirdikten sonra geliştirme sunucusunu yeniden başlatın. `databaseUrl: "set"` tek başına bağlantıyı doğrulamaz; sağlık kontrolünde `ok: true` görülmeli. Google düğmesi, OAuth yapılandırılınca giriş penceresinde görünür.
Tarayıcıda hesap oluştur → giriş → skor gönder; sonra:
```bash
psql "$DATABASE_URL" -c "select username, best_score from users;"
psql "$DATABASE_URL" -c "select * from scores limit 5;"
```

---

## 6. adım — Ürüne çıkmak için (opsiyonel)

1. Uygulamayı Vercel/Render'a deploy edin.
2. Deploy ortamına `DATABASE_URL` (Neon dizesi) ekleyin.
3. Neon DB'sine **bir kez** `db/setup.sql` uygulayın (Neon SQL Editor'dan yapıştırın).
4. Mobil: `capacitor.config.ts` → `server.url` = deploy adresi; `npx cap sync`.

---

## Hata tablosu

| Hata | Neden | Çözüm |
|---|---|---|
| `DATABASE_URL is missing` | `.env` yok veya deploy env eksik | 3. adım; deploy env'ine ekleyin |
| `ECONNREFUSED 127.0.0.1:5432` | Postgres çalışmıyor / port farklı | `docker ps` / servisi başlat; URL'deki portu düzeltin |
| `password authentication failed` | Parola yanlış | `ALTER USER ... PASSWORD` veya Docker env'ini kontrol edin |
| `database "app_db" does not exist` | DB yok | 1. adımda DB oluşturun veya URL'deki DB adını düzeltün |
| `relation "users" does not exist` | Şema uygulanmamış | 4. adım (`db/setup.sql`) |
| `/api/health` → `db: false, databaseUrl: "missing…"` | .env okunmuyor | `.env` proje **kökünde** mi? Harf büyük/küçük doğru mu? |
