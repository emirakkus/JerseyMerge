# İlerleme: XP, Seviye, Başarım, Koleksiyon — Senkron Dokümanı

## Kalıcılık
- **Hesap:** `player_progress` tablosu (kullanıcı başına 1 satır: `xp`,
  `counters` JSONB, `achievements` dizisi). Endpointler: `GET /api/progress`,
  `POST /api/progress` (rate limit'li).
- **Misafir:** cihazda `localStorage` (`jersey-merge.progress`).
- Olay akışı: motor `GameEvent` yayar → `ProgressTracker` dinler (motorla sıkı
  bağ yok); `matches` sayaç `gameover` olayından beslenir.

## Çakışma kuralı: "en ileri olan kazanır"
Giriş yapınca (ve her senkronlamada) cihaz durumu ile bulut durumu birleştirilir:
- Her sayaç alanı (merges, maxValue, maxCombo, maxScore, matches, powerups,
  joker, bomb, scramble, undo): **daha yüksek değer kazanır** (alan bazında).
- `xp`: **daha yüksek değer kazanır**.
- `achievements`: **birleşim (union)** — açılan başarım asla kaybolmaz.
Kural birleşmeli (commutative) ve idempottandır; sıraya/bağlantı yönüne bağlı
değildir. Bir başarımın XP ödülü yalnızca ilk açılışta bir kez verilir
(sayaçlar ömür boyu olduğundan tekrar tetiklenmez, `achievements` listesi
tekrarı engeller).

## XP ve seviye
- Maç sonunda: `XP = skor + kombo_uzunluğu × 10 (+ daily 25)`.
- Başarım ödülleri açılış anında eklenir (veri dosyasındaki `rewardXp`).
- Seviye eşikleri `src/lib/progress/xp.ts` → `LEVEL_CONFIG` (base 120,
  growth 1.4, maxLevel 40) — tek noktadan ayarlanabilir.

## Koleksiyon
- Ulaşılan en yüksek forma değeri (`counters.maxValue`) koleksiyonu belirler:
  `maxValue ≥ X` ise X forması açılmıştır; diğerleri silüet + kilit görünür.
- Tüm forma tasarımları **kurgusaldır**: gerçek kulüp, oyuncu veya marka adı,
  logosu kullanılmaz (ekran altı notuyla da belirtilir).

## Başarım bildirimi
- Erişilebilir: kalıcı `aria-live="polite"` bölge içinde toast ("Trophy
  unlocked — ad, +XP"); `prefers-reduced-motion` açıksa animasyon kapalı,
  içerik yine gösterilir.

## Cihazlar arası davranış
- Her iki cihazda da "en ileri" durum korunur (alan bazında max).
- Çıkışta ilerleme cihaza kalır; sonraki girişte yeniden birleşir.
- Çevrimdışıyken: yerel kayıt çalışır; bağlantı gelince sonraki senkron
  birleştirir.
