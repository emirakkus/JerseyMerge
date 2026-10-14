/**
 * UI string dictionary. Current UI language is EN; TR translations are
 * provided so a language switch is a one-line change (`LANG = "tr"`).
 * Only menu/overlay UI copy lives here — game data (quest titles, kit names)
 * stays in its own modules.
 */

export type Lang = "en" | "tr";

export const LANG: Lang = "en";

export interface HowRule {
  title: string;
  text: string;
}

export interface Strings {
  title: string;
  tagline: string;
  signIn: string;
  signedIn: string;
  best: string;
  tabQuests: string;
  tabHow: string;
  tabScores: string;
  tabBadges: string;
  today: string;
  streak: string;
  claim: string;
  claimed: string;
  perMatchNote: string;
  dailyBoard: string;
  noBoard: string;
  guestDaily: string;
  seedNote: string;
  yourRank: string;
  play: string;
  daily: string;
  dailyAria: string;
  howRules: readonly HowRule[];
  noScores: string;
}

const en: Strings = {
  title: "JERSEY MERGE",
  tagline: "Merge your kits all the way to the big league!",
  signIn: "Sign in to save your progress",
  signedIn: "Progress is saved",
  best: "Best",
  tabQuests: "Quests",
  tabHow: "How",
  tabScores: "Scores",
  tabBadges: "Badges",
  today: "Today",
  streak: "day streak",
  claim: "Claim",
  claimed: "Claimed",
  perMatchNote: "Per-match missions. Rewards are added straight into your match score.",
  dailyBoard: "Daily board",
  noBoard: "No scores yet today — be the first!",
  guestDaily:
    "Guest run: you can play the daily, but scores are not submitted to the board. Sign in to compete.",
  seedNote: "Same jersey sequence for everyone today. Resets at 00:00 UTC.",
  yourRank: "You",
  play: "PLAY!",
  daily: "DAILY",
  dailyAria: "Daily challenge: same jerseys for everyone today",
  howRules: [
    {
      title: "Drop",
      text: "Drag, tap or use the arrow keys to aim, then tap or press Space to drop a jersey.",
    },
    {
      title: "Merge",
      text: "Two identical jerseys merge into the next value: 2 + 2 = 4, 4 + 4 = 8, up to the golden 2048 kit.",
    },
    {
      title: "Danger line",
      text: "If a resting jersey stays above the red line, the match is over.",
    },
    {
      title: "Power-ups",
      text: "Joker merges with any jersey it touches, Bomb clears an area, Scramble shuffles the pile, Undo takes back your last drop. Keys J, B, K, Z.",
    },
    {
      title: "Combo & daily",
      text: "Chain merges within 1.5s for up to 2x score. Daily quests give power-up bonuses and keep your streak alive.",
    },
  ],
  noScores: "No scores yet. Play a match to claim the top spot!",
};

const tr: Strings = {
  title: "JERSEY MERGE",
  tagline: "Formalarını birleştir, ligin zirvesine yüksel!",
  signIn: "Giriş yap, ilerlemeni kaydet",
  signedIn: "İlerlemen kaydediliyor",
  best: "Rekor",
  tabQuests: "Görevler",
  tabHow: "Nasıl",
  tabScores: "Skorlar",
  tabBadges: "Rozetler",
  today: "Bugün",
  streak: "gün seri",
  claim: "Al",
  claimed: "Alındı",
  perMatchNote: "Maç içi görevler. Ödüller doğrudan maç puanına eklenir.",
  dailyBoard: "Günlük sıralama",
  noBoard: "Bugün henüz skor yok — ilk sen ol!",
  guestDaily:
    "Misafir koşusu: daily oynayabilirsin ama skorlar sıralamaya yazılmaz. Rekabete katılmak için giriş yap.",
  seedNote: "Bugün herkes için aynı forma sırası. 00:00 UTC'de yenilenir.",
  yourRank: "Sen",
  play: "OYNA!",
  daily: "GÜNLÜK",
  dailyAria: "Günlük meydan okuma: bugün herkes için aynı formlar",
  howRules: [
    {
      title: "Bırak",
      text: "Sürükle, dokun ya da ok tuşlarıyla nişan al; sonra dokun ya da Space'e basarak forma bırak.",
    },
    {
      title: "Birleştir",
      text: "İki aynı forma bir üst değere geçer: 2 + 2 = 4, 4 + 4 = 8, altın 2048 formasına kadar.",
    },
    {
      title: "Tehlike çizgisi",
      text: "Kırmızı çizginin üstünde bekleyen bir forma maçın sonu demektir.",
    },
    {
      title: "Güçlendiriciler",
      text: "Joker değdiği her forma birleşir, Bomba alanı temizler, Karıştır yığını dağıtır, Geri Al son atışı geri alır. Tuşlar: J, B, K, Z.",
    },
    {
      title: "Kombo & günlük",
      text: "1.5sn içinde art arda birleşme 2× puana kadar çarpan verir. Günlük görevler güçlendirici ödülleri ve seriyi korur.",
    },
  ],
  noScores: "Henüz skor yok. Bir maç oynayıp zirveyi kap!",
};

export const STRINGS: Record<Lang, Strings> = { en, tr };

export type StringKey = keyof Strings;

export function t<K extends StringKey>(lang: Lang, key: K): Strings[K] {
  return STRINGS[lang][key];
}
