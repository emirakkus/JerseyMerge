# Jersey Merge → Mobil (Capacitor)

Oyun zaten mobil öncelikli: dokunma ile nişan + bırakma, DPR'lı keskin canvas,
tek kolon düzen, zoom/sağ kaydırma kilidi, safe-area (notch) dolguları,
manifest + ikon (home screen'e ekleme), `theme-color`.

## Mimari notu (önemli)

Hesaplar, skorlar ve global leaderboard **Next.js API route'larında** (PostgreSQL)
tutulduğu için Capacitor uygulamasının sunucuya bağlanması gerekir:

- **Önerilen:** Uygulamayı (DB ile birlikte) barındır — örn. Vercel + Neon.
  Webview, derlenmiş statik bundle + `server.url` ile uzak uygulamayı yükler.
- **Misafir mod:** Sunucusuz da oyun tam çalışır; ilerleme tarayıcının
  localStorage'ında tutulur. Yalnızca hesap/global leaderboard devre dışı kalır.

## Kurulum

```bash
# 1) Capacitor platformları
npm i -D @capacitor/cli          # (zaten eklendi)
npm i @capacitor/status-bar      # isteğe bağlı: durum çubuğu kontrolü
npx cap add android
npx cap add ios                  # iOS için Mac + Xcode gerekli

# 2) Web tarafını derle (API URL'ini derleme anında göm)
NEXT_PUBLIC_API_URL=https://your-app.vercel.app npm run build

# 3) Uzak uygulamayı webview'a bağla
npx cap config set server.url https://your-app.vercel.app

# 4) Senkronize et ve aç
npx cap sync
npx cap open android   # Android Studio
npx cap open ios       # Xcode
```

`server.url` kullanıldığında `webDir` içeriği webview tarafından yüklenmez;
yine de Capacitor'un `sync`'i bir `webDir` bekler — basit bir `out/` klasörü
(ör. tek bir `index.html` yönlendirme) yeterli olacaktır.

## Google ile giriş (mobil)

Google Cloud Console'daki OAuth istemcine **web uygulama** kaydı yapın ve
yetkili yönlendirme URI'si olarak şunu ekleyin:

```
https://your-app.vercel.app/api/auth/google/callback
```

`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` sunucu tarafında (ortamda) olmalı.

## iOS ses notu

iOS'ta AudioContext yalnızca kullanıcı jesti içinde açılır; oyun bunu Play
butonu ve ilk dokunuşta hallediyor (`sfx.unlock()`).

## Test önerileri

- iPhone SE (375×667) ve 12/13/14 (390×844) boyutlarında oynanış
- Home screen'den açılış (standalone) + notch bölgelerinde boşluk
- Dokunma: sürükle-nişan, hızlı ardışık bırakma, J (buton) joker
- Uçak modunda misafir oyun (sadece hesap/leaderboard beklesin)
