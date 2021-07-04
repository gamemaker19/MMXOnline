import { Projectile, BusterProj, TorpedoProj, Buster2Proj, Buster3Proj, StingProj, RollingShieldProj, ElectricSparkProj, ShotgunIceProj, BoomerangProj, TornadoProj, FireWaveProj, Buster4Proj, ElectricSparkProjCharged, TornadoProjCharged, BoomerangProjCharged, FireWaveProjCharged, FireWaveProjChargedStart, RollingShieldProjCharged, ShotgunIceProjCharged, ShotgunIceProjSled } from "./projectile";
import { game } from "./game";
import { Player } from "./player";
import { Point } from "./point";
import * as Helpers from "./helpers";
import { Sprite } from "./sprite";
import { Anim } from "./actor";
import { Palette } from "./color";
import { Damager } from "./damager";

export class Weapon {
  
  shootSounds: string[];
  ammo: number;
  maxAmmo: number;
  index: number;
  rateOfFire: number;
  soundTime: number = 0;
  palette: Palette;
  isStream: boolean = false;

  constructor() {
    this.ammo = 32;
    this.maxAmmo = 32;
    this.rateOfFire = 0.15;
  }

  getProjectile(pos: Point, xDir: number, player: Player, chargeLevel: number): void {
  }

  get spriteIndex() {
    return this.index === 1 ? 9 : this.index - 1;
  }

  update() {
    if(this.soundTime > 0) {
      this.soundTime = Helpers.clampMin(this.soundTime - game.deltaTime, 0);
    }
  }

  createBuster4Line(x: number, y: number, xDir: number, player: Player, offsetTime: number) {
    let buster4Speed = 350;
    new Buster4Proj(this, new Point(x + xDir, y), xDir, player, 3, 4, offsetTime);
    new Buster4Proj(this, new Point(x + xDir*8, y), xDir, player, 2, 3, offsetTime);
    new Buster4Proj(this, new Point(x + xDir*18, y), xDir, player, 2, 2, offsetTime);
    new Buster4Proj(this, new Point(x + xDir*32, y), xDir, player, 1, 1, offsetTime);
    new Buster4Proj(this, new Point(x + xDir*46, y), xDir, player, 0, 0, offsetTime);
  }

  canShoot(player: Player) {
    /*
    let projCount = 0;
    for(let go of game.level.gameObjects) {
      if(go instanceof Projectile && go.damager.owner === player) {
        projCount++;
      }
    }
    if(projCount >= 3) return false;
    */
    return true;
  }

  shoot(pos: Point, xDir: number, player: Player, chargeLevel: number) {
    
    this.getProjectile(pos, xDir, player, chargeLevel);
    
    if(this instanceof Buster && chargeLevel === 3) {
      new Anim(pos.clone(), game.sprites["buster4_muzzle_flash"], xDir);
      //Create the buster effect
      let xOff = -50*xDir;
      this.createBuster4Line(pos.x + xOff, pos.y, xDir, player, 0);
      this.createBuster4Line(pos.x + xOff + 15*xDir, pos.y, xDir, player, 1);
      this.createBuster4Line(pos.x + xOff + 30*xDir, pos.y, xDir, player, 2);
      
    }

    if(this.soundTime === 0) {
      player.character.playSound(this.shootSounds[chargeLevel]);
      if(this instanceof FireWave) {
        this.soundTime = 0.25;
      }
    }
    
    if(this instanceof FireWave) {
      this.ammo -= game.deltaTime * 10;
    }
    else {
      this.ammo -= (chargeLevel*2 + 1);
    }
  }

  addAmmo(amount: number) {
    this.ammo += amount;
    this.ammo = Helpers.clamp(this.ammo, 0, this.maxAmmo);
  }

}

export class ZSaber extends Weapon {
  damager: Damager;
  constructor(player: Player) {
    super();
    this.index = 9;
    this.damager = new Damager(player, 3, true, 0.5);
  }
}

export class ZSaber2 extends Weapon {
  damager: Damager;
  constructor(player: Player) {
    super();
    this.index = 9;
    this.damager = new Damager(player, 2, true, 0.5);
  }
}

export class ZSaber3 extends Weapon {
  damager: Damager;
  constructor(player: Player) {
    super();
    this.index = 9;
    this.damager = new Damager(player, 4, true, 0.5);
  }
}

export class ZSaberAir extends Weapon {
  damager: Damager;
  constructor(player: Player) {
    super();
    this.index = 9;
    this.damager = new Damager(player, 2, true, 0.5);
  }
}

export class ZSaberDash extends Weapon {
  damager: Damager;
  constructor(player: Player) {
    super();
    this.index = 9;
    this.damager = new Damager(player, 2, true, 0.5);
  }
}

export class Buster extends Weapon {

  constructor() {
    super();
    this.shootSounds = ["buster", "buster2", "buster3", "buster4"];
    this.index = 0;
  }

  getProjectile (pos: Point, xDir: number, player: Player, chargeLevel: number) {
    if(chargeLevel === 0) new BusterProj(this, pos, xDir, player);
    else if(chargeLevel === 1) new Buster2Proj(this, pos, xDir, player);
    else if(chargeLevel === 2) new Buster3Proj(this, pos, xDir, player);
    else if(chargeLevel === 3) undefined;
  }
  
}

export class Torpedo extends Weapon {

  constructor() {
    super();
    this.shootSounds = ["torpedo", "torpedo", "torpedo", "buster3"];
    this.index = 1;
    this.rateOfFire = 0.5;
    this.palette = game.palettes["torpedo"];
  }

  getProjectile(pos: Point, xDir: number, player: Player, chargeLevel: number) {
    if(chargeLevel !== 3) {
      new TorpedoProj(this, pos, xDir, player, 0);
    }
    else {      
      new TorpedoProj(this, pos.addxy(0,2), xDir, player, 1, 30);
      new TorpedoProj(this, pos.addxy(0,1), xDir, player, 1, 15);
      new TorpedoProj(this, pos.addxy(0,0), xDir, player, 1, 0);
      new TorpedoProj(this, pos.addxy(0,-1), xDir, player, 1, -15);
      new TorpedoProj(this, pos.addxy(0,-2), xDir, player, 1, -30);
    }
  }
  
}

export class Sting extends Weapon {

  constructor() {
    super();
    this.shootSounds = ["csting", "csting", "csting", "stingCharge"];
    this.index = 2;
    this.rateOfFire = 0.75;
    this.palette = game.palettes["sting"];
  }

  getProjectile(pos: Point, xDir: number, player: Player, chargeLevel: number) {
    if(chargeLevel !== 3) {
      new StingProj(this, pos, xDir, player, 0);
    }
    else {
      player.character.setStingCharged(true);
    }
  }

}

export class RollingShield extends Weapon {

  constructor() {
    super();
    this.shootSounds = ["rollingShield", "rollingShield", "rollingShield", ""];
    this.index = 3;
    this.rateOfFire = 0.75;
    this.palette = game.palettes["rolling_shield"];
  }

  getProjectile(pos: Point, xDir: number, player: Player, chargeLevel: number) {
    if(chargeLevel !== 3) {
      new RollingShieldProj(this, pos, xDir, player);
    }
    else {
      new RollingShieldProjCharged(this, pos, xDir, player);
    }
  }

}

export class FireWave extends Weapon {

  constructor() {
    super();
    this.shootSounds = ["fireWave", "fireWave", "fireWave", "fireWave"];
    this.index = 4;
    this.rateOfFire = 0.05;
    this.palette = game.palettes["fire_wave"];
    this.isStream = true;
  }

  getProjectile(pos: Point, xDir: number, player: Player, chargeLevel: number) {
    if(game.level.isUnderwater(player.character)) return;
    if(chargeLevel !== 3) {
      let proj = new FireWaveProj(this, pos, xDir, player);
      proj.vel.inc(player.character.vel.times(-0.5));
    }
    else {
      let proj = new FireWaveProjChargedStart(this, pos, xDir, player);
    }
  }

}

export class Tornado extends Weapon {

  constructor() {
    super();
    this.shootSounds = ["tornado", "tornado", "tornado", "buster3"];
    this.index = 5;
    this.rateOfFire = 1.5;
    this.palette = game.palettes["tornado"];
  }

  getProjectile(pos: Point, xDir: number, player: Player, chargeLevel: number) {
    if(chargeLevel !== 3) {
      new TornadoProj(this, pos, xDir, player);
    }
    else {
      new TornadoProjCharged(this, pos, xDir, player);
    }
  }
 
}

export class ElectricSpark extends Weapon {

  constructor() {
    super();
    this.shootSounds = ["electricSpark", "electricSpark", "electricSpark", "electricSpark"];
    this.index = 6;
    this.rateOfFire = 0.5;
    this.palette = game.palettes["electric_spark"];
  }

  getProjectile(pos: Point, xDir: number, player: Player, chargeLevel: number) {
    if(chargeLevel !== 3) {
      new ElectricSparkProj(this, pos, xDir, player, 0);
    }
    else {
      new ElectricSparkProjCharged(this, pos.addxy(-1, 0), -1, player);
      new ElectricSparkProjCharged(this, pos.addxy(1, 0), 1, player);
    }
  }

}

export class Boomerang extends Weapon {

  constructor() {
    super();
    this.shootSounds = ["boomerang", "boomerang", "boomerang", "buster3"];
    this.index = 7;
    this.rateOfFire = 0.5;
    this.palette = game.palettes["boomerang"];
  }

  getProjectile(pos: Point, xDir: number, player: Player, chargeLevel: number) {
    pos = player.character.getCenterPos();
    if(chargeLevel !== 3) new BoomerangProj(this, pos, xDir, player);
    else {
      new BoomerangProjCharged(this, pos.addxy(0,35), xDir, player, 90, 0);
      new BoomerangProjCharged(this, pos.addxy(35, 0), xDir, player, 0, 0);
      new BoomerangProjCharged(this, pos.addxy(0,-35), xDir, player, -90, 0);
      new BoomerangProjCharged(this, pos.addxy(-35,0), xDir, player, -180, 0);

      new BoomerangProjCharged(this, pos.addxy(0,5), xDir, player, 90, 1);
      new BoomerangProjCharged(this, pos.addxy(5, 0), xDir, player, 0, 1);
      new BoomerangProjCharged(this, pos.addxy(0,-5), xDir, player, -90, 1);
      new BoomerangProjCharged(this, pos.addxy(-5,0), xDir, player, -180, 1);
    }
  }

}

export class ShotgunIce extends Weapon {

  constructor() {
    super();
    this.shootSounds = ["buster", "buster", "buster", "icyWind"];
    this.index = 8;
    this.rateOfFire = 0.75;
    this.palette = game.palettes["shotgun_ice"];
  }

  getProjectile(pos: Point, xDir: number, player: Player, chargeLevel: number) {
    if(chargeLevel !== 3) {
      new ShotgunIceProj(this, pos, xDir, player, 0);
    }
    else {
      pos = pos.addxy(xDir * 25, 0);
      pos.y = player.character.pos.y;
      new ShotgunIceProjSled(this, pos, xDir, player);
      player.character.shotgunIceChargeTime = 1.5;
      //player.character.playSound("icyWind");
    }
  }

}