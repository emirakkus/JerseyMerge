"use client";

import { useEffect, useRef } from "react";
import { getJerseySprite } from "@/lib/game/jersey";

interface JerseySpriteProps {
  value: number;
  size: number;
  className?: string;
}

/** Small live-rendered jersey used in the HUD and menus. */
export function JerseySprite({ value, size, className }: JerseySpriteProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const paint = (): void => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      if (canvas.width !== size * dpr) {
        canvas.width = size * dpr;
        canvas.height = size * dpr;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);
      const sprite = getJerseySprite(value);
      ctx.drawImage(sprite, 0, 0, size, size);
    };
    paint();
    // Re-paint once the rounded webfont is ready (sticker numbers).
    if ("fonts" in document) {
      document.fonts.ready.then(paint).catch(() => {
        /* ignore */
      });
    }
  }, [value, size]);

  return (
    <canvas
      ref={ref}
      style={{ width: size, height: size }}
      className={className}
      aria-hidden="true"
    />
  );
}
