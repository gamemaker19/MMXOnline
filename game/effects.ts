import { Point } from "./point";
import { game } from "./game";
import * as Helpers from "./helpers";
import { Actor } from "./actor";
import { Sprite } from "./sprite";

class ChargeParticle extends Actor {
  
  time: number;
  constructor(pos: Point, time: number) {
    super(game.sprites["charge_part_1"], new Point(pos.x, pos.y), true);
    this.time = time;
  }

  update() {
    super.update();
  }
}

export class ChargeEffect {
  
  origPoints: Point[];
  chargeParts: ChargeParticle[];
  active: boolean = false;

  constructor() {
    this.chargeParts = [];
    let radius = 24;

    let angle = 0;
    let point1 = new Point(Helpers.sin(angle) * radius, Helpers.cos(angle) * radius); angle += 45;
    let point2 = new Point(Helpers.sin(angle) * radius, Helpers.cos(angle) * radius); angle += 45;
    let point3 = new Point(Helpers.sin(angle) * radius, Helpers.cos(angle) * radius); angle += 45;
    let point4 = new Point(Helpers.sin(angle) * radius, Helpers.cos(angle) * radius); angle += 45;
    let point5 = new Point(Helpers.sin(angle) * radius, Helpers.cos(angle) * radius); angle += 45;
    let point6 = new Point(Helpers.sin(angle) * radius, Helpers.cos(angle) * radius); angle += 45;
    let point7 = new Point(Helpers.sin(angle) * radius, Helpers.cos(angle) * radius); angle += 45;
    let point8 = new Point(Helpers.sin(angle) * radius, Helpers.cos(angle) * radius); angle += 45;

    this.origPoints = [
      point1, point2, point3, point4, point5, point6, point7, point8
    ];

    this.chargeParts = [
      new ChargeParticle(point1.clone(), 0),
      new ChargeParticle(point2.clone(), 3),
      new ChargeParticle(point3.clone(), 0),
      new ChargeParticle(point4.clone(), 1.5),
      new ChargeParticle(point5.clone(), -1.5),
      new ChargeParticle(point6.clone(), -3),
      new ChargeParticle(point7.clone(), -1.5),
      new ChargeParticle(point8.clone(), -1.5)
    ];
  }

  stop() {
    this.active = false;
  }

  update(centerPos: Point, chargeLevel: number) {
    this.active = true;
    for(let i = 0; i < this.chargeParts.length; i++) {
      let part = this.chargeParts[i];
      if(part.time > 0) {
        part.pos.x = Helpers.moveTo(part.pos.x, 0, game.deltaTime * 70);
        part.pos.y = Helpers.moveTo(part.pos.y, 0, game.deltaTime * 70);
      }
      let chargePart = game.sprites["charge_part_" + String(chargeLevel)];
      part.changeSprite(chargePart, true);
      part.time += game.deltaTime*20;
      if(part.time > 3) {
        part.time = -3;
        part.pos.x = this.origPoints[i].x;
        part.pos.y = this.origPoints[i].y;
      }
    }

  }

  render(centerPos: Point, chargeLevel: number) {
    for(let i = 0; i < this.chargeParts.length; i++) {
      let part = this.chargeParts[i];
      if(!this.active) {
        part.sprite.pixiSprite.visible = false;
      }
      else if(part.time > 0) {
        part.sprite.pixiSprite.visible = true;
        part.sprite.draw(Math.round(part.time), centerPos.x + part.pos.x, centerPos.y + part.pos.y);
      }
      else {
        part.sprite.pixiSprite.visible = false;
      }
    }
  }

  destroy() {
    for(let chargePart of this.chargeParts) {
      chargePart.destroySelf(undefined, undefined);
    }
  }

}

export class DieEffectParticles {

  centerPos: Point;
  time: number = 0;
  ang: number = 0;
  alpha: number = 1;
  dieParts: Actor[] = [];
  destroyed: boolean = false;

  constructor(centerPos: Point, isZero: boolean) {
    this.centerPos = centerPos;
    for(let i = this.ang; i < this.ang + 360; i += 22.5) {
      let x = this.centerPos.x + Helpers.cos(i) * this.time * 150;
      let y = this.centerPos.y + Helpers.sin(i) * this.time * 150;
      let diePartSprite = isZero ? "die_particle_zero" : "die_particle";
      let diePart = new Actor(game.sprites[diePartSprite], new Point(centerPos.x, centerPos.y), true, game.level.foregroundContainer);
      this.dieParts.push(diePart);
    }
  }

  render(offsetX: number, offsetY: number) {
    let counter = 0;
    for(let i = this.ang; i < this.ang + 360; i += 22.5) {
      let diePart = this.dieParts[counter];
      if(!diePart) continue;
      let x = this.centerPos.x + Helpers.cos(i) * this.time * 150;
      let y = this.centerPos.y + Helpers.sin(i) * this.time * 150;
      diePart.sprite.draw(Math.round(this.time * 20) % diePart.sprite.frames.length, x + offsetX, y + offsetY, 1, 1, undefined, this.alpha);
      counter++;
    }
    
  }

  update() {
    this.time += game.deltaTime;
    this.alpha = Helpers.clamp01(1 - this.time*0.5);
    this.ang += game.deltaTime * 100;

    if(this.alpha <= 0) {
      this.destroy();
    }
  }

  destroy() {
    for(let diePart of this.dieParts) {
      diePart.destroySelf();
    }
    this.destroyed = true;
  }

}

export class Effect {

  pos: Point;
  constructor(pos: Point) {
    this.pos = pos;
    game.level.addEffect(this);
  }

  update() {

  }

  render(offsetX: number, offsetY: number) {

  }

  destroySelf() {
    //@ts-ignore
    _.remove(game.level.effects, this);
  }

}

export class DieEffect extends Effect {

  timer: number = 100;
  spawnCount: number = 0;
  dieEffects: DieEffectParticles[] = [];
  repeatCount: number = 0;
  isZero: boolean;

  constructor(centerPos: Point, isZero: boolean) {
    super(centerPos);
    this.isZero = isZero;
  }

  update() {
    super.update();
    let repeat = 1;
    let repeatPeriod = 0.5;
    this.timer += game.deltaTime;
    if(this.timer > repeatPeriod) {
      this.timer = 0;
      this.repeatCount++;
      if(this.repeatCount > repeat) {
      }
      else {
        let dieEffect = new DieEffectParticles(this.pos, this.isZero);
        this.dieEffects.push(dieEffect);
      }
    }
    for(let dieEffect of this.dieEffects) {
      if(!dieEffect.destroyed)
        dieEffect.update();
    }
    if(this.dieEffects[0].destroyed)
      this.destroySelf();
  }

  render(offsetX: number, offsetY: number) {
    for(let dieEffect of this.dieEffects) {
      if(!dieEffect.destroyed)
        dieEffect.render(offsetX, offsetY);
    }
  }

}