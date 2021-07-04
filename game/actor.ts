import { Sprite } from "./sprite";
import { Point } from "./point";
import { Collider, CollideData } from "./collider";
import { game } from "./game";
import * as Helpers from "./helpers";
import { Palette } from "./color";
import { Shape } from "./shape";
import { Character } from "./character";
import { RollingShield } from "./weapon";
import { RollingShieldProj } from "./projectile";
import { Rect } from "./rect";

//Anything that has: a position, rotation, name and sprite. Can also have an optional collider
//This MUST have a sprite. There is too much maintenance effort to support a sprite-less actor class
export class Actor {

  sprite: Sprite; //Current sprite
  frameIndex: number; //Current frame index of sprite
  frameSpeed: number; //Multiplier for how fast frameIndex gets incremented. defaults to 1
  frameTime: number;  //The current time of the frame
  animTime: number = 0; //The current time of the whole sprite animation
  loopCount: number = 0;
  xDir: number; //-1 or 1
  yDir: number;
  pos: Point; //Current location
  vel: Point;
  _angle: number;
  useGravity: boolean;
  grounded: boolean;
  name: string;
  globalCollider: Collider; //If no collider data found in sprite, fall back to this one
  collidedInFrame: Set<Collider>;
  palette: Palette;
  renderEffectTime: number = 0;
  renderEffects: Set<string> = new Set();
  container: PIXI.Container;
  _zIndex: number = 0;
  isVisible: boolean = true;

  constructor(sprite: Sprite, pos: Point, dontAddToLevel?: boolean, container?: PIXI.Container) {
    if(container) {
      this.container = container;
    }
    else {
      this.container = game.level.gameContainer;
    }

    this.pos = pos;
    this.vel = new Point(0, 0);
    this.useGravity = true;
    this.frameIndex = 0;
    this.frameSpeed = 1;
    this.frameTime = 0;
    this.name = "";
    this.xDir = 1;
    this.yDir = 1;
    this.grounded = false;
    this.collidedInFrame = new Set<Collider>();
    this._zIndex = ++game.level.zDefault;
    this.changeSprite(sprite, true);

    if(!dontAddToLevel) {
      game.level.addGameObject(this);
    }
  }

  changeSprite(sprite: Sprite, resetFrame: boolean) {
    if(!sprite) return;

    if(this.sprite) {
      if(this.sprite.name === sprite.name) return;
      this.sprite.free();
    }

    this.sprite = <Sprite>game.level.spritePool.get(sprite.name);
    if(!this.sprite) {
      let newSprite = new Sprite(sprite.spriteJson, true, this.container);
      game.level.spritePool.add(sprite.name, newSprite);
      this.sprite = newSprite;
    }
    //@ts-ignore
    this.sprite.pixiSprite.zIndex = this._zIndex;
    
    //this.sprite.pixiSprite.visible = false;

    for(let hitbox of this.sprite.hitboxes) {
      hitbox.actor = this;
    }
    for(let frame of this.sprite.frames) {
      for(let hitbox of frame.hitboxes) {
        hitbox.actor = this;
      }
    }
    
    if(resetFrame) {
      this.frameIndex = 0;
      this.frameTime = 0;
      this.animTime = 0;
    }
    else if(this.frameIndex >= this.sprite.frames.length) {
      this.frameIndex = 0;
      this.frameTime = 0;
      this.animTime = 0;
    }
  }

  get angle() {
    return this._angle;
  }

  get zIndex() {
    return this._zIndex;
  }

  setzIndex(index: number) {
    this._zIndex = index;
    //@ts-ignore
    this.sprite.pixiSprite.zIndex = this._zIndex;
  }

  set angle(value: number) {
    this._angle = value;
    if(this._angle < 0) this._angle += 360;
    if(this._angle > 360) this._angle -= 360;
  }

  get currentFrame() {
    return this.sprite.frames[this.frameIndex];
  }

  get framePercent() {
    let entireDuration = 0;
    for(let frame of this.sprite.frames) {
      entireDuration += frame.duration;
    }
    return this.animTime / entireDuration;
  }

  update() {
    
    this.renderEffectTime = Helpers.clampMin0(this.renderEffectTime - game.deltaTime);
    if(this.renderEffectTime <= 0) {
      this.renderEffects.delete("hit");
      this.renderEffects.delete("flash");
    }

    this.frameTime += game.deltaTime * this.frameSpeed;
    this.animTime += game.deltaTime * this.frameSpeed;
    if(this.frameTime >= this.currentFrame.duration) {
      let onceEnd = this.sprite.wrapMode === "once" && this.frameIndex === this.sprite.frames.length - 1;
      if(!onceEnd) {
        this.frameTime = this.sprite.loopStartFrame;
        this.frameIndex++;
        if(this.frameIndex >= this.sprite.frames.length) {
          this.frameIndex = 0;
          this.animTime = 0;
          this.loopCount++;
        }
      }
    }

    if(this.useGravity && !this.grounded) {
      let grav = game.level.gravity;
      if(game.level.isUnderwater(this)) grav *= 0.5;
      this.vel.y += grav * game.deltaTime;
      if(this.vel.y > 1000) {
        this.vel.y = 1000;
      }
    }

    if(this.constructor.name === "Character")
      this.move(this.vel, true, false, true);
    else
      this.move(this.vel, true, true, true);
      
    if(this.collider && !this.collider.isTrigger) {

      let yDist = 1;
      //If already grounded, snap to ground further
      if(this.grounded) {
        yDist = 300 * game.deltaTime;
      }

      let collideData = game.level.checkCollisionActor(this, 0, yDist);
      if(collideData && this.vel.y >= 0) {
        //Determine if grounded, and
        //snap to ground if close. Use x-vel to determine amount to snap. If it's 0, use default value
        this.grounded = true;
        this.vel.y = 0;
        let yVel = new Point(0, yDist);
        let mtv = game.level.getMtvDir(this, 0, yDist, yVel, false, [collideData]);
        if(mtv) {
          if(mtv.magnitude > 30) {
            let shape1 = this.collider.shape.clone(0, yDist);
            let shape2 = collideData.collider.shape;
            //throw "MTV too big";
          }
          else {
            this.incPos(yVel);
            this.incPos(mtv.unitInc(0.01));
          }
        }
      }
      else {
        this.grounded = false;
      }
    }

    //Process trigger events. Must loop thru all collisions in this case.
    let triggerList = game.level.getTriggerList(this, 0, 0);
    for(let trigger of triggerList) {
      this.registerCollision(trigger);
    }

  }

  incPos(amount: Point) {
    if(this.collider) game.level.removeFromGridFast(this);
    this.pos.inc(amount);
    if(this.collider) game.level.addGameObjectToGrid(this);
  }

  changePos(newPos: Point) {
    if(this.collider) game.level.removeFromGridFast(this);
    this.pos = newPos;
    if(this.collider) game.level.addGameObjectToGrid(this);
  }

  preUpdate() {
    this.collidedInFrame.clear();
  }

  sweepTest(offset: Point) {
    let inc: Point = offset.clone();
    let collideData = game.level.checkCollisionActor(this, inc.x, inc.y);
    if(collideData) {
      return collideData;
    }
    return undefined;
  }

  move(amount: Point, useDeltaTime: boolean = true, pushIncline: boolean = true, snapInclineGravity: boolean = true) {

    let times = useDeltaTime ? game.deltaTime : 1;

    //No collider: just move
    if(!this.collider) {
      this.pos.inc(amount.times(times));
    }
    //Regular collider: need to detect collision incrementally and stop moving past a collider if that's the case
    else {

      this.freeFromCollision();

      let inc: Point = amount.clone();
      let incAmount = inc.multiply(times);

      let mtv = game.level.getMtvDir(this, incAmount.x, incAmount.y, incAmount, pushIncline);
      if(mtv && mtv.magnitude > 10) mtv = game.level.getMtvDir(this, incAmount.x, incAmount.y, incAmount, false);
      this.incPos(incAmount);
      if(mtv) {
        /*
        if(mtv.magnitude > 5) {
          console.log(mtv);
          mtv = game.level.getMtvDir(this, incAmount.x, incAmount.y, inc, pushIncline);
        }
        */
        this.incPos(mtv.unitInc(0.01));
      }

      /*
      //Debugging code
      let hit = game.level.checkCollisionActor(this, 0, 0);
      if(this.isRollingShield() && hit) {
        let shape1 = this.collider.shape.clone(-incAmount.x, -incAmount.y);
        let shape2 = hit.collider.shape;
        console.log("Bad MTV in Move()");
      }
      */

      //This shouldn't be needed, but sometimes getMtvDir doesn't free properly or isn't returned
      this.freeFromCollision();

    }
  }

  freeFromCollision() {
    //Already were colliding in first place: free with path of least resistance
    let currentCollideDatas = game.level.getAllCollideDatas(this, 0, 0, undefined);
    for(let collideData of currentCollideDatas) {
      //console.log("ALREADY COLLIDING")
      let freeVec = this.collider.shape.getMinTransVector(collideData.collider.shape);
      if(this.constructor.name === "Character" && freeVec.magnitude > 10) {
        return;
      }
      this.incPos(freeVec.unitInc(0.01));
    }
  }

  isRollingShield() {
    return this.constructor.name === "RollingShieldProj";
  }

  render(x: number, y: number) {
    //console.log(this.pos.x + "," + this.pos.y);

    let offsetX = this.xDir * this.currentFrame.offset.x;
    let offsetY = this.yDir * this.currentFrame.offset.y;

    if(this.sprite.name !== "mmx_win" && this.currentFrame.offset.x !== 0 && this.currentFrame.rect.w % 2 !== 0) {
      offsetX += 0.5 * this.xDir;
    }

    let drawX = this.pos.x + x + offsetX;
    let drawY = this.pos.y + y + offsetY;
    
    if(this.angle === undefined) {
      this.sprite.draw(this.frameIndex, drawX, drawY, this.xDir, this.yDir, this.renderEffects, 1, this.palette);
    }
    else {
      this.renderFromAngle(x, y);
    }
    
    if(game.options.showHitboxes && this.collider) {
      let allColliders = this.getAllColliders();
      for(let collider of allColliders) {
        Helpers.drawPolygon(game.uiCtx, collider.shape, true, "blue", "", 0, 0.5);
      }
      Helpers.drawCircle(game.uiCtx, drawX, drawY, 1, "red");
    }
    
    this.sprite.pixiSprite.visible = this.isVisible;
    
    let alignOffset = this.sprite.getAlignOffset(this.frameIndex, this.xDir, this.yDir);
    let rx = this.pos.x + offsetX + alignOffset.x;
    let ry = this.pos.y + offsetY + alignOffset.y;
    let rect = new Rect(rx, ry, rx + this.currentFrame.rect.w, ry + this.currentFrame.rect.h);
    let camRect = new Rect(game.level.camX, game.level.camY, game.level.camX + game.defaultCanvasWidth, game.level.camY + game.defaultCanvasHeight);
    if(!rect.overlaps(camRect)) {
      this.sprite.pixiSprite.renderable = false;
    }
    else {
      this.sprite.pixiSprite.renderable = true;
    }
  }

  renderFromAngle(x: number, y: number) {
    this.sprite.draw(0, this.pos.x + x, this.pos.y + y, 1, 1, this.renderEffects, 1, this.palette);
  }

  registerCollision(other: CollideData) {
    if(!this.collidedInFrame.has(other.collider)) {
      this.collidedInFrame.add(other.collider);
      this.onCollision(other);
    }
  }

  onCollision(other: CollideData) {
  }

  get collider(): Collider {
    if(this.globalCollider) {
      return this.globalCollider;
    }
    if(this.sprite.hitboxes.length > 0) {
      return this.sprite.hitboxes[0];
    }
  }

  getAllColliders(): Collider[] {
    let colliders = [];
    if(this.globalCollider) colliders.push(this.globalCollider);
    for(let collider of this.sprite.hitboxes) {
      //colliders.push(collider);
    }
    for(let collider of this.currentFrame.hitboxes) {
      colliders.push(collider);
    }
    return colliders;
  }

  hasCollisionBox() {
    if(this.sprite.hitboxes.length === 0) return false;
    if(this.sprite.hitboxes[0].isTrigger) return false;
    return true;
  }

  isAnimOver() {
    return this.frameIndex === this.sprite.frames.length - 1 && this.frameTime >= this.currentFrame.duration;
  }

  //Optionally take in a sprite to draw when destroyed
  destroySelf(sprite?: Sprite, fadeSound?: string) {
    //console.log("DESTROYING")
    let self = this;
    if(self instanceof Anim) {
      game.level.anims.delete(self);
    }
    else {
      game.level.removeGameObject(this);
    }
    if(sprite) {
      let anim = new Anim(this.pos, sprite, this.xDir);
    }
    if(fadeSound) {
      this.playSound(fadeSound);
    }
    this.sprite.free();
  }

  /*
  destroySprite() {
    if(this.sprite && this.sprite.pixiSprite) {
      this.container.removeChild(this.sprite.pixiSprite);
      this.sprite.pixiSprite.destroy();
      if(this.sprite.pixiSprite.texture) this.sprite.pixiSprite.texture.destroy();
    }
  }
  */

  getSoundVolume() {
    let dist = new Point(game.level.camCenterX, game.level.camCenterY).distanceTo(this.pos);
    let volume = 1 - (dist / (game.level.screenWidth));
    volume = Helpers.clampMin0(volume);
    return volume;
  }

  playSound(soundName: string, overrideVolume?: number, forcePlay: boolean = false, forceSameVolume: boolean = false) {
    let volume = this.getSoundVolume();
    if(overrideVolume !== undefined) volume = overrideVolume;
    volume = Helpers.clampMin0(volume);
    game.playSound(soundName, volume, forcePlay, forceSameVolume);
  }

  withinX(other: Actor, amount: number) {
    return Math.abs(this.pos.x - other.pos.x) <= amount;
  }
  
  withinY(other: Actor, amount: number) {
    return Math.abs(this.pos.y - other.pos.y) <= amount;
  }

  isFacing(other: Actor) {
    return ((this.pos.x < other.pos.x && this.xDir === 1) || (this.pos.x >= other.pos.x && this.xDir === -1));
  }

  get centerPos() {
    if(!this.globalCollider) return this.pos;
    let rect = this.globalCollider.shape.getRect();
    if(!rect) return this.pos;

    if(this.sprite.alignment.includes("bot")) {
      let pos = this.pos.addxy(0, -rect.h / 2);
      return pos;
    }

    return this.pos;
  }

  breakFreeze(pos?: Point) {
    if(!pos) pos = this.pos;
    let pieces = [
      new Anim(pos.addxy(Helpers.randomRange(-20, 20),Helpers.randomRange(-20, 20)), game.sprites["shotgun_ice_break"], 1, false),
      new Anim(pos.addxy(Helpers.randomRange(-20, 20),Helpers.randomRange(-20, 20)), game.sprites["shotgun_ice_break"], 1, false),
      new Anim(pos.addxy(Helpers.randomRange(-20, 20),Helpers.randomRange(-20, 20)), game.sprites["shotgun_ice_break"], 1, false),
      new Anim(pos.addxy(Helpers.randomRange(-20, 20),Helpers.randomRange(-20, 20)), game.sprites["shotgun_ice_break"], 1, false),
      new Anim(pos.addxy(Helpers.randomRange(-20, 20),Helpers.randomRange(-20, 20)), game.sprites["shotgun_ice_break"], 1, false),
      new Anim(pos.addxy(Helpers.randomRange(-20, 20),Helpers.randomRange(-20, 20)), game.sprites["shotgun_ice_break"], 1, false)
    ];
    for(let piece of pieces) {
      piece.frameSpeed = 0;
      piece.useGravity = true;
      piece.vel = new Point(Helpers.randomRange(-300, 300), Helpers.randomRange(-300, 25));
    }
    pieces[2].frameIndex = 1;
    pieces[3].frameIndex = 1;
    pieces[4].frameIndex = 2;
    pieces[5].frameIndex = 2;
  }

}

export class Anim extends Actor {

  destroyOnEnd: boolean;
  constructor(pos: Point, sprite: Sprite, xDir: number, destroyOnEnd: boolean = true) {
    super(sprite, new Point(pos.x, pos.y), true);
    this.useGravity = false;
    this.xDir = xDir;
    this.destroyOnEnd = destroyOnEnd;
    game.level.anims.add(this);
  }

  update() {
    super.update();
    if(this.destroyOnEnd && this.isAnimOver()) {
      this.destroySelf();
    }
  }

}