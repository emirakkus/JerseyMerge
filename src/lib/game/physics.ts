/** Matter.js world construction: engine, arena walls and jersey bodies. */

import Matter from "matter-js";
import { BOARD_H, BOARD_W } from "./constants";

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
    restitution: 0.25,
    friction: 0.5,
    label: "wall",
  };

  const left = Matter.Bodies.rectangle(-thickness / 2, BOARD_H / 2, thickness, BOARD_H * 4, wallOpts);
  const right = Matter.Bodies.rectangle(BOARD_W + thickness / 2, BOARD_H / 2, thickness, BOARD_H * 4, wallOpts);
  const floor = Matter.Bodies.rectangle(BOARD_W / 2, BOARD_H + thickness / 2, BOARD_W * 4, thickness, wallOpts);

  Matter.Composite.add(engine.world, [left, right, floor]);
  return { engine, walls: [left, right, floor] };
}

export function createJerseyBody(x: number, y: number, radius: number): Matter.Body {
  return Matter.Bodies.circle(x, y, radius, {
    label: "jersey",
    friction: 0.14,
    frictionStatic: 0.3,
    frictionAir: 0.008,
    restitution: 0.34,
    density: 0.0016,
    sleepThreshold: 40,
  });
}
