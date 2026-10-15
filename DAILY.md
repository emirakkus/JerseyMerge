# Günlük Meydan Okuma — Davranış Belgesi

## Saat dilimi kuralı (önemli)
Tüm "gün" sınırları **UTC'ye göredir** (`YYYY-MM-DD` gün anahtarı), kullanıcının
yerel saat dilimine göre değil. Gün `00:00 UTC`'de değişir. Örnek: İstanbul'da
(UTC+3) saat 22:00'de başlayan maç, o günün dailisine sayılır; 03:00'ten sonra
yeni gün başlar. Streak de aynı kuralı kullanır: önceki **UTC günü** aktifse seri
uzar, en az bir UTC günü kaçırılırsa 1'e sıfırlanır.

## Deterministik forma sırası
- `seed = FNV1a("jersey-merge-daily-<YYYY-MM-DD>")` (32 bit).
- Motor, daily modda spawn seçimini `mulberry32(seed)` PRNG'iyle üretir;
  klasik mod `Math.random` kullanır (mevcut davranış değişmez).
- Aynı gün iki cihaz aynı sırayı oynar; kozmetik rastgelelik (parçacıklar,
  küçük ivme salınımları) sıraya dahil değildir.
- Günlük görevler de aynı gün anahtarından deterministik türetilir (herkese 3 görev).

## Sıralama ve kayıt
- `POST /api/daily/challenge`: **giriş şart**. Misafir oynayabilir ama sıralamaya
  yazılamaz; oyun sonu ekranında "misafir koşusu" mesajı gösterilir.
- **Gün başına en iyi skor kuralı**: aynı gün aynı kullanıcı için yalnızca en
  yüksek skor saklanır (daha düşük tekrar gönderimler yok sayılır).
- Tablo: `daily_scores (user_id, day_key UNIQUE, score, time_ms)`.
- Doğrulama: 0 ≤ score ≤ 1.000.000, 0 ≤ time ≤ 4 saat, skor > 0 ise süre ≥ 1 sn.
- Çevrimdışı/hata durumunda skor sunucuya yazılamaz; hata modalda bildirilir.

## Streak (günlük giriş serisi)
- `POST /api/daily/touch` (günde bir kez etkili) — hesaplı kullanıcıda
  sunucuda tutulur (`users.streak`, `users.last_active_day`).
- Misafirde aynı kural cihazda (localStorage) tutulur.
- Sınır durumları: aynı gün tekrar → değişmez; art arda gün → +1;
  arada kaçırılan gün → 1.

## Görevler ve ödül
- 3 görev/gün; ilerleme **oyun olaylarından** beslenir (motor `GameEvent`
  yayar, `DailyQuestTracker` dinler — motorla sıkı bağ yok).
- İlerleme gün bazında, maçlar arası kümülatiftir (cihazda saklanır).
- Ödül: +1 güçlendirici hakkı (cihazdaki bankada); sonraki maç başında
  envantere eklenir. Hesaplı kullanıcıda çift ödül alma `daily_quest_claims`
  tablosu ile sunucuda engellenir (gün + görev başına bir hak).

## Rate limit
- Süreli pencere, bellek içi (tek instance MVP; ölçeklenirken Redis'e taşınır).
- daily challenge: 10 istek / 10 dk (kullanıcı) + 30 / 10 dk (IP).
- claim: 8 / 10 dk; touch: 5 / dk. Aşımda `429`.

## Mobil / Capacitor notu
Daily özellikler API'ye bağlıdır; `NEXT_PUBLIC_API_URL` doğru setliyse webview'da
çalışır. Çevrimdışıyken: oyun ve misafir daily oynanabilir, sıralama/streak
güncellenmez ve uygun mesaj gösterilir.
