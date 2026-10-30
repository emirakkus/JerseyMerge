/** Matter.js world construction: engine, arena walls and jersey bodies. */

import Matter from "matter-js";
import { BOARD_H, BOARD_W, bowlFloorY } from "./constants";

export interface WorldSetup {
  engine: Matter.Engine;
  walls: Matter.Body[];
}

export function createWorld(): WorldSetup {
  const engine = Matter.Engine.create();
  engine.enableSleeping = true;
  engine.positionIterations = 10;
  engine.velocityIterations = 8;

  const thickness = 80;
  const wallOpts: Matter.IChamferableBodyDefinition = {
    isStatic: true,
    restitution: 0.08,
    friction: 0.5,
    label: "wall",
  };

  const left = Matter.Bodies.rectangle(-thickness / 2, BOARD_H / 2, thickness, BOARD_H * 4, wallOpts);
  const right = Matter.Bodies.rectangle(BOARD_W + thickness / 2, BOARD_H / 2, thickness, BOARD_H * 4, wallOpts);
  const bowl: Matter.Body[] = [];
  const segments = 28;
  for (let i = 0; i < segments; i += 1) {
    const x1 = (BOARD_W * i) / segments;
    const x2 = (BOARD_W * (i + 1)) / segments;
    const y1 = bowlFloorY(x1);
    const y2 = bowlFloorY(x2);
    const dx = x2 - x1;
    const dy = y2 - y1;
    const angle = Math.atan2(dy, dx);
    const thickness = 22;
    // Place the top face on the visible arc. Centering this thick body on the
    // arc lifts its collision surface by half its thickness and makes jerseys
    // appear to hover above the floor.
    const centerX = (x1 + x2) / 2 - Math.sin(angle) * thickness / 2;
    const centerY = (y1 + y2) / 2 + Math.cos(angle) * thickness / 2;
    const segment = Matter.Bodies.rectangle(centerX, centerY, Math.hypot(dx, dy) + 3, thickness, wallOpts);
    Matter.Body.setAngle(segment, angle);
    bowl.push(segment);
  }

  const walls = [left, right, ...bowl];
  Matter.Composite.add(engine.world, walls);
  return { engine, walls };
}

export function createJerseyBody(x: number, y: number, radius: number): Matter.Body {
  return Matter.Bodies.circle(x, y, radius, {
    label: "jersey",
    friction: 0.14,
    frictionStatic: 0.3,
    frictionAir: 0.008,
    restitution: 0.08,
    density: 0.0016,
    sleepThreshold: 40,
  });
}
