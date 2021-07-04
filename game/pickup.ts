import { Actor } from "./actor";
import { Point } from "./point";
import { Sprite } from "./sprite";
import { game } from "./game";
import { CollideData } from "./collider";
import { Character } from "./character";

export enum PickupType {
  Health,
  Ammo
}

export class Pickup extends Actor {
  
  healAmount: number = 0;
  pickupType: PickupType;
  constructor(pos: Point, sprite: Sprite) {
    super(sprite, pos);
    this.collider.wallOnly = true;
    this.collider.isTrigger = false;
  }

  onCollision(other: CollideData) {
    super.onCollision(other);
    if(other.gameObject instanceof Character) {
      if(this.pickupType == PickupType.Health) {
        other.gameObject.addHealth(this.healAmount);
      }
      else if(this.pickupType === PickupType.Ammo) {
        other.gameObject.addAmmo(this.healAmount);
      }
      this.destroySelf();
    }
    
  }
}

export class LargeHealthPickup extends Pickup {
  constructor(pos: Point) {
    super(pos, game.sprites["pickup_health_large"]);
    this.healAmount = 10;
    this.pickupType = PickupType.Health;
  }
}

export class SmallHealthPickup extends Pickup {
  constructor(pos: Point) {
    super(pos, game.sprites["pickup_health_small"]);
    this.healAmount = 4;
    this.pickupType = PickupType.Health;
  }
}

export class LargeAmmoPickup extends Pickup {
  constructor(pos: Point) {
    super(pos, game.sprites["pickup_ammo_large"]);
    this.healAmount = 10;
    this.pickupType = PickupType.Ammo;
  }
}

export class SmallAmmoPickup extends Pickup {
  constructor(pos: Point) {
    super(pos, game.sprites["pickup_ammo_small"]);
    this.healAmount = 4;
    this.pickupType = PickupType.Ammo;
  }
}

export class PickupSpawner {

  pos: Point;
  time: number = 0;
  pickupClass: any;
  currentPickup: Pickup;
  constructor(pos: Point, pickupClass: any) {
    this.pos = pos;
    this.pickupClass = pickupClass;
    this.time = 15.1;
  }

  update() {
    if(game.level.hasGameObject(this.currentPickup)) {
      this.time = 0;
      return;
    }
    //let incAmount = game.deltaTime;
    //if(!isFinite(incAmount) || isNaN(incAmount)) incAmount = 0;
    //if(incAmount < 0 || incAmount > 1) incAmount = 0;
    this.time += game.deltaTime;
    if(this.time > 15) {
      this.time = 0;
      this.currentPickup = new this.pickupClass(this.pos.clone());
    }
  }

}