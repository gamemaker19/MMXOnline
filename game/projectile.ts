import { Actor, Anim } from "./actor";
import { Damager } from "./damager";
import { Player } from "./player";
import { Point } from "./point";
import { Sprite } from "./sprite";
import { Collider, CollideData } from "./collider";
import { Character } from "./character";
import { Wall } from "./wall";
import { game } from "./game";
import * as Helpers from "./helpers";
import { GameObject } from "./gameObject";
import { Rect } from "./rect";
import { FireWave, Tornado, Torpedo, ShotgunIce, RollingShield, ElectricSpark, Sting, Boomerang, Weapon } from "./weapon";
import { Pickup } from "./pickup";
import { Transform } from "pixi.js";
import { LoopingSound } from "./loopingSound";

export class Projectile extends Actor {

  damager: Damager;
  fadeSprite: Sprite;
  fadeSound: string;
  time: number = 0;
  weapon: Weapon;
  destroyOnCharHit: boolean = true;
  reflectable: boolean = false;
  destroyOnHitTorpedo: boolean = false;
  shouldShieldBlock: boolean = true;

  constructor(weapon: Weapon, pos: Point, xDir: number, speed: number, damage: number, player: Player, sprite: Sprite, flinch: boolean, hitCooldown: number) {
    super(sprite, pos);
    this.weapon = weapon;
    this.vel = new Point(speed * xDir, 0);
    this.useGravity = false;
    this.damager = new Damager(player, damage, flinch, hitCooldown);
    this.xDir = xDir;
    if(game.level.gameMode.isTeamMode) {
      if(player.alliance === 0) {
        this.renderEffects.add("blueshadow");
      }
      else {
        this.renderEffects.add("redshadow");
      }
    }
  }

  getSpeed() {
    return this.vel.magnitude;
  }

  update() {
    super.update();

    this.time += game.deltaTime;
    let leeway = 500;
    if(this.pos.x > game.level.width + leeway || this.pos.x < -leeway || this.pos.y > game.level.height + leeway || this.pos.y < -leeway) {
      this.destroySelf();
    }
  }

  reflect(player: Player) {
    this.playSound("ding");
    this.damager.owner = player;
    this.xDir *= -1;
    if(this instanceof ElectricSparkProj) {
      this.vel.y *= -1;
    }
    this.vel.x *= -1;
  }

  onCollision(other: CollideData) {

    if(this instanceof ShotgunIceProj) {
      if(this.hitChar === other.gameObject) return;
    }

    //Destroy torpedo if it hits something else
    if(this instanceof TorpedoProj && other.gameObject instanceof Projectile && this.damager.owner.alliance !== other.gameObject.damager.owner.alliance) {
      this.destroySelf(this.fadeSprite, this.fadeSound);
      if(other.gameObject.destroyOnHitTorpedo) {
        other.gameObject.destroySelf(other.gameObject.fadeSprite, other.gameObject.fadeSound);
      }
      return;
    }

    //If this is rolling shield, destroy the other projectile
    if((this instanceof RollingShieldProj || this instanceof RollingShieldProjCharged) && other.gameObject instanceof Projectile && this.damager.owner.alliance !== other.gameObject.damager.owner.alliance) {
      if(other.gameObject.shouldShieldBlock) {
        other.gameObject.destroySelf(other.gameObject.fadeSprite, other.gameObject.fadeSound);
      }
      if(this instanceof RollingShieldProjCharged) {
        this.decAmmo(other.gameObject.damager.damage);
      }
    }

    //If this is electric spark, destroy the other projectile
    if((this instanceof ElectricSparkProj || this instanceof ElectricSparkProjCharged) && other.gameObject instanceof RollingShieldProjCharged && this.damager.owner.alliance !== other.gameObject.damager.owner.alliance) {
      other.gameObject.destroySelf(other.gameObject.fadeSprite, other.gameObject.fadeSound);
    }

    let character = other.gameObject;
    if(character instanceof Character && character.player.alliance !== this.damager.owner.alliance && !character.isStingCharged && !character.chargedRollingShieldProj) {
      
      let pos = other.collider.shape.getIntersectPoint(this.pos, this.vel);
      if(pos) this.changePos(pos.clone());
              
      let weakness = false;
      if(this instanceof TorpedoProj && character.player.weapon instanceof Boomerang) weakness = true;
      if(this instanceof StingProj && character.player.weapon instanceof Tornado) weakness = true;
      if(this instanceof RollingShieldProj && character.player.weapon instanceof Torpedo) weakness = true;
      if(this instanceof FireWaveProj && (character.player.weapon instanceof ShotgunIce)) weakness = true;
      if(this instanceof TornadoProj && character.player.weapon instanceof FireWave) weakness = true;
      if(this instanceof BoomerangProj && character.player.weapon instanceof Sting) weakness = true;
      if(this instanceof ElectricSparkProj && character.player.weapon instanceof RollingShield) weakness = true;
      if(this instanceof ShotgunIceProj && character.player.weapon instanceof ElectricSpark) weakness = true;
      if(character.player.isZero) weakness = false;

      this.damager.applyDamage(character, weakness, this.weapon, this, this.constructor.name);
      this.onHitChar(character);
    }
    let wall = other.gameObject;
    if(wall instanceof Wall) {
      this.onHitWall(other);
    }
  }

  onHitChar(character: Character) {
    if(this.destroyOnCharHit) {
      this.destroySelf(this.fadeSprite, this.fadeSound);
    }
  }

  onHitWall(other: CollideData) {

  }

}

export class ZSaberProj extends Projectile {

  constructor(weapon: Weapon, pos: Point, xDir: number, player: Player) {
    super(weapon, pos, xDir, 300, 2, player, game.sprites["zsaber_shot"], false, 0);
    this.fadeSprite = game.sprites["zsaber_shot_fade"];
    this.reflectable = true;
  }

  update() {
    super.update();
    if(this.time > 0.5) {
      this.destroySelf(this.fadeSprite);
    }
  }

}

export class BusterProj extends Projectile {

  constructor(weapon: Weapon, pos: Point, xDir: number, player: Player) {
    super(weapon, pos, xDir, 350, 1, player, game.sprites["buster1"], false, 0);
    this.fadeSprite = game.sprites["buster1_fade"];
    this.reflectable = true;
    this.destroyOnHitTorpedo = true;
  }

}

export class Buster2Proj extends Projectile {

  constructor(weapon: Weapon, pos: Point, xDir: number, player: Player) {
    super(weapon, pos, xDir, 350, 3, player, game.sprites["buster2"], false, 0);
    this.fadeSprite = game.sprites["buster2_fade"];
    this.reflectable = true;
  }

}

export class Buster3Proj extends Projectile {

  constructor(weapon: Weapon, pos: Point, xDir: number, player: Player) {
    super(weapon, pos, xDir, 350, 6, player, game.sprites["buster3"], true, 0);
    this.fadeSprite = game.sprites["buster3_fade"];
    this.reflectable = true;
  }

}

export class Buster4Proj extends Projectile {

  type: number = 0;
  num: number = 0;
  offsetTime: number = 0;
  initY: number = 0;
  
  constructor(weapon: Weapon, pos: Point, xDir: number, player: Player, type: number, num: number, offsetTime: number) {
    super(weapon, pos, xDir, 400, 2, player, game.sprites["buster4"], true, 0.05);
    this.fadeSprite = game.sprites["buster4_fade"];
    this.type = type;
    //this.vel.x = 0;
    this.initY = this.pos.y;
    this.offsetTime = offsetTime;
    this.num = num;
    this.reflectable = true;
  }

  update() {
    super.update();
    this.frameIndex = this.type;
    let y = this.initY + Math.sin(game.time*18 - this.num * 0.5 + this.offsetTime * 2.09) * 15;
    this.changePos(new Point(this.pos.x, y))
  }

}

export class TorpedoProj extends Projectile {

  target: Character;
  smokeTime: number = 0;
  maxSpeed: number = 150;
  constructor(weapon: Weapon, pos: Point, xDir: number, player: Player, type: number, angle?: number) {
    super(weapon, pos, xDir, 150, 2, player, game.sprites[type === 0 ? "torpedo" : "torpedo_charge"], false, 0);
    if(type === 1) {
      this.damager.damage = 3;
      this.damager.flinch = true;
      //this.damager.hitCooldown = 0.1;
      //this.maxSpeed *= 2;
    }
    this.fadeSprite = game.sprites["explosion"];
    this.fadeSound = "explosion";
    this.angle = this.xDir === -1 ? 180 : 0;
    if(angle !== undefined) {
      this.angle = angle + (this.xDir === -1 ? 180 : 0);
    }
    this.destroyOnHitTorpedo = true;
  }

  update() {
    super.update();
    
    if(!game.level.gameObjects.has(this.target)) {
      this.target = undefined;
    }

    if(this.target) {
      if(this.time < 7.5) {
        let dTo = this.pos.directionTo(this.target.centerPos).normalize();
        var destAngle = Math.atan2(dTo.y, dTo.x) * 180 / Math.PI;
        destAngle = Helpers.to360(destAngle);
        this.angle = Helpers.lerpAngle(this.angle, destAngle, game.deltaTime * 3);
      }
      else {
        
      }
    }
    if(this.time >= 0.15) {
      this.target = game.level.getClosestTarget(this.pos, this.damager.owner.alliance, true);
    }
    else if(this.time < 0.15) {
      //this.vel.x += this.xDir * game.deltaTime * 300;
    }

    /*
    this.vel = this.vel.add(new Point(Helpers.cos(this.angle), Helpers.sin(this.angle)).times(this.maxSpeed * 0.25));
    if(this.vel.magnitude > this.maxSpeed) {
      this.vel = this.vel.normalize().times(this.maxSpeed);
    }
    */
    this.vel.x = Helpers.cos(this.angle) * this.maxSpeed;
    this.vel.y = Helpers.sin(this.angle) * this.maxSpeed;

    this.smokeTime += game.deltaTime;
    if(this.smokeTime > 0.2) {
      this.smokeTime = 0;
      new Anim(this.pos, game.sprites["torpedo_smoke"], 1);
    }
    
  }

  renderFromAngle(x: number, y: number) {
    
    let angle = this.angle;
    let xDir = 1;
    let yDir = 1;
    let frameIndex = 0;
    let normAngle = 0;
    if(angle < 90) {
      xDir = 1;
      yDir = -1;
      normAngle = angle;
    }
    if(angle >= 90 && angle < 180) {
      xDir = -1;
      yDir = -1;
      normAngle = 180 - angle;
    }
    else if(angle >= 180 && angle < 270) {
      xDir = -1;
      yDir = 1;
      normAngle = angle - 180;
    }
    else if(angle >= 270 && angle < 360) {
      xDir = 1;
      yDir = 1;
      normAngle = 360 - angle;
    }

    if(normAngle < 18) frameIndex = 0;
    else if(normAngle >= 18 && normAngle < 36) frameIndex = 1;
    else if(normAngle >= 36 && normAngle < 54) frameIndex = 2;
    else if(normAngle >= 54 && normAngle < 72) frameIndex = 3;
    else if(normAngle >= 72 && normAngle < 90) frameIndex = 4;

    this.sprite.draw(frameIndex, this.pos.x + x, this.pos.y + y, xDir, yDir, this.renderEffects, 1, this.palette);
  }
  
}

export class StingProj extends Projectile {

  type: number = 0; //0 = initial proj, 1 = horiz, 2 = up, 3 = down
  origVel: Point;
  constructor(weapon: Weapon, pos: Point, xDir: number, player: Player, type: number, vel?: Point) {
    super(weapon, pos, xDir, 300, 2, player, game.sprites["sting_start"], false, 0);
    if(type === 0) {
      this.origVel = this.vel.clone();
    }
    else if(type === 1) {
      let sprite = game.sprites["sting_flat"];
      this.changeSprite(sprite, false);
      this.reflectable = true;
    }
    else if(type === 2 || type === 3) {
      let sprite = game.sprites["sting_up"];
      if(type === 3) {
        this.yDir = -1;
      }
      this.changeSprite(sprite, false);
      this.reflectable = true;
    }
    if(vel) this.vel = vel;
    this.fadeSprite = game.sprites["buster1_fade"];
    this.type = type;
    this.destroyOnHitTorpedo = true;
  }

  update() {
    super.update();
    if(this.type === 0 && this.time > 0.05) {
      this.vel.x = 0;
    }
    if(this.type === 0) {
      if(this.isAnimOver()) {
        new StingProj(this.weapon, this.pos.addxy(15*this.xDir, 0), this.xDir, this.damager.owner, 1, this.origVel);
        new StingProj(this.weapon, this.pos.addxy(15*this.xDir, -8), this.xDir, this.damager.owner, 2, this.origVel.addxy(0, -150));
        new StingProj(this.weapon, this.pos.addxy(15*this.xDir, 8), this.xDir, this.damager.owner, 3, this.origVel.addxy(0, 150));
        this.destroySelf();
      }
    }
  }

}

export class RollingShieldProj extends Projectile {
 
  constructor(weapon: Weapon, pos: Point, xDir: number, player: Player) {
    super(weapon, pos, xDir, 200, 2, player, game.sprites["rolling_shield"], false, 0);
    this.fadeSprite = game.sprites["explosion"];
    this.fadeSound = "explosion";
    this.useGravity = true;
    this.collider.wallOnly = true;
  }

  update() {
    
    if(!game.level.checkCollisionActor(this, 0, 0)) {
      let collideData = game.level.checkCollisionActor(this, this.xDir, 0, this.vel);
      if(collideData && collideData.hitData && !collideData.hitData.normal.isAngled()) {
        this.vel.x *= -1;
        this.xDir *= -1;
      }
    }
    else {
      //this.vel.x = 0;
    }
    super.update();
    if(this.time > 1.5) {
      this.destroySelf(this.fadeSprite, this.fadeSound);
    }
  }

}

export class RollingShieldProjCharged extends Projectile {
  
  character: Character;
  rollingShieldSound: LoopingSound;
  ammoDecCooldown: number = 0;
  constructor(weapon: Weapon, pos: Point, xDir: number, player: Player) {
    super(weapon, pos, xDir, 200, 2, player, game.sprites["rolling_shield_charge_flash"], false, 0.5);
    this.fadeSprite = game.sprites["rolling_shield_charge_break"];
    this.fadeSound = "hit";
    this.useGravity = false;
    this.character = player.character;
    this.rollingShieldSound = new LoopingSound("rollingShieldCharge", "rollingShieldChargeLoop", this);
    player.character.chargedRollingShieldProj = this;
    this.destroyOnCharHit = false;
    this.shouldShieldBlock = false;
  }

  update() {
    super.update();
    if(this.isAnimOver() && this.sprite.name === "rolling_shield_charge_flash") {
      this.changeSprite(game.sprites["rolling_shield_charge"], true);
    }
    if(!this.character || this.character.dead || !(this.character.player.weapon instanceof RollingShield)) {
      this.destroySelf();
      return;
    }
    if(this.character.player.weapon.ammo === 0) {
      this.destroySelf();
    }
    if(this.rollingShieldSound) {
      this.rollingShieldSound.play();
    }
    this.pos = this.character.getCenterPos();
    if(this.ammoDecCooldown > 0) {
      this.ammoDecCooldown += game.deltaTime;
      if(this.ammoDecCooldown > 0.2) this.ammoDecCooldown = 0;
    }
  }

  onHitChar(character: Character) {
    super.onHitChar(character);
    this.decAmmo();
  }

  decAmmo(amount: number = 1) {
    if(this.ammoDecCooldown === 0) {
      this.ammoDecCooldown = game.deltaTime;
      this.damager.owner.weapon.addAmmo(-amount);
    }
  }

  destroySelf(sprite?: Sprite, fadeSound?: string) {
    super.destroySelf(this.fadeSprite, this.fadeSound);
    if(this.damager.owner.character) this.damager.owner.character.chargedRollingShieldProj = undefined;
    if(this.rollingShieldSound) {
      this.rollingShieldSound.stop();
      this.rollingShieldSound = undefined;
    }
  }

}


export class FireWaveProj extends Projectile {
 
  constructor(weapon: Weapon, pos: Point, xDir: number, player: Player) {
    super(weapon, pos, xDir, 400, 1, player, game.sprites["fire_wave"], false, 0.15);
    this.fadeSprite = game.sprites["fire_wave_fade"];
  }

  update() {
    super.update();
    if(this.time > 0.1) {
      this.destroySelf(this.fadeSprite);
    }
  }

  onHitChar(character: Character) {
  }

}

export class FireWaveProjChargedStart extends Projectile {
  
  constructor(weapon: Weapon, pos: Point, xDir: number, player: Player) {
    super(weapon, pos, xDir, 150, 2, player, game.sprites["fire_wave_charge"], true, 0.222);    
    this.collider.wallOnly = true;
    this.destroyOnCharHit = false;
    this.shouldShieldBlock = false;
  }

  update() {
    super.update();
    if(game.level.isUnderwater(this)) {
      this.destroySelf();
      return;
    }
    this.incPos(new Point(0, game.deltaTime * 100));
    if(this.grounded) {
      this.destroySelf();
      new FireWaveProjCharged(this.weapon, this.pos, this.xDir, this.damager.owner, 0);
      this.playSound("fireWave");
    }
  }

}

export class FireWaveProjCharged extends Projectile {

  spriteMid: Sprite;
  spriteTop: Sprite;
  riseY: number = 0;
  parentTime: number = 0;
  child: FireWaveProjCharged;
  constructor(weapon: Weapon, pos: Point, xDir: number, player: Player, parentTime: number) {
    super(weapon, pos, xDir, 0, 2, player, game.sprites["fire_wave_charge"], true, 0.2);
    this.spriteMid = new Sprite(game.sprites["fire_wave_charge"].spriteJson, true, this.container);
    this.spriteMid.pixiSprite.visible = false;
    this.spriteTop = new Sprite(game.sprites["fire_wave_charge"].spriteJson, true, this.container);
    this.spriteTop.pixiSprite.visible = false;
    this.useGravity = true;
    this.collider.wallOnly = true;
    this.frameSpeed = 0;
    this.parentTime = parentTime;
    this.destroyOnCharHit = false;
    this.shouldShieldBlock = false;
    new Anim(this.pos.clone(), game.sprites["fire_wave_charge_flash"], 1, true);
  }

  render(x: number, y: number) {
    this.sprite.draw(this.frameIndex, this.pos.x + x, this.pos.y + y - this.riseY, this.xDir, this.yDir, this.renderEffects, 1, this.palette);
    this.spriteMid.draw(Math.round(this.frameIndex + (this.sprite.frames.length/3)) % this.sprite.frames.length, this.pos.x + x, this.pos.y + y - 6 - this.riseY, this.xDir, this.yDir, this.renderEffects, 1, this.palette);
    this.spriteTop.draw(Math.round(this.frameIndex + (this.sprite.frames.length/2)) % this.sprite.frames.length, this.pos.x + x, this.pos.y + y - 12 - this.riseY, this.xDir, this.yDir, this.renderEffects, 1, this.palette);
  }

  update() {
    super.update();
    if(game.level.isUnderwater(this)) {
      this.destroySelf();
      return;
    }
    this.frameSpeed = 1;
    if(this.loopCount >= 1) {
      this.spriteTop.pixiSprite.visible = true;
      this.spriteMid.pixiSprite.visible = true;
      this.riseY += (game.deltaTime * 75);
    }
    if(this.loopCount === 3) {
      this.destroySelf();
    }
    if(this.time > 0.2 && !this.child && this.parentTime < 15) {
      this.playSound("fireWave");
      let wall = game.level.checkCollisionActor(this, 16*this.xDir, 0);
      let sign = 1;
      if(wall && wall.gameObject instanceof Wall) {
        sign = -1;
      }
      else {
        let nextPos = this.pos.addxy(this.xDir * 32, 0);
        let ground = game.level.raycast(nextPos, nextPos.addxy(0, 10), ["Wall"]);
        if(!ground) {
          sign = -1;
        }
      }
      this.child = new FireWaveProjCharged(this.weapon, this.pos.addxy(16*this.xDir, 0), this.xDir * sign, this.damager.owner, this.time + this.parentTime);
    }
  }

  destroySelf(sprite?: Sprite, fadeSound?: string) {
    super.destroySelf();
    let newPos = this.pos.addxy(0, - 24-this.riseY);
    new Anim(newPos, game.sprites["fire_wave_charge_fade"], 1, true);
    this.container.removeChild(this.spriteTop.pixiSprite);
    this.spriteTop.pixiSprite.destroy();
    this.container.removeChild(this.spriteMid.pixiSprite);
    this.spriteMid.pixiSprite.destroy();
  }

}

export class TornadoProj extends Projectile {
 
  spriteStart: Sprite;
  spriteMids: Sprite[] = [];
  spriteEnd: Sprite;
  length: number = 1;
  maxSpeed: number = 400;
  constructor(weapon: Weapon, pos: Point, xDir: number, player: Player) {
    super(weapon, pos, xDir, 400, 1, player, game.sprites["tornado_mid"], false, 0.3);
    this.sprite.pixiSprite.visible = false;
    this.spriteStart = new Sprite(game.sprites["tornado_start"].spriteJson, true, this.container);
    for(let i = 0; i < 6; i++) {
      let midSprite = new Sprite(game.sprites["tornado_mid"].spriteJson, true, this.container);
      midSprite.pixiSprite.visible = false;
      this.spriteMids.push(midSprite);
    }
    this.spriteEnd = new Sprite(game.sprites["tornado_end"].spriteJson, true, this.container);
    this.vel.x = 0;
    this.destroyOnCharHit = false;
    this.shouldShieldBlock = false;
  }
  
  render(x: number, y: number) {
    this.spriteStart.draw(this.frameIndex, this.pos.x + x, this.pos.y + y, this.xDir, this.yDir, this.renderEffects, 1, this.palette);
    let i = 0;
    let spriteMidLen = this.spriteMids[0].frames[this.frameIndex].rect.w;
    for(i; i < this.length; i++) {
      this.spriteMids[i].pixiSprite.visible = true;
      this.spriteMids[i].draw(this.frameIndex, this.pos.x + x + (i*this.xDir*spriteMidLen), this.pos.y + y, this.xDir, this.yDir, this.renderEffects, 1, this.palette);
    }
    this.spriteEnd.draw(this.frameIndex, this.pos.x + x + (i*this.xDir*spriteMidLen), this.pos.y + y, this.xDir, this.yDir, this.renderEffects, 1, this.palette);
    if(game.options.showHitboxes && this.collider) {
      Helpers.drawPolygon(game.uiCtx, this.collider.shape.clone(x, y), true, "blue", "", 0, 0.5);
      //Helpers.drawCircle(game.ctx, this.pos.x + x, this.pos.y + y, 1, "red");
    }
  }

  update() {
    super.update();

    let topX = 0;
    let topY = 0;
    
    let spriteMidLen = this.spriteMids[0].frames[this.frameIndex].rect.w;
    let spriteEndLen = this.spriteEnd.frames[this.frameIndex].rect.w;

    let botX = (this.length*spriteMidLen) + spriteEndLen;
    let botY = this.spriteStart.frames[0].rect.h * 2;

    let rect = new Rect(topX, topY, botX, botY);
    this.globalCollider = new Collider(rect.getPoints(), true, this, false, false, 0, new Point(0, 0));

    if(this.time > 0.2) {
      if(this.length < 6) {
        this.length++;
      }
      else {
        this.vel.x = this.maxSpeed * this.xDir;
      }
      this.time = 0;
    }
  }

  onHitChar(character: Character) {
    character.move(new Point(this.maxSpeed * 0.9 * this.xDir, 0));
    if(character.isClimbingLadder()) {
      character.setFall();
    }
  }

  destroySelf(sprite?: Sprite, fadeSound?: string) {
    super.destroySelf(sprite, fadeSound);
    this.container.removeChild(this.spriteStart.pixiSprite);
    this.spriteStart.pixiSprite.destroy();
    this.container.removeChild(this.spriteEnd.pixiSprite);
    this.spriteEnd.pixiSprite.destroy();
    for(let sprite of this.spriteMids) {
      this.container.removeChild(sprite.pixiSprite);
      sprite.pixiSprite.destroy();
    }
  }
}

export class TornadoProjCharged extends Projectile {

  spriteStart: Sprite;
  bodySprites: Sprite[] = [];
  length: number = 1;
  groundY: number = 0;
  maxLength: number = 6;
  maxSpeed: number = 100;
  pieceHeight: number;
  growTime: number = 0;
  maxLengthTime: number = 0;
  constructor(weapon: Weapon, pos: Point, xDir: number, player: Player) {
    super(weapon, pos, xDir, 0, 2, player, game.sprites["tornado_charge"], true, 0.2);
    this.sprite.pixiSprite.visible = false;
    this.spriteStart = new Sprite(game.sprites["tornado_charge"].spriteJson, true, this.container);
    this.pieceHeight = this.spriteStart.frames[0].rect.h;
    this.maxLength = (game.level.height / this.pieceHeight) * 2;
    for(let i = 0; i < this.maxLength; i++) {
      let midSprite = new Sprite(game.sprites["tornado_charge"].spriteJson, true, this.container);
      midSprite.pixiSprite.visible = false;
      this.bodySprites.push(midSprite);
    }
    //this.ground();
    this.destroyOnCharHit = false;
    this.shouldShieldBlock = false;
  }
  
  render(x: number, y: number) {
    this.spriteStart.draw(this.frameIndex, this.pos.x + x, this.pos.y + y, this.xDir, this.yDir, this.renderEffects, 1, this.palette);
    let i = 0;
    let spriteMidHeight = this.bodySprites[0].frames[this.frameIndex].rect.h;
    for(i; i < this.length; i++) {
      this.bodySprites[i].pixiSprite.visible = true;
      this.bodySprites[i].draw(this.frameIndex, this.pos.x + x, this.pos.y + y - (i*spriteMidHeight), this.xDir, this.yDir, this.renderEffects, 1, this.palette);
    }
    if(game.options.showHitboxes && this.collider) {
      Helpers.drawPolygon(game.uiCtx, this.collider.shape.clone(x, y), true, "blue", "", 0, 0.5);
    }
  }

  ground() {
    let ground = game.level.raycast(this.pos.addxy(0, -10), this.pos.addxy(0, game.level.height), ["Wall"]);
    if(ground) {
      this.pos.y = ground.hitData.hitPoint.y;
    }
  }

  update() {
    super.update();

    let spriteMidHeight = this.bodySprites[0].frames[this.frameIndex].rect.h;

    let botX = this.spriteStart.frames[0].rect.w;
    let botY = spriteMidHeight + (this.length*spriteMidHeight);
    
    let rect = new Rect(0, 0, botX, botY);
    this.globalCollider = new Collider(rect.getPoints(), true, this, false, false, 0, new Point(0, 0));

    this.growTime += game.deltaTime;
    if(this.growTime > 0.01) {
      if(this.length < this.maxLength) {
        this.length++;
        this.incPos(new Point(0, this.pieceHeight/2));
      }
      else {
        //this.vel.x = this.maxSpeed * this.xDir;
      }
      this.growTime = 0;
    }

    if(this.length >= this.maxLength) {
      this.maxLengthTime += game.deltaTime;
      if(this.maxLengthTime > 1) {
        this.destroySelf();
      }
    }
    
  }

  onHitChar(character: Character) {
    /*
    character.move(new Point(this.speed * 0.9 * this.xDir, 0));
    if(character.isClimbingLadder()) {
      character.setFall();
    }
    */
  }

  destroySelf(sprite?: Sprite, fadeSound?: string) {
    super.destroySelf(sprite, fadeSound);
    this.container.removeChild(this.spriteStart.pixiSprite);
    this.spriteStart.pixiSprite.destroy();
    for(let sprite of this.bodySprites) {
      this.container.removeChild(sprite.pixiSprite);
      sprite.pixiSprite.destroy();
    }
  }

}

export class ElectricSparkProj extends Projectile {
 
  type: number = 0;
  constructor(weapon: Weapon, pos: Point, xDir: number, player: Player, type: number, vel?: Point) {
    super(weapon, pos, xDir, 150, 2, player, game.sprites["electric_spark"], false, 0);
    this.fadeSprite = game.sprites["electric_spark_fade"];
    //this.fadeSound = "explosion";
    this.type = type;
    if(vel) this.vel = vel;
    this.reflectable = true;
    this.shouldShieldBlock = false;
    this.destroyOnHitTorpedo = true;
  }

  onHitWall(other: CollideData) {
    if(!other.gameObject.collider.isClimbable) return;
    if(this.type === 0) {
      let normal = other.hitData ? other.hitData.normal : undefined;
      if(normal) {
        normal = normal.leftNormal();
      }
      else {
        normal = new Point(0, 1)
      }
      normal.multiply(this.getSpeed() * 3);
      this.destroySelf(this.fadeSprite);
      new ElectricSparkProj(this.weapon, this.pos.clone(), this.xDir, this.damager.owner, 1, normal);
      new ElectricSparkProj(this.weapon, this.pos.clone(), this.xDir, this.damager.owner, 1, normal.times(-1));
    }
  }

}

export class ElectricSparkProjCharged extends Projectile {

  constructor(weapon: Weapon, pos: Point, xDir: number, player: Player) {
    super(weapon, pos, xDir, 450, 4, player, game.sprites["electric_spark_charge"], true, 0.5);
    this.destroyOnCharHit = false;
    this.shouldShieldBlock = false;
  }

}

export class BoomerangProj extends Projectile {
 
  angleDist: number = 0;
  turnDir: number = 1;
  pickup: Pickup;
  maxSpeed: number = 250;
  constructor(weapon: Weapon, pos: Point, xDir: number, player: Player) {
    super(weapon, pos, xDir, 250, 2, player, game.sprites["boomerang"], false, 0);
    //this.fadeSprite = game.sprites["electric_spark_fade"];
    //this.fadeSound = "explosion";
    this.angle = 0;
    if(xDir === -1) this.angle = -180;
    if(!player.character.grounded) {
      this.turnDir = -1;
    }
    this.destroyOnHitTorpedo = true;
  }

  onCollision(other: CollideData) {
    super.onCollision(other);

    if(other.gameObject instanceof Pickup) {
      this.pickup = other.gameObject;
      this.pickup.collider.isTrigger = true;
      this.pickup.useGravity = false;
      this.pickup.pos = this.pos;
    }

    let character = other.gameObject;
    if(this.time > 0.22 && character instanceof Character && character.player === this.damager.owner) {
      if(this.pickup) {
        this.pickup.pos = character.pos;
      }
      this.destroySelf();
      if(character.player.weapon instanceof Boomerang) {
        character.player.weapon.ammo++;
      }
    }
  }

  renderFromAngle(x: number, y: number) {
    this.sprite.draw(this.frameIndex, this.pos.x + x, this.pos.y + y, 1, 1, this.renderEffects, 1, this.palette);
  }

  update() {
    super.update();

    if(this.time > 0.22) {
      if(this.angleDist < 180) {
        let angInc = (-this.xDir * this.turnDir) * game.deltaTime * 300;
        this.angle += angInc;
        this.angleDist += Math.abs(angInc);
        this.vel.x = Helpers.cos(this.angle) * this.maxSpeed;
        this.vel.y = Helpers.sin(this.angle) * this.maxSpeed;
      }
      else if(this.damager.owner.character) {
        let dTo = this.pos.directionTo(this.damager.owner.character.centerPos).normalize();
        var destAngle = Math.atan2(dTo.y, dTo.x) * 180 / Math.PI;
        destAngle = Helpers.to360(destAngle);
        this.angle = Helpers.lerpAngle(this.angle, destAngle, game.deltaTime * 10);
        this.vel.x = Helpers.cos(this.angle) * this.maxSpeed;
        this.vel.y = Helpers.sin(this.angle) * this.maxSpeed;
      }
      else {
        this.destroySelf();
      }
    }
  }

}

export class BoomerangProjCharged extends Projectile {
 
  angleDist: number = 0;
  turnDir: number = 1;
  pickup: Pickup;
  maxSpeed: number = 400;
  type: number = 0;
  constructor(weapon: Weapon, pos: Point, xDir: number, player: Player, angle: number, type: number) {
    super(weapon, pos, xDir, 400, 6, player, game.sprites[type === 0 ? "boomerang_charge2" : "boomerang_charge"], true, 0);
    this.angle = angle;
    this.type = type;
    this.shouldShieldBlock = false;
  }

  renderFromAngle(x: number, y: number) {
    this.sprite.draw(this.frameIndex, this.pos.x + x, this.pos.y + y, 1, 1, this.renderEffects, 1, this.palette);
  }

  update() {
    super.update();
    this.vel.x = Helpers.cos(this.angle) * this.maxSpeed;
    this.vel.y = Helpers.sin(this.angle) * this.maxSpeed;
    if(this.type === 0) {
      if(this.time > 0.1 && this.time < 0.72) {
        this.angle += game.deltaTime * 500;
      }
    }
    else {
      if(this.time > 0.15 && this.time < 0.77) {
        this.angle += game.deltaTime * 500;
      }
    }
  }

}
export class ShotgunIceProj extends Projectile {
 
  type: number = 0;
  sparkleTime: number = 0;
  hitChar: Character;
  maxSpeed: number = 400;
  constructor(weapon: Weapon, pos: Point, xDir: number, player: Player, type: number, vel?: Point, hitChar?: Character) {
    super(weapon, pos, xDir, 400, 2, player, game.sprites["shotgun_ice"], false, 0);
    this.hitChar = hitChar;
    if(type === 1) {
      this.changeSprite(game.sprites["shotgun_ice_piece"], true);
    }

    this.fadeSprite = game.sprites["buster1_fade"];
    this.type = type;
    if(vel) this.vel = vel;
    this.reflectable = true;
    //this.fadeSound = "explosion";
    this.destroyOnHitTorpedo = true;
  }

  update() {
    super.update();
    
    this.sparkleTime += game.deltaTime;
    if(this.sparkleTime > 0.05) {
      this.sparkleTime = 0;
      new Anim(this.pos, game.sprites["shotgun_ice_sparkles"], 1);
    }
    
  }

  onHit(other: GameObject) {
    if(other === this.hitChar) return;  //Prevent meatshot if ice went deep inside
    if(this.type === 0) {
      this.destroySelf();
      let char: Character = undefined;
      if(other instanceof Character) char = other;
      new ShotgunIceProj(this.weapon, this.pos.clone(), this.xDir, this.damager.owner, 1, new Point(-this.vel.x, -this.maxSpeed), char);
      new ShotgunIceProj(this.weapon, this.pos.clone(), this.xDir, this.damager.owner, 1, new Point(-this.vel.x, -this.maxSpeed*0.5), char);
      new ShotgunIceProj(this.weapon, this.pos.clone(), this.xDir, this.damager.owner, 1, new Point(-this.vel.x, 0 * 3), char);
      new ShotgunIceProj(this.weapon, this.pos.clone(), this.xDir, this.damager.owner, 1, new Point(-this.vel.x, this.maxSpeed*0.5), char);
      new ShotgunIceProj(this.weapon, this.pos.clone(), this.xDir, this.damager.owner, 1, new Point(-this.vel.x, this.maxSpeed), char);
    }
  }

  onHitWall(other: CollideData) {
    if(!other.gameObject.collider.isClimbable) return;
    this.onHit(other.gameObject);
  }

  onHitChar(character: Character) {
    this.onHit(character);
    this.destroySelf();
  }

}

export class ShotgunIceProjCharged extends Projectile {
 
  constructor(weapon: Weapon, pos: Point, xDir: number, player: Player, type: number) {
    super(weapon, pos, xDir, 150, 1, player, game.sprites[type === 0 ? "shotgun_ice_charge_wind" : "shotgun_ice_charge_wind2"], false, 0.5);
    this.shouldShieldBlock = false;
  }

  update() {
    super.update();
    if(this.time > 0.5) {
      this.destroySelf();
    }
  }

  onHitChar(character: Character) {
    if(character.freezeTime === 0) {
      character.freezeTime = 5;
    }
  }

}

export class ShotgunIceProjSled extends Projectile {
 
  character: Character;
  constructor(weapon: Weapon, pos: Point, xDir: number, player: Player) {
    super(weapon, pos, xDir, 0, 2, player, game.sprites["shotgun_ice_charge"], false, 1);
    this.useGravity = true;
    this.fadeSound = "iceBreak";
    this.shouldShieldBlock = false;
    //this.collider.wallOnly = true;
  }

  update() {
    super.update();
    if(this.time > 3) {
      this.vel.x = this.xDir * 175;
      this.damager.damage = 4;
      this.damager.flinch = true;
      let hit = game.level.checkCollisionActor(this, this.xDir, 0);
      if(hit && hit.gameObject instanceof Wall) {
        this.destroySelf();
        return;
      }
    }
    
    let hitAbove = game.level.checkCollisionActor(this, 0, -1);
    if(hitAbove && hitAbove.gameObject instanceof Character && hitAbove.gameObject.player === this.damager.owner) {
      this.character = hitAbove.gameObject;
      this.character.iceSled = this;
    }
    
    if(this.character) {
      this.character.pos = this.pos.addxy(0, -16.1);
      //this.changeSpriteFromName("idle", true);
    }
    if(this.character && (this.character.charState.constructor.name === "Hurt" || this.character.charState.constructor.name === "Die" || this.character.charState.constructor.name === "Jump")) {
      this.character = undefined;
    }
  }

  preUpdate() {
    super.preUpdate();
    
  }

  onHictChar(character: Character) {
    this.destroySelf();
  }

  destroySelf() {
    super.destroySelf(this.fadeSprite, this.fadeSound);
    if(game.level.gameObjects.has(this.character)) {
      this.character.iceSled = undefined;
    }
    this.breakFreeze();
  }

}
