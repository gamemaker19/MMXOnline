import { Character, LadderClimb, LadderEnd, WallKick } from "./character";
import { game } from "./game";
import { Projectile, BusterProj } from "./projectile";
import { Point } from "./point";
import * as Helpers from "./helpers";
import { NavMeshNode, NavMeshNeighbor } from "./navMesh";
import { JumpZone, Wall, Ladder } from "./wall";
import { CTF, Brawl } from "./gameMode";
import { Flag } from "./flag";
import { Buster } from "./weapon";

export class AI {

  character: Character;
  aiState: AIState;
  target: Character;
  shootTime: number = 0;
  dashTime: number = 0;
  jumpTime: number = 0;
  weaponTime: number = 0;
  maxChargeTime: number = 0;
  framesChargeHeld: number = 0;
  platformJumpDir: number = 0;
  flagger: boolean = false; //Will this ai aggressively capture the flag?

  get player() {
    return this.character.player;
  }

  constructor(character: Character) {
    this.character = character;
    this.aiState = new AimAtPlayer(this.character);
    this.flagger = (Helpers.randomRange(0, 3) === 0 ? true: false);
  }

  doJump(jumpTime: number = 0.75) {
    if(this.jumpTime === 0) {
      //this.player.release("jump");
      this.player.press("jump");
      this.jumpTime = jumpTime;
    }
  }

  update() {

    if(game.level.gameMode.isOver) return;

    if(this.framesChargeHeld > 0) {
      if(this.character.chargeTime < this.maxChargeTime) {
        //console.log("HOLD");
        this.player.press("shoot");
      }
      else {
        //this.player.release("shoot");
      }
    }

    if(!game.level.gameObjects.has(this.target)) {
      this.target = undefined;
    }
    
    this.target = game.level.getClosestTarget(this.character.pos, this.player.alliance, true);
    let inDrop = false;
    if(!(this.aiState instanceof InJumpZone)) {
      let jumpZones = game.level.getTriggerList(this.character, 0, 0, undefined, JumpZone);
      if(jumpZones.length > 0) {
        let jumpZone = <JumpZone>jumpZones[0].gameObject;
        let jumpZoneDir = this.character.xDir; //Helpers.randomRange(0, 1);
        if(jumpZoneDir === 0) jumpZoneDir = -1;

        if(!jumpZone.targetNode || jumpZone.targetNode === this.aiState.getNextNodeName()) {
          if(!(this.aiState instanceof FindPlayer)) {
            this.changeState(new InJumpZone(this.character, jumpZone, jumpZoneDir));
          }
          else {
            if(this.character.charState.constructor.name !== "LadderClimb") {
              this.doJump();
            }
          }
        }
        else {
          inDrop = true;
        }
      }
    }

    /*
    if(!inDrop) {
      let sweepForward = this.character.sweepTest(new Point(this.character.xDir * 30, 0));
      let raycastUp = game.level.raycast(this.character.getCenterPos(), this.character.getCenterPos().addxy(0, -75), ["Wall"]);
      if(sweepForward && !raycastUp && sweepForward.gameObject instanceof Wall) {
        this.player.press("jump");
      }
    }
    */

    if(!(this.aiState instanceof InJumpZone)) {
      if(!this.target) {
        if(this.aiState.constructor.name !== "FindPlayer") {
          this.changeState(new FindPlayer(this.character));
        }
      }
      else {
        if(this.aiState.constructor.name === "FindPlayer") {
          this.changeState(new AimAtPlayer(this.character));
        }
      }

      if(this.target) {
        if(this.character.charState.constructor.name === "LadderClimb") {
          this.doJump();
        }
        let xDist = this.target.pos.x - this.character.pos.x;
        if(Math.abs(xDist) > this.getMaxDist()) {
          this.changeState(new MoveTowardsTarget(this.character));
        }
      }
    }

    if(this.aiState.facePlayer && this.target) {
      if(this.character.pos.x > this.target.pos.x) {
        if(this.character.xDir !== -1) {
          this.player.press("left");
        }
      }
      else {
        if(this.character.xDir !== 1) {
          this.player.press("right");
        }
      }
    }
    if(this.aiState.shouldAttack && this.target) {
      if(this.shootTime === 0) {
        //if(this.character.withinY(this.target, 25)) {
        if(this.character.isFacing(this.target)) {
          if(this.framesChargeHeld > 0) {
            if(this.character.chargeTime >= this.maxChargeTime) {
              this.player.release("shoot");
              this.framesChargeHeld = 0;
            }
          }
          else {
            this.player.press("shoot");
          }
        }
      }
      this.shootTime += game.deltaTime;
      if(this.shootTime > 0.1) {
        this.shootTime = 0;
      }
    }
    if(this.aiState.shouldDodge) {
      for(let proj of game.level.gameObjects) {
        if(proj instanceof Projectile && !(proj instanceof BusterProj)) {
          if(proj.isFacing(this.character) && this.character.withinX(proj, 100) && this.character.withinY(proj, 30) && proj.damager.owner.alliance !== this.player.alliance) {
            this.doJump();
          }
        }
      }
    }
    if(this.aiState.randomlyChargeWeapon && !this.player.isZero && this.framesChargeHeld === 0 && this.player.character.canCharge()) {
      if(Helpers.randomRange(0, 300) < 1) {
        if(this.player.weapon instanceof Buster) {
          this.maxChargeTime = Helpers.randomRange(0.75, 3);
        }
        else {
          this.maxChargeTime = 3.5;
        }
        this.framesChargeHeld = 1;
        this.player.press("shoot");
      }
    }
    if(this.aiState.randomlyChangeState) {
      if(Helpers.randomRange(0, 60) < 5) {
        let randAmount = Helpers.randomRange(-100, 100);
        this.changeState(new MoveToPos(this.character, this.character.pos.addxy(randAmount, 0)));
        return;
      }
    }
    if(this.aiState.randomlyDash && !(this.character.charState instanceof WallKick) && !this.platformJumpDir) {
      if(Helpers.randomRange(0, 150) < 5) {
        this.dashTime = Helpers.randomRange(0.2, 0.5);
      }
      if(this.dashTime > 0) {
        this.player.press("dash");
        this.dashTime -= game.deltaTime;
        if(this.dashTime < 0) this.dashTime = 0;
      }
    }
    if(this.aiState.randomlyJump) {
      if(Helpers.randomRange(0, 150) < 5) {
        this.jumpTime = Helpers.randomRange(0.25, 0.75);
      }
    }
    if(this.aiState.randomlyChangeWeapon && !this.player.isZero && !this.player.lockWeapon && !this.character.isStingCharged && !this.character.chargedRollingShieldProj) {
      this.weaponTime += game.deltaTime;
      if(this.weaponTime > 5) {
        this.weaponTime = 0;
        let wasBuster = (this.player.weapon instanceof Buster);
        this.character.changeWeapon(this.getRandomWeaponIndex());
        if(wasBuster && this.maxChargeTime > 0) {
          this.maxChargeTime = 3.5;
        }
      }
    }
    if(this.player.weapon.ammo <= 0) {
      this.character.changeWeapon(this.getRandomWeaponIndex());
    }

    this.aiState.update();

    if(this.jumpTime > 0 && !(this.character.charState instanceof LadderClimb)) {
      this.jumpTime -= game.deltaTime;
      if(this.platformJumpDir === 1) {
        let rightWall = game.level.checkCollisionActor(this.character, 30, 0);
        if(rightWall && rightWall.gameObject instanceof Wall) {
          this.platformJumpDir = 0;
        }
      }
      else if(this.platformJumpDir === -1) {
        let leftWall = game.level.checkCollisionActor(this.character, -30, 0);
        if(leftWall && leftWall.gameObject instanceof Wall) {
          this.platformJumpDir = 0;
        }
      }
      if(this.jumpTime < 0) {
        this.jumpTime = 0;
      }
      else {
        //this.player.press("jump");
      }
    }

  }

  getRandomWeaponIndex() {
    //@ts-ignore
    let weapons = _.filter(this.player.weapons, (weapon) => {
      return weapon.ammo > 0;
    });
    if(weapons.length === 0) return 0;
    let weapon = weapons[Helpers.randomRange(0, weapons.length - 1)];
    let weaponIndex = this.player.weapons.indexOf(weapon);
    return weaponIndex;
  }

  changeState(newState: AIState, forceChange: boolean = false) {
    if(game.level.gameMode instanceof Brawl && newState instanceof FindPlayer) {
      return;
    }
    if(this.aiState instanceof FindPlayer && this.character.flag) {
      return;
    }
    if(this.flagger && this.aiState instanceof FindPlayer && game.level.gameMode instanceof CTF) {
      //return;
    }
    if(forceChange || newState.canChangeTo()) {
      this.aiState = newState;
    }
  }

  getMaxDist() {
    let maxDist = game.level.halfScreenWidth;
    if(this.player.isZero) maxDist = 70;
    return maxDist;
  }

}

class AIState {

  facePlayer: boolean;
  character: Character;
  shouldAttack: boolean;
  shouldDodge: boolean;
  randomlyChangeState: boolean;
  randomlyDash: boolean;
  randomlyJump: boolean;
  randomlyChangeWeapon: boolean;
  randomlyChargeWeapon: boolean;

  get player() {
    return this.character.player;
  }
  get ai() {
    return this.player.character.ai;
  }
  get target() {
    return this.ai.target;
  }
  getNextNodeName() {
    if(this instanceof FindPlayer) {
      return this.nextNode.name;
    }
    return "";
  }
  canChangeTo() {
    return !(this.character.charState instanceof LadderClimb) && !(this.character.charState instanceof LadderEnd);
  }

  constructor(character: Character) {
    this.character = character;
    this.shouldAttack = true;
    this.facePlayer = true;
    this.shouldDodge = true;
    this.randomlyChangeState = true;
    this.randomlyDash = true;
    this.randomlyJump = true;
    this.randomlyChangeWeapon = true;
    this.randomlyChargeWeapon = true;
  }

  update() {

  }

}

class MoveTowardsTarget extends AIState {
  constructor(character: Character) {
    super(character);
    this.facePlayer = false;
    this.shouldAttack = false;
    this.shouldDodge = false;
    this.randomlyChangeState = false;
    this.randomlyDash = true;
    this.randomlyJump = false;
    this.randomlyChangeWeapon = false;
    this.randomlyChargeWeapon = true;
  }

  update() {
    super.update();
    if(!this.ai.target) return;
    if(this.character.pos.x - this.ai.target.pos.x > this.ai.getMaxDist()) {
      this.player.press("left");
    }
    else if(this.character.pos.x - this.ai.target.pos.x < -this.ai.getMaxDist()) {
      this.player.press("right");
    }
    else {
      this.ai.changeState(new AimAtPlayer(this.character));
    }
  }

}

export class FindPlayer extends AIState {
  
  destNode: NavMeshNode;
  nextNode: NavMeshNode;
  prevNode: NavMeshNode;
  ladderDir: string;
  nodePath: NavMeshNode[];
  nodeTime: number = 0;
  constructor(character: Character) {
    super(character);
    this.facePlayer = false;
    this.shouldAttack = false;
    this.shouldDodge = false;
    this.randomlyChangeState = false;
    this.randomlyDash = true;
    this.randomlyJump = false;
    this.randomlyChangeWeapon = false;
    this.randomlyChargeWeapon = true;
    this.ai.platformJumpDir = 0;
    
    if(game.level.gameMode instanceof Brawl) {
      return;
    }

    if(game.level.gameMode instanceof CTF) {
      if(!this.character.flag) {
        let targetFlag: Flag;
        if(this.player.alliance === 0) targetFlag = game.level.redFlag;
        else if(this.player.alliance === 1) targetFlag = game.level.blueFlag;
        this.destNode = game.level.getClosestNodeInSight(targetFlag.pos);
      }
      else {
        if(this.player.alliance === 0) this.destNode = game.level.blueFlagNode;
        else if(this.player.alliance === 1) this.destNode = game.level.redFlagNode;
      }
      
    }
    else {
      this.destNode = game.level.getRandomNode();
    }
    if(game.level.levelData.name === "highway") {
      this.nextNode = this.destNode;
    }
    else {
      this.nextNode = game.level.getClosestNodeInSight(this.character.centerPos);
    }
    this.prevNode = undefined;
    this.nodePath = this.nextNode.getNodePath(this.destNode);
    //@ts-ignore
    _.remove(this.nodePath, this.nextNode);
  }

  update() {
    super.update();

    if(!this.nextNode) {
      this.ai.changeState(new FindPlayer(this.character));
      return;
    }

    if(this.character.charState.constructor.name === "LadderClimb") {
      this.player.press(this.ladderDir);
      let dir = 1;
      if(this.ladderDir === "up") dir = -1;
      if(this.character.sweepTest(new Point(0, dir * 5))) {
        this.ai.doJump();
        this.ai.changeState(new FindPlayer(this.character));
      }
      return;
    }
    else {
      this.nodeTime += game.deltaTime;
      if(this.nodeTime > 20) {
        this.nodeTime = 0;
        this.ai.changeState(new FindPlayer(this.character));
      }
    }

    if(this.character.pos.x - this.nextNode.pos.x > 5) {
      if(!this.ai.platformJumpDir) this.player.press("left");
    }
    else if(this.character.pos.x - this.nextNode.pos.x < -5) {
      if(!this.ai.platformJumpDir) this.player.press("right");
    }
    else {
      if(Math.abs(this.character.pos.y - this.nextNode.pos.y) < 30) {
        if(this.nextNode === this.destNode) {
          this.ai.changeState(new FindPlayer(this.character));
          return;
        }
        this.nodeTime = 0;
        this.prevNode = this.nextNode;
        this.nextNode = this.nodePath.shift();
        let neighbor: NavMeshNeighbor = this.prevNode.getNeighbor(this.nextNode);
        if(neighbor.isJumpNode && !neighbor.ladder) {
          this.ai.jumpTime = 2;
        }
        if(neighbor.platformJumpDir) {
          this.ai.platformJumpDir = neighbor.platformJumpDir;
          this.ai.doJump(1);
        }
      }
      else {
        if(!this.prevNode) {
          return;
        }
        let neighbor: NavMeshNeighbor = this.prevNode.getNeighbor(this.nextNode);
        if(neighbor.isJumpNode) {
          this.ai.doJump();
          if(neighbor.ladder) {
            this.ladderDir = "up";
            this.player.press("up");
          }
        }
        else if(neighbor.isDropNode) {
          if(neighbor.ladder) {
            this.ladderDir = "down";
            this.player.press("down");
          }
        }
        else if(neighbor.ladder) {
          this.ladderDir = "up";
          this.player.press("up");
        }
      }
    }

  }

}

class MoveToPos extends AIState {

  dest: Point;
  constructor(character: Character, dest: Point) {
    super(character);
    this.dest = dest;
    this.facePlayer = false;
    this.randomlyChangeState = false;
    this.randomlyChargeWeapon = true;
  }

  update() {
    super.update();
    let dir = 0;
    if(this.character.pos.x - this.dest.x > 5) {
      dir = -1;
      this.player.press("left");
    }
    else if(this.character.pos.x - this.dest.x < -5) {
      dir = 1;
      this.player.press("right");
    }
    else {
      this.ai.changeState(new AimAtPlayer(this.character));
    }

    if(this.character.sweepTest(new Point(dir * 5, 0))) {
      this.ai.changeState(new AimAtPlayer(this.character));
    }

  }

}

class AimAtPlayer extends AIState {
  jumpDelay: number = 0;
  constructor(character: Character) {
    super(character);    
  }
  update() {
    super.update();
    if(this.character.grounded && this.jumpDelay > 0.3) {
      this.jumpDelay = 0;
    }
    
    if(this.target && this.character.pos.y > this.target.pos.y && this.character.pos.y < this.target.pos.y + 80) {
      this.jumpDelay += game.deltaTime;
      if(this.jumpDelay > 0.3) {
        this.ai.doJump();
      }
    }
    else {
      //this.changeState(new JumpToWall());
    }
  }
}

class InJumpZone extends AIState {
  jumpZone: JumpZone;
  jumpZoneDir: number;
  time: number = 0.25;
  constructor(character: Character, jumpZone: JumpZone, jumpZoneDir: number) {
    super(character);
    this.jumpZone = jumpZone;
    this.jumpZoneDir = jumpZoneDir;
    this.facePlayer = false;
    this.shouldAttack = false;
    this.shouldDodge = false;
    this.randomlyChangeState = false;
    this.randomlyDash = true;
    this.randomlyJump = false;
    this.randomlyChangeWeapon = false;
    this.randomlyChargeWeapon = true;
  }
  update() {
    super.update();
    this.time += game.deltaTime;
    this.ai.doJump();
    if(this.jumpZoneDir === -1) {
      this.player.press("left");
    }
    else if(this.jumpZoneDir === 1) {
      this.player.press("right");
    }
    //Check if out of zone
    if(this.character && this.character.collider) {
      if(!this.character.collider.isCollidingWith(this.jumpZone.collider)) {
        this.ai.changeState(new FindPlayer(this.character));
      }
    }
  }
}

class DashToPlayer extends AIState {

}

class JumpToWall extends AIState {

}

class ClimbWall extends AIState {

}

class SlideDownWall extends AIState {

}
