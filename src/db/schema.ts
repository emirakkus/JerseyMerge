import {
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    username: text("username").notNull(),
    email: text("email").unique(),
    provider: text("provider").notNull().default("password"),
    avatarUrl: text("avatar_url"),
    passwordHash: text("password_hash").notNull(),
    bestScore: integer("best_score").notNull().default(0),
    bestTimeMs: integer("best_time_ms").notNull().default(0),
    bestAt: timestamp("best_at", { withTimezone: true }).notNull().defaultNow(),
    /** UTC day key ("YYYY-MM-DD") of the last app open; powers the streak. */
    lastActiveDay: text("last_active_day"),
    streak: integer("streak").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("users_username_idx").on(t.username)]
);

export const sessions = pgTable("sessions", {
  token: text("token").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export const scores = pgTable(
  "scores",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    score: integer("score").notNull(),
    timeMs: integer("time_ms").notNull().default(0),
    powerupsUsed: integer("powerups_used").notNull().default(0),
    bestCombo: integer("best_combo").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("scores_user_score_idx").on(t.userId, t.score)]
);

export const userBadges = pgTable(
  "user_badges",
  {
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    badgeId: text("badge_id").notNull(),
    earnedAt: timestamp("earned_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.badgeId] })]
);

/** One row per user per UTC day — only the best daily score is kept. */
export const dailyScores = pgTable(
  "daily_scores",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    dayKey: text("day_key").notNull(),
    score: integer("score").notNull(),
    timeMs: integer("time_ms").notNull().default(0),
    submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("daily_scores_user_day_idx").on(t.userId, t.dayKey)]
);

/** Anti double-claim: one claim per user per quest per UTC day. */
export const dailyQuestClaims = pgTable(
  "daily_quest_claims",
  {
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    dayKey: text("day_key").notNull(),
    questId: text("quest_id").notNull(),
    claimedAt: timestamp("claimed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.dayKey, t.questId] })]
);

/**
 * Player progress (XP, lifetime counters, unlocked achievements).
 * Sync rule: "most advanced wins" (see PROGRESS.md).
 */
export const playerProgress = pgTable("player_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  xp: integer("xp").notNull().default(0),
  counters: jsonb("counters").notNull().default({}),
  achievements: text("achievements").array().notNull().default([]),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
