"use client";

export type MascotMood = "happy" | "cheer" | "worried" | "sleep" | "sad";

interface MascotProps {
  mood: MascotMood;
}

/** Cheerful ball mascot that reacts to the match (decorative, non-interactive). */
export function Mascot({ mood }: MascotProps) {
  return (
    <div
      className={`pointer-events-none absolute right-2 top-2 z-[5] ${mood === "cheer" ? "mascot-bounce" : ""}`}
      aria-hidden="true"
    >
      <svg width="46" height="46" viewBox="0 0 48 48">
        <circle cx="24" cy="25" r="19" fill="#ffffff" stroke="#101d42" strokeWidth="2.5" />
        <path d="M24 12l7 5-2.7 8h-8.6L17 17z" fill="#101d42" />
        <path
          d="M24 12V4.5M31 17l7.5-2.5M28.3 25l5 5.5M19.7 25l-5 5.5M17 17l-7.5-2.5"
          stroke="#101d42"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        {mood === "sleep" ? (
          <g>
            <path d="M15.5 30h4M28.5 30h4" stroke="#101d42" strokeWidth="2" strokeLinecap="round" />
            <path d="M20 36.5c2 1.6 6 1.6 8 0" fill="none" stroke="#101d42" strokeWidth="2" strokeLinecap="round" />
            <text x="38" y="14" fontSize="9" fontWeight="800" fill="#3b5bdb" fontFamily="inherit">
              z
            </text>
          </g>
        ) : mood === "worried" ? (
          <g>
            <circle cx="17.5" cy="29.5" r="1.9" fill="#101d42" />
            <circle cx="30.5" cy="29.5" r="1.9" fill="#101d42" />
            <path d="M14.5 26.5l4-1.6M33.5 26.5l-4-1.6" stroke="#101d42" strokeWidth="1.8" strokeLinecap="round" />
            <ellipse cx="24" cy="36.5" rx="2.6" ry="3.2" fill="#101d42" />
          </g>
        ) : mood === "sad" ? (
          <g>
            <circle cx="17.5" cy="30" r="1.9" fill="#101d42" />
            <circle cx="30.5" cy="30" r="1.9" fill="#101d42" />
            <path d="M19 38.5c2-1.8 8-1.8 10 0" fill="none" stroke="#101d42" strokeWidth="2" strokeLinecap="round" />
          </g>
        ) : mood === "cheer" ? (
          <g>
            <path d="M17.5 27l1 2.2 2.3.2-1.7 1.5.5 2.3-2.1-1.2-2.1 1.2.5-2.3-1.7-1.5 2.3-.2z" fill="#f59e0b" />
            <path d="M30.5 27l1 2.2 2.3.2-1.7 1.5.5 2.3-2.1-1.2-2.1 1.2.5-2.3-1.7-1.5 2.3-.2z" fill="#f59e0b" />
            <path d="M18.5 34c1.5 3.4 9.5 3.4 11 0z" fill="#101d42" />
            <ellipse cx="13.5" cy="34" rx="2" ry="1.3" fill="#ffb3c1" opacity="0.8" />
            <ellipse cx="34.5" cy="34" rx="2" ry="1.3" fill="#ffb3c1" opacity="0.8" />
          </g>
        ) : (
          <g>
            <circle cx="17.5" cy="29.5" r="1.9" fill="#101d42" />
            <circle cx="30.5" cy="29.5" r="1.9" fill="#101d42" />
            <path d="M19.5 34.5c2 2 7 2 9 0" fill="none" stroke="#101d42" strokeWidth="2" strokeLinecap="round" />
            <ellipse cx="13.5" cy="33" rx="1.8" ry="1.1" fill="#ffb3c1" opacity="0.7" />
            <ellipse cx="34.5" cy="33" rx="1.8" ry="1.1" fill="#ffb3c1" opacity="0.7" />
          </g>
        )}
      </svg>
    </div>
  );
}
