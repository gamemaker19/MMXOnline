import { Actor, Anim } from "./actor";
import { Sprite } from "./sprite";
import { game } from "./game";
import { Point } from "./point";
import { Player } from "./player";
import { Collider, CollideData } from "./collider";
import { Rect } from "./rect";
import { Projectile, TorpedoProj, ZSaberProj, ShotgunIceProjCharged, RollingShieldProjCharged, ShotgunIceProjSled } from "./projectile";
import * as Helpers from "./helpers";
import { Weapon, Buster, FireWave, Torpedo, Sting, RollingShield, ZSaber, ZSaber2, ZSaber3, ZSaberAir, ZSaberDash } from "./weapon";
import { ChargeEffect, DieEffect } from "./effects";
import { AI } from "./ai";
import { Ladder, KillZone } from "./wall";
import { KillFeedEntry } from "./killFeedEntry";
import { FFADeathMatch, Brawl } from "./gameMode";
import { Damager } from "./damager";
import { Flag } from "./flag";
import { LoopingSound } from "./loopingSound";

export class Character extends Actor {

  charState: CharState;
  player: Player;
  runSpeed: number;
  isDashing: boolean;
  shootTime: number = 0;
  jumpPower: number;
  changedStateInFrame: boolean;
  chargeTime: number;
  charge1Time: number;
  charge2Time: number;
  charge3Time: number;
  chargeFlashTime: number;
  chargeEffect: ChargeEffect;
  shootAnimTime: number = 0;
  ai: AI;
  projectileCooldown: { [name: string]: number } = {};  //Player id + projectile name
  invulnFrames: number = 0;
  checkLadderDown: boolean = false;
  dashedInAir: boolean = false;
  dead: boolean = false;
  healAmount: number = 0;
  healTime: number = 0;
  weaponHealAmount: number = 0;
  weaponHealTime: number = 0;
  characterTag: PIXI.Container;
  nameTag: PIXI.Text;
  healthBarBorder: PIXI.Graphics;
  healthBarOuter: PIXI.Graphics;
  healthBarInner: PIXI.Graphics;
  healthBarInnerWidth: number;
  zSaberWeapon: ZSaber;
  slideVel: number = 0;
  flag: Flag;
  isStingCharged: boolean = false;
  stingChargeTime: number = 0;
  shotgunIceChargeTime: number = 0;
  shotgunIceChargeCooldown: number = 0;
  shotgunIceChargeMod: number = 0;
  freezeTime: number = 0;
  chargeSound: LoopingSound;
  chargedRollingShieldProj: RollingShieldProjCharged;
  iceSled: ShotgunIceProjSled;
  stopCamUpdate: boolean = false;

  constructor(player: Player, x: number, y: number, charState: CharState) {
    super(undefined, new Point(x, y), true);
    this.player = player;
    this.isDashing = false;
    this.zSaberWeapon = new ZSaber(this.player);

    this.globalCollider = this.getStandingCollider();
    
    this.changeState(charState);
    
    this.jumpPower = 230;
    this.runSpeed = 80;

    this.chargeTime = 0;
    this.charge1Time = 0.75;
    this.charge2Time = 1.75;
    this.charge3Time = 3;

    this.chargeFlashTime = 0;

    this.chargeSound = new LoopingSound("chargeStart", "chargeLoop", this);

    if(this.player !== game.level.mainPlayer) {
      this._zIndex = ++game.level.zChar;
    }
    else {
      this._zIndex = game.level.zMainPlayer;
    }

    game.level.addGameObject(this);

    this.chargeEffect = new ChargeEffect();

    if(game.level.gameMode.isTeamMode || game.level.gameMode.isBrawl) {

      if(game.level.gameMode.isTeamMode) {
        this.characterTag = new PIXI.Container();
        game.level.gameUIContainer.addChild(this.characterTag);

        this.nameTag = Helpers.createAndDrawText(this.characterTag, this.player.name, 0, 0, 6, "", "", this.player.alliance === 1);
        this.healthBarBorder = Helpers.createAndDrawRect(this.characterTag, new Rect(0, 0, 30, 6), 0xFFFFFF);
        this.healthBarBorder.x = -15;
        this.healthBarBorder.y = 5;
        this.healthBarOuter = Helpers.createAndDrawRect(this.characterTag, new Rect(0, 1, 28, 5), 0x000000);
        this.healthBarOuter.x = -15 + 1;
        this.healthBarOuter.y = 5;
        this.healthBarInner = Helpers.createAndDrawRect(this.characterTag, new Rect(0, 2, 26, 4), 0xFFFFFF);
        this.healthBarInner.x = -15 + 2;
        this.healthBarInner.y = 5;

        this.healthBarInnerWidth = this.healthBarInner.width;
        this.characterTag.visible = false;
      }

      if(!game.level.gameMode.isBrawl || game.uiData.isPlayer1Zero === game.uiData.isPlayer2Zero) {
        if(this.player.alliance === 0) {
          this.renderEffects.add("blueshadow");
        }
        else {
          this.renderEffects.add("redshadow");
        }
      }
    }
  }

  getStandingCollider() {
    let rect = new Rect(0, 0, 18, 34);
    if(this.player.isZero) rect.botRightPoint.y = 40;
    return new Collider(rect.getPoints(), false, this, false, false, 0, new Point(0, 0));
  }

  getDashingCollider() {
    let rect = new Rect(0, 0, 18, 22);
    if(this.player.isZero) rect.botRightPoint.y = 27;
    return new Collider(rect.getPoints(), false, this, false, false, 0, new Point(0, 0));
  }

  preUpdate() {
    super.preUpdate();
    this.changedStateInFrame = false;
  }

  onCollision(other: CollideData) {
    super.onCollision(other);
    if(other.gameObject instanceof KillZone) {
      if(other.gameObject.stingInvuln && this.isStingCharged) return;
      this.applyDamage(undefined, undefined, this.player.maxHealth * 2);
    }
  }

  update() {

    if(this.isStingCharged) {
      this.stingChargeTime += game.deltaTime;
      if(this.stingChargeTime > 10 && !game.level.checkCollisionShape(this.collider.shape, [this])) {
        this.stingChargeTime = 0;
        this.setStingCharged(false);
      }
    }

    if(game.level.levelData.killY !== undefined && this.pos.y > game.level.levelData.killY) {
      this.applyDamage(undefined, undefined, this.player.maxHealth * 2);
    }

    if(this.player.health >= this.player.maxHealth) {
      this.healAmount = 0;
    }
    if(this.healAmount > 0 && this.player.health > 0) {
      this.healTime += game.deltaTime;
      if(this.healTime > 0.05) {
        this.healTime = 0;
        this.healAmount--;
        this.player.health = Helpers.clampMax(this.player.health + 1, this.player.maxHealth);
        if(this.player === game.level.mainPlayer) {
          this.playSound("heal", undefined, true, true);
        }
      }
    }

    if(!(this.charState instanceof Dash) && !(this.charState instanceof AirDash) && !(this.charState instanceof Die)) {
      let standingCollider = this.getStandingCollider();
      if(!game.level.checkCollisionShape(standingCollider.shape, [this])) {
        this.globalCollider = standingCollider;
      }
    }

    if(this.player.alliance === 0) {
      //game.level.debugString = "y: " + this.pos.y;
    }

    for(let projName in this.projectileCooldown) {
      let cooldown = this.projectileCooldown[projName];
      if(cooldown) {
        this.projectileCooldown[projName] = Helpers.clampMin(cooldown - game.deltaTime, 0);
      }
    }
    if(this.invulnFrames > 0) {
      this.invulnFrames = Helpers.clampMin0(this.invulnFrames - game.deltaTime);
      if(game.level.twoFrameCycle > 0) {
        this.renderEffects.add("hit");
      }
      else {
        this.renderEffects.delete("hit");
        this.renderEffects.delete("flash");
      }
      
      if(this.invulnFrames <= 0) {
        //@ts-ignore
        this.renderEffects.delete("hit");
        this.renderEffects.delete("flash");
      } 
    }
    
    if(this.ai) {
      this.ai.update();
    }

    if(this.player.isZero) {
      this.updateZero();
    }

    if(this.slideVel !== 0) {
      this.slideVel = Helpers.toZero(this.slideVel, game.deltaTime * 350, Math.sign(this.slideVel));
      this.move(new Point(this.slideVel, 0), true);
    }

    this.charState.update();
    super.update();

    if(!this.player.isZero) {
      this.updateX();
    }

    if(this.flag) {
      this.flag.pos.x = this.getCenterPos().x;
      this.flag.pos.y = this.getCenterPos().y;
    }
    
    if(this.freezeTime > 0) {
      this.changeSpriteFromName("frozen", true);
      this.freezeTime -= game.deltaTime;
      if(this.freezeTime < 0) {
        this.unfreeze();
        this.changeSpriteFromName("idle", true);
      }
    }
    
    if(this.iceSled && !game.level.gameObjects.has(this.iceSled)) {
      this.iceSled = undefined;
    }
    if(this.iceSled) {
      this.pos = this.iceSled.pos.addxy(0, -16.1);
      this.changeState(new Idle(), true);
    }

  }

  unfreeze() {
    this.breakFreeze(this.getCenterPos());
    this.playSound("iceBreak");
    this.freezeTime = 0;
  }

  unfreezeIfFrozen() {
    if(this.freezeTime > 0) {
      this.unfreeze();
    }
  }

  updateX() {
    
    if(this.player.weapon.ammo >= this.player.weapon.maxAmmo) {
      this.weaponHealAmount = 0;
    }
    if(this.weaponHealAmount > 0 && this.player.health > 0) {
      this.weaponHealTime += game.deltaTime;
      if(this.weaponHealTime > 0.05) {
        this.weaponHealTime = 0;
        this.weaponHealAmount--;
        this.player.weapon.ammo = Helpers.clampMax(this.player.weapon.ammo + 1, this.player.weapon.maxAmmo);
        this.playSound("heal");
      }
    }

    if(this.shootAnimTime > 0) {
      this.shootAnimTime -= game.deltaTime;
      if(this.shootAnimTime <= 0) {
        this.shootAnimTime = 0;
        this.changeSpriteFromName(this.charState.sprite, false);
      }
    }

    this.player.weapon.update();
    if(this.charState.canShoot) {
      let shootPressed = this.player.isPressed("shoot");
      let shootHeld = this.player.isHeld("shoot");
      if(this.shootTime === 0 && ((shootPressed) || (shootHeld && this.player.weapon.isStream))) {
        this.shoot(false);
      }
      if(shootHeld && this.canCharge()) {
        this.chargeTime += game.deltaTime;
      }
      else {
        if(this.isCharging()) {
          this.shoot(true);
          this.stopCharge();
        }
      }
    }
    if(this.shootTime > 0) {
      this.shootTime -= game.deltaTime;
      if(this.shootTime <= 0) {
       this.shootTime = 0;
      }
    }
    if(this.player.isPressed("weaponleft")) {
      this.changeWeapon(Helpers.decrementRange(this.player.weaponIndex, 0, this.player.weapons.length));
    }
    else if(this.player.isPressed("weaponright")) {
      this.changeWeapon(Helpers.incrementRange(this.player.weaponIndex, 0, this.player.weapons.length));
    }
    else if(this.player.isPressed("weapon1")) this.changeWeapon(0);
    else if(this.player.isPressed("weapon2")) this.changeWeapon(1);
    else if(this.player.isPressed("weapon3")) this.changeWeapon(2);
    else if(this.player.isPressed("weapon4")) this.changeWeapon(3);
    else if(this.player.isPressed("weapon5")) this.changeWeapon(4);
    else if(this.player.isPressed("weapon6")) this.changeWeapon(5);
    else if(this.player.isPressed("weapon7")) this.changeWeapon(6);
    else if(this.player.isPressed("weapon8")) this.changeWeapon(7);
    else if(this.player.isPressed("weapon9")) this.changeWeapon(8);
    
    if(this.isCharging()) {
      let maxFlashTime = 0.1;
      
      this.chargeSound.play();

      this.chargeFlashTime += game.deltaTime;
      if(this.chargeFlashTime > maxFlashTime) {
        this.chargeFlashTime = 0;
      }
      if(this.chargeFlashTime > maxFlashTime * 0.5) {        
        this.renderEffects.add("flash");
      }
      else {
        this.renderEffects.delete("hit");
        this.renderEffects.delete("flash");
      }
      this.chargeEffect.update(this.pos, this.getChargeLevel());
    }

    if(this.shotgunIceChargeTime > 0) {
      this.changeSprite(game.sprites["mmx_" + this.charState.shootSprite], true);
      this.shotgunIceChargeTime -= game.deltaTime;
      let busterPos = this.getShootPos();
      if(this.shotgunIceChargeCooldown === 0) {
        new ShotgunIceProjCharged(this.player.weapon, busterPos, this.xDir, this.player, this.shotgunIceChargeMod % 2);
        this.shotgunIceChargeMod++;
      }
      this.shotgunIceChargeCooldown += game.deltaTime;
      if(this.shotgunIceChargeCooldown > 0.1) {
        this.shotgunIceChargeCooldown = 0;
      }
      if(this.shotgunIceChargeTime < 0) {
        this.shotgunIceChargeTime = 0;
        this.shotgunIceChargeCooldown = 0;
        this.changeSprite(game.sprites["mmx_" + this.charState.defaultSprite], true);
      }
    }
  }

  canCharge() {
    let weapon = this.player.weapon;
    if(weapon.ammo <= 0) return false;
    if(weapon instanceof RollingShield && this.chargedRollingShieldProj) return false;
    if(this.isStingCharged) return false;
    if(this.flag) return false;
    return true;
  }

  isAttacking() {
    return this.sprite.name.includes("attack"); 
  }

  updateZero() {
    if(this.charState.canAttack && this.player.isPressed("shoot")) {
      if(!this.isAttacking()) {
        if(this.charState instanceof LadderClimb) {
          if(this.player.isHeld("left")) {
            this.xDir = -1;
          }
          else if(this.player.isHeld("right")) {
            this.xDir = 1;
          }
        }
        let attackSprite = this.charState.attackSprite;
        if(this.charState.constructor.name === "Run") this.changeState(new Idle(), true);
        else if(this.charState.constructor.name === "Jump") this.changeState(new Fall(), true);
        else if(this.charState.constructor.name === "Dash") {
          this.slideVel = this.xDir * this.getDashSpeed() * this.runSpeed;
          this.changeState(new Idle(), true);
        }
        this.changeSprite(this.getSprite(attackSprite), true);
      }
      else if(this.charState instanceof Idle && this.sprite.name === "zero_attack" && this.framePercent > 0.75) {
        this.changeSprite(game.sprites["zero_attack2"], true);
      }
      else if(this.charState instanceof Idle && this.sprite.name === "zero_attack2" && this.framePercent > 0.75) {
        this.changeSprite(game.sprites["zero_attack3"], true);
        new ZSaberProj(this.zSaberWeapon, this.pos.addxy(0, -20), this.xDir, this.player);
      }
    }
    if(this.isAttacking()) {
      if(this.isAnimOver()) {
        this.changeSprite(this.getSprite(this.charState.defaultSprite), true);
      }
    }
    if(this.isAttacking()) {
      let attackHitboxes = this.currentFrame.hitboxes;
      for(let hitbox of attackHitboxes) {
        if(hitbox.flag === 0) continue;
        //1. Check actors
        let collideDatas = game.level.checkCollisionsShape(hitbox.shape, [this]);
        for(let collideData of collideDatas) {
          let go = collideData.gameObject;
          if(go instanceof Character && go.player.alliance !== this.player.alliance && !go.isStingCharged) {
            if(this.charState instanceof Idle) {
              if(this.sprite.name === "zero_attack") this.zSaberWeapon.damager.applyDamage(go, false, this.zSaberWeapon, this, "zsaber1", 2, false);
              if(this.sprite.name === "zero_attack2") this.zSaberWeapon.damager.applyDamage(go, false, this.zSaberWeapon, this, "zsaber2", 2, false);
              if(this.sprite.name === "zero_attack3") this.zSaberWeapon.damager.applyDamage(go, false, this.zSaberWeapon, this, "zsaber3", 2, true);
              if(this.sprite.name === "zero_attack_dash") this.zSaberWeapon.damager.applyDamage(go, false, this.zSaberWeapon, this, "zsaberdash", 2, false);
            }
            else if(this.charState instanceof Fall) {
              this.zSaberWeapon.damager.applyDamage(go, false, this.zSaberWeapon, this, "zsaberair", 1, false);
            }
            else if(this.charState instanceof LadderClimb) this.zSaberWeapon.damager.applyDamage(go, false, this.zSaberWeapon, this, "zsaberladder", 2, false);
            else if(this.charState instanceof WallSlide) this.zSaberWeapon.damager.applyDamage(go, false, this.zSaberWeapon, this, "zsaberslide", 2, false);
          }
          else if(go instanceof TorpedoProj) {
            go.destroySelf(go.fadeSprite, go.fadeSound);
          }
          else if(go instanceof Projectile && go.damager.owner.alliance !== this.player.alliance && go.reflectable && go.time > 0.1) {
            go.reflect(this.player);
          }
        }
        //2. Check other enemy zero's sword hitboxes
        for(let player of game.level.players) {
          let clang = false;
          if(player === this.player || !player.character || !player.isZero || player.alliance === this.player.alliance) continue;
          let hitboxes = player.character.currentFrame.hitboxes;
          for(let otherHitbox of hitboxes) {
            if(otherHitbox.flag === 0) continue;
            if(hitbox.isCollidingWith(otherHitbox)) {
              this.changeSprite(this.getSprite(this.charState.defaultSprite), true);
              player.character.changeSprite(player.character.getSprite(player.character.charState.defaultSprite), true);
              this.playSound("ding");
              clang = true;
              break;
            }
          }
          if(clang) break;
        }
        
      }
    }
  }

  shoot(doCharge: boolean) {
    if(!doCharge && this.getChargeLevel() === 3) return;
    if(this.player.weapon.ammo <= 0) return;
    this.shootTime = this.player.weapon.rateOfFire;
    if(this.shootAnimTime === 0) {
      this.changeSprite(this.getSprite(this.charState.shootSprite), false);
    }
    else if(this.charState instanceof Idle) {
      this.frameIndex = 0;
      this.frameTime = 0;
    }
    if(this.charState instanceof LadderClimb) {
      if(this.player.isHeld("left")) {
        this.xDir = -1;
      }
      else if(this.player.isHeld("right")) {
        this.xDir = 1;
      }
    }

    //Sometimes transitions cause the shoot sprite not to be played immediately, so force it here
    if(!this.currentFrame.getBusterOffset()) { 
      this.changeSprite(this.getSprite(this.charState.shootSprite), false);
    }
    
    this.shootAnimTime = 0.3;
    let xDir = this.xDir;
    if(this.charState instanceof WallSlide) xDir *= -1;
    this.player.weapon.shoot(this.getShootPos(), xDir, this.player, doCharge ? this.getChargeLevel() : 0);
    if(!this.player.weapon.isStream) {
      this.chargeTime = 0;
    }
    
  }

  changeWeapon(newWeaponIndex: number) {
    if(newWeaponIndex >= this.player.weapons.length) return;
    if(this.charState.constructor.name === "Die") return;
    this.setStingCharged(false);
    this.player.weaponIndex = newWeaponIndex;
    this.changePaletteWeapon(); 
  }

  setStingCharged(val: boolean) {
    this.isStingCharged = val;
    if(val) {
      this.renderEffects.add("invisible");
    }
    else {
      this.renderEffects.delete("invisible");
    }
  }

  changePaletteWeapon() {
    this.palette = this.player.weapon.palette;
  }

  getCenterPos() {
    return this.pos.addxy(0, -18);
  }

  getCamCenterPos() {
    return this.pos.addxy(0, -24);
  }

  setFall() {
    this.changeState(new Fall());
  }

  isClimbingLadder() {
    return this.charState.constructor.name === "LadderClimb";
  }

  addAI() {
    this.ai = new AI(this);
  }

  drawCharge() {
  }

  isCharging() {
    return this.chargeTime >= this.charge1Time;
  }

  getDashSpeed() {
    if(this.isDashing) return 2;
    return 1;
  }

  getShootPos() {
    let busterOffsetPos = this.currentFrame.getBusterOffset();
    if(!busterOffsetPos) {
      //console.log(this.frameIndex);
      //console.log(this.sprite.name);
      //Appears to throw on mmx_hurt, frame index 9 and 10
      //throw "No buster offset!";
      return this.getCenterPos();
    }
    let busterOffset = busterOffsetPos.clone();
    busterOffset.x *= this.xDir;
    if(this.player.weapon instanceof RollingShield && this.charState.constructor.name === "Dash") {
      busterOffset.y -= 2;
    }
    return this.pos.add(busterOffset);
  }

  stopCharge() {
    this.chargeTime = 0;
    //this.renderEffect = "";
    this.chargeFlashTime = 0;
    this.chargeSound.stop();
    this.chargeSound.reset();
    this.chargeEffect.stop();
  }

  getSprite(spriteName: string) {
    if(this.player.isZero) return game.sprites["zero_"+ spriteName];
    else return game.sprites["mmx_" + spriteName];
  }

  changeSpriteFromName(spriteName: string, resetFrame: boolean) {
    this.changeSprite(this.getSprite(spriteName), resetFrame);
  }

  getChargeLevel() : number {
    if(this.chargeTime < this.charge1Time) {
      return 0;
    }
    else if(this.chargeTime >= this.charge1Time && this.chargeTime < this.charge2Time) {
      return 1;
    }
    else if(this.chargeTime >= this.charge2Time && this.chargeTime < this.charge3Time) {
      return 2;
    }
    else if(this.chargeTime >= this.charge3Time) {
      return 3;
    }
    return -1;
  }

  changeState(newState: CharState, forceChange?: boolean) {
    if(this.charState && newState && this.charState.constructor === newState.constructor) return;
    if(this.changedStateInFrame && !forceChange) return;
    this.changedStateInFrame = true;
    newState.character = this;
    if(this.shootAnimTime === 0 || !newState.canShoot) {
      this.changeSprite(this.getSprite(newState.sprite), true);
    }
    else { 
      this.changeSprite(this.getSprite(newState.shootSprite), true);
    }
    let oldState = this.charState;
    if(oldState) oldState.onExit(newState);
    this.charState = newState;
    newState.onEnter(oldState);
    
    if(!newState.canShoot) {
      this.shootTime = 0;
      this.shootAnimTime = 0;
    }
  }
  
  render(x: number, y: number) {
    super.render(x, y);
    if(this.chargeEffect) {
      this.chargeEffect.render(this.getCenterPos().add(new Point(x, y)), this.getChargeLevel())
    }
    if(game.level.gameMode.isTeamMode && this.charState instanceof Die) {
      this.characterTag.visible = false;
    }
    else if(game.level.gameMode.isTeamMode
      && this.player !== game.level.mainPlayer
      && this.player.alliance === game.level.mainPlayer.alliance
      && !(this.charState instanceof WarpIn)
    ) {
      this.characterTag.visible = true;
      this.characterTag.x = this.pos.x;
      this.characterTag.y = this.pos.y - 47;

      let healthPct = this.player.health / this.player.maxHealth;
      this.healthBarInner.width = Helpers.clampMax(Math.ceil(this.healthBarInnerWidth * healthPct), this.healthBarInnerWidth);
      if(healthPct > 0.66) this.healthBarInner.tint = 0x00FF00;
      else if(healthPct <= 0.66 && healthPct >= 0.33) this.healthBarInner.tint = 0xFFFF00;
      else if(healthPct < 0.33) this.healthBarInner.tint = 0xFF0000;
    }
  }
  
  applyDamage(attacker: Player, weapon: Weapon, damage: number) {
    this.player.health -= damage;
    if(this.player.health <= 0) {
      this.player.health = 0;
      if(!this.dead) {
        this.dead = true;
        this.changeState(new Die(), true);
        if(attacker) attacker.kills++;
        this.player.deaths++;
        game.level.gameMode.addKillFeedEntry(new KillFeedEntry(attacker, this.player, weapon));
      }
    }
  }

  addHealth(amount: number) {
    this.healAmount += amount;
  }

  addAmmo(amount: number) {
    this.weaponHealAmount += amount;
    /*
    this.player.weapon.ammo += amount;
    if(this.player.weapon.ammo > this.player.weapon.maxAmmo) {
      this.player.weapon.ammo = this.player.weapon.maxAmmo;
    }
    */
  }

  setHurt(dir: number) {
    this.changeState(new Hurt(dir));
  }

  destroySelf(sprite?: Sprite, fadeSound?: string) {
    super.destroySelf(sprite, fadeSound);
    this.chargeEffect.destroy();
    if(this.characterTag) {
      game.level.gameUIContainer.removeChild(this.characterTag);
      this.characterTag.destroy({ children: true, texture: true });
    }
  }

}

export class CharState {

  sprite: string;
  defaultSprite: string;
  attackSprite: string;
  shootSprite: string;
  transitionSprite: string;
  busterOffset: Point;
  character: Character;
  lastLeftWall: Collider;
  lastRightWall: Collider;
  stateTime: number;
  enterSound: string;
  framesJumpNotHeld: number = 0;

  constructor(sprite: string, shootSprite?: string, attackSprite?: string, transitionSprite?: string) {
    this.sprite = transitionSprite || sprite;
    this.transitionSprite = transitionSprite;
    this.defaultSprite = sprite;
    this.shootSprite = shootSprite;
    this.attackSprite = attackSprite;
    this.stateTime = 0;
  }

  get canShoot(): boolean {
    return !!this.shootSprite;
  }

  get canAttack(): boolean {
    return !!this.attackSprite;
  }

  get player() {
    return this.character.player;
  }

  onExit(newState: CharState) {
    //Stop the dash speed on transition to any frame except jump/fall (dash lingers in air) or dash itself
    if(!(newState instanceof Jump) && !(newState instanceof Fall) && !(newState instanceof WallKick) && !(newState instanceof Dash)) {
      this.character.isDashing = false;
    }
  }

  onEnter(oldState: CharState) {
    if(this.enterSound) this.character.playSound(this.enterSound);
  }

  inTransition() {
    return this.transitionSprite && this.sprite === this.transitionSprite;
  }

  update() {
    
    if(this.inTransition() && this.character.isAnimOver() && !game.level.gameMode.isOver) {
      this.sprite = this.defaultSprite;
      this.character.changeSpriteFromName(this.sprite, true);
    }

    this.stateTime += game.deltaTime;
    
    let lastLeftWallData = game.level.checkCollisionActor(this.character, -1, 0);
    this.lastLeftWall = lastLeftWallData ? lastLeftWallData.collider : undefined;
    if(this.lastLeftWall && !this.lastLeftWall.isClimbable) this.lastLeftWall = undefined;

    let lastRightWallData = game.level.checkCollisionActor(this.character, 1, 0);
    this.lastRightWall = lastRightWallData ? lastRightWallData.collider : undefined;
    if(this.lastRightWall && !this.lastRightWall.isClimbable) this.lastRightWall = undefined;
  }

  airCode() {
    if(this.character.grounded) {
      this.character.playSound("land");
      this.character.changeState(new Idle("land"));
      this.character.dashedInAir = false;
      return;
    }

    if(this.player.isHeld("dash") && !this.character.isDashing && !this.character.dashedInAir) {
      this.character.changeState(new AirDash());
    }
    if(this.player.isZero && this.player.isPressed("jump") && !this.character.isDashing && !this.character.dashedInAir) {
      this.character.dashedInAir = true;
      this.character.vel.y = -this.character.jumpPower;
      this.character.changeState(new Jump());
      return;
    }

    if(!this.player.isHeld("jump") && this.character.vel.y < 0) {
      this.framesJumpNotHeld++;
      if(this.framesJumpNotHeld > 3) {
        this.framesJumpNotHeld = 0;
        this.character.vel.y = 0;
      }
    }
    if(this.player.isHeld("jump")) {
      this.framesJumpNotHeld = 0;
    }
    if(this.player.isHeld("up")) {
      let ladders = game.level.getTriggerList(this.character, 0, 0, undefined, Ladder);
      if(ladders.length > 0) {
        let midX = ladders[0].collider.shape.getRect().midX;
        if(Math.abs(this.character.pos.x - midX) < 12) {
          let rect = ladders[0].collider.shape.getRect();
          let snapX = (rect.x1 + rect.x2)/2;
          if(!game.level.checkCollisionActor(this.character, snapX - this.character.pos.x, 0)) {
            this.character.changeState(new LadderClimb(ladders[0].gameObject, snapX));
          }
        }
      }
    }

    if(game.level.checkCollisionActor(this.character, 0, -1) && this.character.vel.y < 0) {
      this.character.vel.y = 0;
    }

    let move = new Point(0, 0);

    //Cast from base to derived
    let wallKick = (this instanceof WallKick) ? <WallKick> <any> this : null;

    if(this.player.isHeld("left")) {
      if(!wallKick || wallKick.kickSpeed <= 0) {
        move.x = -this.character.runSpeed * this.character.getDashSpeed();
        this.character.xDir = -1;
      }
    }
    else if(this.player.isHeld("right")) {
      if(!wallKick || wallKick.kickSpeed >= 0) {
        move.x = this.character.runSpeed * this.character.getDashSpeed();
        this.character.xDir = 1;
      }

    }
    if(move.magnitude > 0) {
      this.character.move(move);
    }

    //This logic can be abit confusing, but we are trying to mirror the actual Mega man X wall climb physics
    //In the actual game, X will not initiate a climb if you directly hugging a wall, jump and push in its direction UNTIL you start falling OR you move away and jump into it
    if((this.player.isPressed("left") && !this.player.isAI) || (this.player.isHeld("left") && (this.character.vel.y > 0 || !this.lastLeftWall))) {
      if(this.lastLeftWall) {
        this.player.character.changeState(new WallSlide(-1));
        return;
      }
    }
    else if((this.player.isPressed("right") && !this.player.isAI) || (this.player.isHeld("right") && (this.character.vel.y > 0 || !this.lastRightWall))) {
      if(this.lastRightWall) {
        this.player.character.changeState(new WallSlide(1));
        return;
      }
    }

  }

  groundCode() {
    if(!this.character.grounded) {
      this.character.changeState(new Fall());
      return;
    }
    else if(this.player.isPressed("jump")) {
      this.character.iceSled = undefined;
      this.character.vel.y = -this.character.jumpPower;
      this.character.changeState(new Jump());
      return;
    }
    else if(this.player.isPressed("down")) {
      this.character.checkLadderDown = true;
      let ladders = game.level.getTriggerList(this.character, 0, 1, undefined, Ladder);
      if(ladders.length > 0) {
        let rect = ladders[0].collider.shape.getRect();
        let snapX = (rect.x1 + rect.x2)/2;
        if(!game.level.checkCollisionActor(this.character, snapX - this.character.pos.x, 30)) {
          this.character.changeState(new LadderClimb(ladders[0].gameObject, snapX)); 
          this.character.move(new Point(0, 30), false);
          this.character.stopCamUpdate = true;
        }
      }
      this.character.checkLadderDown = false;
    }
  }

}

export class WarpIn extends CharState {
  warpBeam: Anim;
  warpSoundPlayed: boolean;
  constructor() {
    super("warp_in");
  }

  update() {
    if(!game.level.gameMode.spawnChar) {
      this.character.isVisible = false;
      this.character.frameSpeed = 0;
    }
    else {
      if(this.warpBeam) {
        if(this.character.player === game.level.mainPlayer && !this.warpSoundPlayed) {
          this.warpSoundPlayed = true;
          this.character.playSound("warpIn");
        }
        this.warpBeam.isVisible = true;
        this.warpBeam.pos.y += game.deltaTime * 450;
        if(this.warpBeam.pos.y >= this.character.pos.y) {
          this.warpBeam.destroySelf();
          this.warpBeam = undefined;
        }
      }
      else {
        this.character.isVisible = true;
        this.character.frameSpeed = 1;
        if(this.character.isAnimOver()) {
          this.character.changeState(new Idle());
        }
      }
    }
    
  }

  onEnter(oldState: CharState) {
    super.onEnter(oldState);
    this.character.useGravity = false;
    this.character.globalCollider.isTrigger = true;
    this.warpBeam = new Anim(this.character.pos.addxy(0, -200), game.sprites[this.player.isZero ? "zero_warp_beam" : "mmx_warp_beam"], 1, false);
    this.warpBeam.isVisible = false;
  }

  onExit(newState: CharState) {
    super.onEnter(newState);
    this.character.useGravity = true;
    this.character.globalCollider.isTrigger = false;
  }
}

export class Idle extends CharState {

  constructor(transitionSprite?: string) {
    super("idle", "shoot", "attack", transitionSprite);
  }

  update() {
    super.update();
    if(this.player.isHeld("left") || this.player.isHeld("right")) {
      if(!this.character.isAttacking()) {
        if(this.player.isHeld("left")) this.character.xDir = -1;
        if(this.player.isHeld("right")) this.character.xDir = 1;
        this.character.changeState(new Run());
      }
    }
    this.groundCode();
    if(this.player.isPressed("dash")) {
      if(!this.character.isAttacking()) this.character.changeState(new Dash());
    }
    if(game.level.gameMode.isOver) {
      if(this.player.won) {
        if(!this.character.sprite.name.includes("_win")) {
          this.character.changeSpriteFromName("win", true);
        }
      }
      else {
        if(!this.character.sprite.name.includes("kneel")) {
          this.character.changeSpriteFromName("kneel", true);
        }
      }
    }
  }

}

class Run extends CharState {

  constructor() {
    super("run", "run_shoot", "attack");
  }

  update() {
    super.update();
    let move = new Point(0, 0);
    if(this.player.isHeld("left")) {
      this.character.xDir = -1;
      move.x = -this.character.runSpeed;
    }
    else if(this.player.isHeld("right")) {
      this.character.xDir = 1;
      move.x = this.character.runSpeed;
    }
    if(move.magnitude > 0) {
      this.character.move(move);
    }
    else {
      this.character.changeState(new Idle());
    }
    this.groundCode();
    if(this.player.isPressed("dash")) {
      this.character.changeState(new Dash());
    }
  }

}

class Jump extends CharState {

  constructor() {
    super("jump", "jump_shoot", "attack_air");
    this.enterSound = "jump";
  }

  update() {
    super.update();
    this.character.iceSled = undefined;
    if(this.character.vel.y > 0) {
      this.character.changeState(new Fall());
      return;
    }
    this.airCode();
  }

  onEnter(oldState: CharState) {
    super.onEnter(oldState);
  }

  onExit(newState: CharState) {
    super.onExit(newState);
  }

}

class Fall extends CharState {

  constructor() {
    super("fall", "fall_shoot", "attack_air");
}

  update() {
    super.update();
    this.airCode();
  }

}

class Dash extends CharState {

  dashTime: number = 0;

  constructor() {
    super("dash", "dash_shoot", "attack_dash");
    this.enterSound = "dash";
  }

  onEnter(oldState: CharState) {
    super.onEnter(oldState);
    this.character.isDashing = true;
    this.character.globalCollider = this.character.getDashingCollider();
    new Anim(this.character.pos, game.sprites["dash_sparks"], this.character.xDir);
  }

  onExit(newState: CharState) {
    super.onExit(newState);
  }

  update() {
    super.update();
    this.groundCode();
    if(!this.player.isHeld("dash")) {
      this.character.changeState(new Idle());
      return;
    }
    this.dashTime += game.deltaTime;
    if(this.dashTime > 0.5) {
      this.character.changeState(new Idle());
      return;
    }
    let move = new Point(0, 0);
    move.x = this.character.runSpeed * this.character.getDashSpeed() * this.character.xDir;
    this.character.move(move);
    if(this.stateTime > 0.1) {
      this.stateTime = 0;
      new Anim(this.character.pos.addxy(0, -4), game.sprites["dust"], this.character.xDir);
    }
  }

}

class AirDash extends CharState {

  dashTime: number = 0;

  constructor() {
    super("dash", "dash_shoot");
    this.enterSound = "dash";
  }

  onEnter(oldState: CharState) {
    super.onEnter(oldState);
    this.character.isDashing = true;
    this.character.useGravity = false;
    this.character.vel = new Point(0, 0);
    this.character.dashedInAir = true;
    this.character.globalCollider = this.character.getDashingCollider();
    new Anim(this.character.pos, game.sprites["dash_sparks"], this.character.xDir);
  }

  onExit(newState: CharState) { 
    this.character.useGravity = true;
    super.onExit(newState);
  }

  update() {
    super.update();
    if(!this.player.isHeld("dash")) {
      this.character.changeState(new Fall());
      return;
    }
    this.dashTime += game.deltaTime;
    if(this.dashTime > 0.5) {
      this.character.changeState(new Fall());
      return;
    }
    let move = new Point(0, 0);
    move.x = this.character.runSpeed * this.character.getDashSpeed() * this.character.xDir;
    this.character.move(move);
    if(this.stateTime > 0.1) {
      this.stateTime = 0;
      new Anim(this.character.pos.addxy(0, -4), game.sprites["dust"], this.character.xDir);
    }
  }

}

class WallSlide extends CharState {
  
  wallDir: number;
  dustTime: number = 0;
  constructor(wallDir: number) {
    super("wall_slide", "wall_slide_shoot", "wall_slide_attack");
    this.wallDir = wallDir;
    this.enterSound = "land";
  }

  onEnter(oldState: CharState) {
    super.onEnter(oldState);
    this.character.dashedInAir = false;
    if(this.player.isAI) {
      this.character.ai.jumpTime = 0;
    }
  }

  update() {
    super.update();
    if(this.character.grounded) {
      this.character.changeState(new Idle());
      return;
    }
    if(this.player.isPressed("jump")) {
      if(this.player.isHeld("dash")) {
        this.character.isDashing = true;
      }
      this.character.vel.y = -this.character.jumpPower;
      this.character.changeState(new WallKick(this.wallDir * -1));
      return;
    }
    this.character.useGravity = false;
    this.character.vel.y = 0;

    if(this.stateTime > 0.15) {
      let dirHeld = this.wallDir === -1 ? this.player.isHeld("left") : this.player.isHeld("right");

      if(!dirHeld || !game.level.checkCollisionActor(this.character, this.wallDir, 0)) {
        this.player.character.changeState(new Fall());
      }
      this.character.move(new Point(0, 100));
    }

    this.dustTime += game.deltaTime;
    if(this.stateTime > 0.2 && this.dustTime > 0.1) {
      this.dustTime = 0;
      new Anim(this.character.pos.addxy(this.character.xDir * 12, 0), game.sprites["dust"], this.character.xDir);
    }

  }

  onExit(newState: CharState) {
    this.character.useGravity = true;
    super.onExit(newState);
  }

}

export class WallKick extends CharState {

  kickDir: number;
  kickSpeed: number;
  constructor(kickDir: number) {
    super("wall_kick", "wall_kick_shoot");
    this.kickDir = kickDir;
    this.kickSpeed = kickDir * 150;
    this.enterSound = "jump";
  }

  update() {
    super.update();
    if(this.character.isDashing) {
      this.kickSpeed = 0;
    }
    if(this.kickSpeed !== 0) {
      this.kickSpeed = Helpers.toZero(this.kickSpeed, 800 * game.deltaTime, this.kickDir);
      this.character.move(new Point(this.kickSpeed, 0));
    }
    this.airCode();
    if(this.character.vel.y > 0) {
      this.character.changeState(new Fall());
    }
  }

  onEnter(oldState: CharState) {
    super.onEnter(oldState);
    new Anim(this.character.pos.addxy(12*this.character.xDir,0), game.sprites["wall_sparks"], this.character.xDir);
  }

  onExit(newState: CharState) {
    super.onExit(newState);
  }

}

export class LadderClimb extends CharState {

  ladder: Ladder;
  snapX: number;
  constructor(ladder: Ladder, snapX?: number) {
    super("ladder_climb", "ladder_shoot", "ladder_attack", "ladder_start");
    this.ladder = ladder;
    this.snapX = snapX;
  }

  onEnter(oldState: CharState) {
    super.onEnter(oldState);
    if(this.snapX !== undefined) {
      this.character.incPos(new Point(this.snapX - this.character.pos.x, 0));
      //this.character.pos.x = this.snapX;
    }
    if(this.character.player === game.level.mainPlayer) {
      game.level.lerpCamTime = 0.25;
    }
    this.character.vel = new Point(0, 0);
    this.character.useGravity = false;
    this.character.dashedInAir = false;
  }

  onExit(newState: CharState) {
    super.onExit(newState);
    this.character.frameSpeed = 1;
    this.character.useGravity = true;
  }

  update() {
    super.update();

    if(this.inTransition()) {
      return;
    }

    if(this.character.isAttacking()) {
      this.character.frameSpeed = 1;
    }
    else {
      this.character.frameSpeed = 0;
    }
    if(this.character.shootAnimTime === 0 && !this.character.isAttacking()) {
      if(this.player.isHeld("up")) {
        this.character.move(new Point(0, -75));
        this.character.frameSpeed = 1;
      }
      else if(this.player.isHeld("down")) {
        this.character.move(new Point(0, 75));
        this.character.frameSpeed = 1;
      }
    }

    let ladderTop =  this.ladder.collider.shape.getRect().y1;
    let yDist = this.character.collider.shape.getRect().y2 - ladderTop;
    if(!this.ladder.collider.isCollidingWith(this.character.collider) || Math.abs(yDist) < 12) {
      if(this.player.isHeld("up")) {
        let targetY = ladderTop - 1;
        if(!game.level.checkCollisionActor(this.character, 0, targetY - this.character.pos.y)) {
          this.character.changeState(new LadderEnd(targetY));
        }
      }
      else {
        this.character.changeState(new Fall());
      }
    }
    else if(this.player.isPressed("jump")) {
      this.character.changeState(new Fall());
    }

    if(this.character.grounded) {
      this.character.changeState(new Idle());
    }

  }

}

export class LadderEnd extends CharState {
  targetY: number;
  constructor(targetY: number) {
    super("ladder_end");
    this.targetY = targetY;
  }

  onEnter(oldState: CharState) {
    super.onEnter(oldState);
    this.character.useGravity = false;
  }

  onExit(newState: CharState) {
    super.onExit(newState);
    this.character.useGravity = true;
  }

  update() {
    super.update();
    if(this.character.isAnimOver()) {
      if(this.character.player === game.level.mainPlayer) {
        game.level.lerpCamTime = 0.25;
      }
      //this.character.pos.y = this.targetY;
      this.character.incPos(new Point(0, this.targetY - this.character.pos.y));
      this.character.stopCamUpdate = true;
      this.character.changeState(new Idle());
    }
  }
}

class Hurt extends CharState {

  hurtDir: number;
  hurtSpeed: number;
  constructor(dir: number) {
    super("hurt");
    this.hurtDir = dir;
    this.hurtSpeed = dir * 100;
  }

  onEnter(oldState: CharState) {
    super.onEnter(oldState);
    this.character.vel.y = -100;
    this.character.stopCharge();
    this.character.unfreezeIfFrozen();
    this.character.iceSled = undefined;
  }

  update() {
    super.update();
    if(this.hurtSpeed !== 0) {
      this.hurtSpeed = Helpers.toZero(this.hurtSpeed, 400 * game.deltaTime, this.hurtDir);
      this.character.move(new Point(this.hurtSpeed, 0));
    }
    if(this.character.isAnimOver()) {
      this.character.changeState(new Idle());
    }
  }

}

class Die extends CharState {

  constructor() {
    super("die");
  }

  onEnter(oldState: CharState) {
    super.onEnter(oldState);
    this.character.useGravity = false;
    this.character.vel.x = 0;
    this.character.vel.y = 0;
    game.level.removeFromGrid(this.character);
    this.character.globalCollider = undefined;
    this.character.stopCharge();
    new Anim(this.character.pos.addxy(0, -12), game.sprites["die_sparks"],1);
    if(this.character.flag) {
      this.character.flag.dropFlag();
      this.character.flag = undefined;
    }
    this.character.unfreezeIfFrozen();
    this.character.setStingCharged(false);
    this.character.iceSled = undefined;
  }

  onExit(newState: CharState) {
    this.character.dead = false;
    throw "Should not have come back to life";
  }

  update() {
    super.update();
    if(this.stateTime > 0.75) {
      if(this.character.player === game.level.mainPlayer) {
        this.character.playSound("die", 1);
      }
      else {
        this.character.playSound("die");
      }
      
      new DieEffect(this.character.pos, this.player.isZero);
      this.player.destroyCharacter();
    }
  }

}