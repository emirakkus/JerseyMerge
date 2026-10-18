export interface FriendChallenge {
  seed: number;
  score: number;
  maxLevel: number;
  name: string;
}

const MAX_SCORE = 1_000_000_000;

export function sanitizeChallengeName(value: string): string {
  return Array.from(value
    .replace(/<[^>]*>/g, "")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim())
    .slice(0, 20)
    .join("");
}

export function createChallengeCode(challenge: FriendChallenge): string {
  const json = JSON.stringify({
    seed: challenge.seed >>> 0,
    score: Math.max(0, Math.min(MAX_SCORE, Math.floor(challenge.score))),
    maxLevel: challenge.maxLevel,
    name: sanitizeChallengeName(challenge.name) || "Bir oyuncu",
  });
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function decodeChallengeCode(code: string): FriendChallenge | null {
  if (!code || code.length > 512 || !/^[A-Za-z0-9_-]+$/.test(code)) return null;
  try {
    const base64 = code.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(base64 + "=".repeat((4 - (base64.length % 4)) % 4));
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const data: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (typeof data !== "object" || data === null) return null;
    const record = data as Record<string, unknown>;
    if (!Number.isInteger(record.seed) || Number(record.seed) < 0 || Number(record.seed) > 0xffffffff) return null;
    if (!Number.isSafeInteger(record.score) || Number(record.score) < 0 || Number(record.score) > MAX_SCORE) return null;
    const maxLevel = Number(record.maxLevel);
    if (!Number.isSafeInteger(maxLevel) || maxLevel < 2 || maxLevel > MAX_SCORE || !Number.isInteger(Math.log2(maxLevel))) return null;
    if (typeof record.name !== "string" || Array.from(record.name).length > 80) return null;
    const name = sanitizeChallengeName(record.name);
    return {
      seed: Number(record.seed),
      score: Number(record.score),
      maxLevel,
      name: name || "Bir oyuncu",
    };
  } catch {
    return null;
  }
}

export function randomChallengeSeed(): number {
  const values = new Uint32Array(1);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(values);
    return values[0];
  }
  return Math.floor(Math.random() * 0x1_0000_0000) >>> 0;
}
