"use client";

import { JerseySprite } from "./JerseySprite";

const TITLE = "JERSEY MERGE";

const JERSEYS = [
  { value: 2, size: 40 },
  { value: 4, size: 48 },
  { value: 8, size: 56 },
  { value: 16, size: 64 },
];

/** Branded loading / opening animation shown once per page load. */
export function SplashScreen() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 overflow-hidden bg-gradient-to-b from-[#0F1B3D] via-[#191A4E] to-[#2A1B5C]">
      <div className="splash-stripes absolute inset-0" aria-hidden="true" />

      <div className="relative flex items-end gap-2" aria-hidden="true">
        {JERSEYS.map((j, i) => (
          <span key={j.value} className="splash-drop" style={{ animationDelay: `${0.1 + i * 0.12}s` }}>
            <JerseySprite value={j.value} size={j.size} />
          </span>
        ))}
      </div>

      <h1
        className="relative flex overflow-hidden whitespace-nowrap font-display text-[clamp(1.9rem,8.5vw,2.9rem)] leading-none tracking-tight text-white"
        aria-label={TITLE}
      >
        {TITLE.split("").map((ch, i) => (
          <span
            key={`${ch}-${i}`}
            className="splash-letter"
            style={{ animationDelay: `${0.55 + i * 0.04}s` }}
            aria-hidden="true"
          >
            {ch === " " ? "\u00A0" : ch}
          </span>
        ))}
      </h1>

      <p
        className="splash-fade relative m-0 text-[14px] font-bold text-[#9FB0E8]"
        style={{ animationDelay: "1.05s" }}
      >
        Warming up the pitch…
      </p>

      <div
        className="splash-fade relative h-1.5 w-52 overflow-hidden rounded-full bg-white/20"
        style={{ animationDelay: "1.15s" }}
      >
        <div className="splash-bar-fill h-full rounded-full bg-[#FFC93C]" />
      </div>
    </div>
  );
}
