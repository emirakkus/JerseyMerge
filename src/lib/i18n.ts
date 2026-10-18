/**
 * Single Turkish dictionary for visible game, menu, quest, tooltip and metadata copy.
 */

export type Lang = "tr";

export const LANG: Lang = "tr";

/** Copy used by the live match HUD, power-ups, pause sheet and canvas effects. */
export const GAME_UI = {
  title: "JERSEY MERGE",
  fieldThemes: {
    heading: "SAHA",
    chooseTitle: "Sahanı seç",
    chooseDescription: "Açık sahalardan birini seç ve maça başla.",
    startClassic: "MAÇA BAŞLA",
    startDaily: "GÜNLÜK MAÇA BAŞLA",
    backToMenu: "ANA MENÜ",
    locked: (level: number) => `Sv. ${level}'te açılır`,
    newlyUnlocked: (name: string) => `Yeni saha açıldı: ${name}`,
    newBadge: "YENİ",
    selected: "Seçili saha",
    names: {
      classic: "Klasik",
      night: "Gece",
      neighborhood: "Mahalle",
      rain: "Yağmurlu",
      derby: "Derbi",
      beach: "Sahil",
      winter: "Kış",
      golden: "Altın",
    },
  },
  chainPreview: "2'den 2048'e forma zinciri",
  score: "SKOR",
  best: "REKOR",
  next: "SIRADAKİ",
  following: "ARDINDAN",
  nextRankGoal: (name: string, score: number) => `Sıradaki: ${name} · ${score.toLocaleString("tr-TR")} puan`,
  maxRank: "Maksimum rütbe",
  friendChallenge: {
    button: "Arkadaşına meydan oku",
    accept: "KABUL ET",
    dismiss: "Kapat",
    guestName: "Bir oyuncu",
    invite: (name: string, score: number) => `${name}, ${score.toLocaleString("tr-TR")} puan yaptı. Geçebilir misin?`,
    highest: (level: number) => `En yüksek forma: ${level}`,
    target: (score: number) => `HEDEF ${score.toLocaleString("tr-TR")}`,
    won: "Kazandın!",
    lost: "Kaybettin",
    difference: (score: number) => `Skor farkı: ${score.toLocaleString("tr-TR")}`,
    rematch: "Rövanş",
    challengeOthers: "Sen de birine meydan oku",
    powerupsOff: "Meydan okumada kapalı",
    shareText: (score: number, link: string) => `Jersey Merge'de ${score.toLocaleString("tr-TR")} puan yaptım, geçebilir misin? ${link}`,
    copied: "Meydan okuma bağlantısı kopyalandı.",
  },
  pause: "Duraklat",
  resume: "Devam et",
  restart: "Yeniden başla",
  mainMenu: "Ana menü",
  paused: "DURAKLATILDI",
  restartConfirmTitle: "Emin misin?",
  restartConfirmBody: "Mevcut maç kaybolacak.",
  confirmRestart: "Evet, yeniden başla",
  cancel: "Vazgeç",
  musicOn: "Müziği kapat",
  musicOff: "Müziği aç",
  soundPauseOn: "Ses efektlerini aç",
  soundPauseOff: "Ses efektlerini kapat",
  highestReached: "EN YÜKSEK",
  auth: {
    welcome: "Tekrar hoş geldin!",
    join: "Takıma katıl!",
    createAccount: "HESAP OLUŞTUR",
    signIn: "GİRİŞ YAP",
    username: "KULLANICI ADI",
    password: "ŞİFRE",
    passwordPlaceholder: "en az 8 karakter",
    showPassword: "Göster",
    hidePassword: "Gizle",
    working: "Bir saniye…",
    soundLabel: "Ses efektleri",
    musicLabel: "Müzik",
    guestContinue: "Hesapsız devam et",
    description: "Skorların, serin, forma koleksiyonun ve kupaların hesabınla eşitlenir.",
    signedIn: "GİRİŞ YAPILDI",
    signOut: "Çıkış yap",
    close: "Kapat",
    google: "Google ile devam et",
    dialog: "Giriş yap veya hesap oluştur",
    account: "Hesap",
    bestAndStreak: (best: number, streak: number) => `Rekor ${best.toLocaleString("tr-TR")} puan · Seri ${streak} gün`,
    errors: {
      required: "Kullanıcı adı ve şifre gerekli.",
      passwordLength: "Şifre en az 8, en fazla 64 karakter olmalı.",
      username: "Kullanıcı adı 3–14 karakter olmalı; harf, sayı ve alt çizgi kullanabilirsin.",
      credentials: "Kullanıcı adı veya şifre yanlış.",
      taken: "Bu kullanıcı adı zaten kullanılıyor.",
      account: "Hesap oluşturulamadı. Tekrar dene.",
      connection: "Sunucuya ulaşılamadı. Tekrar dene.",
      rateLimit: "Çok fazla deneme yaptın. Biraz bekleyip tekrar dene.",
      generic: "Bir hata oluştu. Tekrar dene.",
    },
  },
  playAgain: "YENİDEN OYNA",
  powerups: "Güçlendirmeler",
  powerupNames: {
    joker: "Joker",
    bomb: "Bomba",
    scramble: "Karıştır",
    undo: "Geri Al",
  },
  powerupHelp: {
    joker: "Dokunduğu ilk formayı bir üst seviyeye çıkarır.",
    bomb: "Yakınındaki formaları temizler.",
    scramble: "Yığındaki formaları dağıtır.",
    undo: "Son atışı ve sonrasındaki birleşmeleri geri alır.",
  },
  powerupCount: (count: number) => `${count} adet`,
  levelNames: ["Çaylak", "Okul Yıldızı", "Akademi", "Profesyonel", "Millî Yıldız", "Efsane", "Şampiyon"],
  levelReached: (name: string) => `${name} seviyesine ulaştın!`,
  newBest: "YENİ REKOR!",
  levelUp: "SEVİYE ATLADIN!",
  combo: (count: number, multiplier: number) => `KOMBO ×${count}  ${multiplier}×`,
  streak: (bonus: number) => `SERİ +${bonus}`,
  jokerUpgrade: (from: number, to: number) => `JOKER ${from} → ${to}`,
  powerupEarned: (name: string) => `${name.toLocaleUpperCase("tr-TR")} +1`,
  missionComplete: (reward: number) => `GÖREV TAMAMLANDI +${reward}`,
  levelKit: (value: number) => `${value} FORMASI!`,
  trophyUnlocked: "KUPA KAZANILDI",
  gameOver: "MAÇ BİTTİ",
  wonderfulGame: "HARİKA OYUN!",
  greatGame: "ÇOK İYİ OYUN!",
  niceKicks: "GÜZEL BİR MAÇ!",
  keepPracticing: "ÇALIŞMAYA DEVAM!",
  newRecord: "YENİ REKOR",
  duration: "Süre",
  dailyChallenge: "Günlük mücadele",
  dailyNotPlayed: "Bugün oynanmadı",
  dailyCompleted: "Tamamlandı",
  menuSections: "Menü bölümleri",
  levelShort: "Sv.",
  profile: "Hesap",
  signInOrRegister: "Giriş yap veya hesap oluştur",
  collectionTooltip: "Forma koleksiyonu ve rozetler",
  leaderboard: "Sıralama",
  soundOn: "Sesi aç",
  soundOff: "Sesi kapat",
  streakTooltip: (count: number) => `${count} günlük giriş serisi; UTC gününü kaçırırsan sıfırlanır`,
  share: "Paylaş",
  confirmBomb: "Onaylamak için Bomba'ya tekrar dokun",
  copied: "Günlük skor kartı kopyalandı.",
  shareCard: (day: string, score: number, level: number, streak: number, chain: string, url: string) => `Jersey Merge Günlük #${day} | Skor ${score} | En yüksek forma: ${level} | Seri: ${streak} gün\n${chain}\n${url}`,
  guestRun: "Misafir oyunu: skorun günlük sıralamaya eklenmedi. Giriş yaparak yarışabilirsin.",
  submitError: "Skor şu an gönderilemedi. Sonraki oyunun kaydedilir.",
  dailyRank: "Günlük sıra",
  newTrophies: "Yeni kupalar",
  newBadges: "Yeni rozetler",
  topScores: "En iyi skorlar",
  top: "En iyi",
  restartTip: "İpucu: Oyunu hemen yeniden başlatmak için R tuşuna bas.",
  feedbackEnabled: "Ses ve titreşimi aç",
  feedbackDisabled: "Ses ve titreşimi kapat",
  evolution: "Forma zinciri",
  missionsLabel: "Maç görevleri",
  badgeUnlocked: (name: string) => `ROZET KAZANILDI: ${name.toLocaleUpperCase("tr-TR")}`,
  boom: (cleared: number) => cleared > 0 ? `PAT! ${cleared} forma temizlendi` : "PAT!",
  questTitles: {
    merges: (count: number) => `${count} kez forma birleştir`,
    reachValue: (value: number) => `${value} değerinde formaya ulaş`,
    combo: (count: number) => `x${count} kombo yap`,
    score: (score: number) => `Tek maçta ${score} puan kazan`,
    drops: (count: number) => `${count} forma bırak`,
    powerups: (count: number) => `${count} güçlendirici kullan`,
    matches: (count: number) => `${count} maçı tamamla`,
    collection: (count: number) => `${count} koleksiyon puanı kazan`,
  },
  simpleQuests: {
    matches: "3 maç oyna",
    score: "Tek maçta 1000 puana ulaş",
    merges: "5 forma birleştir",
  },
  dailyLabel: "GÜNLÜK",
  missions: {
    warmup: { title: "Isınma", description: "5 forma birleştir." },
    bigkit: { title: "Büyük forma", description: "32 değerinde formaya ulaş." },
    showtime: { title: "Gösteri zamanı", description: "Tek atışta 3 zincir kombo yap." },
  },
  badges: {
    first_touch: { name: "İlk Birleşme", description: "İlk formalarını birleştir." },
    kit_32: { name: "Forma Koleksiyoncusu", description: "32 değerinde formaya ulaş." },
    chain_3: { name: "Zincir Yıldızı", description: "Tek atışta 3 zincir kombo yap." },
    merges_10: { name: "Seri Birleşme", description: "Tek maçta 10 forma birleştir." },
    score_300: { name: "Golcü", description: "Tek maçta 300 puana ulaş." },
    kit_128: { name: "Büyük Final", description: "128 değerinde formaya ulaş." },
  },
  achievements: {
    first_merge: { name: "İlk Birleşme", description: "İlk formalarını birleştir." },
    merge_50: { name: "Pas Makinesi", description: "50 forma birleştir." },
    merge_200: { name: "Oyun Kurucu", description: "200 forma birleştir." },
    kit_16: { name: "Forma Koleksiyoncusu", description: "16 değerinde formaya ulaş." },
    kit_64: { name: "Altın Krampon", description: "64 değerinde formaya ulaş." },
    kit_256: { name: "Stadyum Efsanesi", description: "256 değerinde formaya ulaş." },
    combo_3: { name: "Çabuk Ayaklar", description: "x3 kombo yap." },
    combo_6: { name: "Tiki Taka", description: "x6 kombo yap." },
    score_500: { name: "Gol Makinesi", description: "Tek maçta 500 puan kazan." },
    score_2000: { name: "Maçın Galibi", description: "Tek maçta 2000 puan kazan." },
    powerup_10: { name: "Oyun Kurucu", description: "10 güçlendirici kullan." },
    joker_5: { name: "Joker", description: "5 joker forması bırak." },
    bomb_3: { name: "Havai Fişek", description: "3 bomba bırak." },
    undo_1: { name: "Mola", description: "Bir atışı geri al." },
    matches_5: { name: "Normal Sezon", description: "5 maçı tamamla." },
    matches_25: { name: "Veteran", description: "25 maçı tamamla." },
  },
} as const;

export const META_DESCRIPTION = "2'den 2048'e kadar 11 forma seviyesini birleştir; görevleri tamamla, kombo yap ve Jersey Merge'de rekorunu kır.";

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
  perMatchNote: "Görev ödülleri güçlendirici envanterine eklenir.",
  dailyBoard: "Günlük sıralama",
  noBoard: "Bugün henüz skor yok — ilk sen ol!",
  guestDaily:
    "Misafir olarak günlük modda oynayabilirsin ama skorun sıralamaya yazılmaz. Yarışmaya katılmak için giriş yap.",
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
      text: "İki aynı forma birleşerek bir üst seviyeye çıkar. Zincir 2 değerinden altın 2048 formasına kadar 11 seviyeden oluşur.",
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

export const STRINGS: Record<Lang, Strings> = { tr };

export type StringKey = keyof Strings;

export function t<K extends StringKey>(lang: Lang, key: K): Strings[K] {
  return STRINGS[lang][key];
}
