import { Actor } from "./actor";
import { game } from "./game";
import { Point } from "./point";
import { CollideData } from "./collider";
import { Character } from "./character";
import { CTF } from "./gameMode";
import { KillFeedEntry } from "./killFeedEntry";
import { FindPlayer } from "./ai";

export class Flag extends Actor {

  alliance: number = 0;
  pedestalPos: Point;
  char: Character;
  timeDropped: number = 0;
  pickedUpOnce: boolean = false;
  isInit: boolean = false;
  constructor(alliance: number, pos: Point) {
    super(game.sprites[alliance === 0 ? "blue_flag" : "red_flag"], pos);
    this.alliance = alliance;
    this.collider.wallOnly = true;
    this.setzIndex(game.level.zChar - 2);
    if(this.alliance === 0) {
      this.renderEffects.add("blueshadow");
    }
    else {
      this.renderEffects.add("redshadow");
    }
  }

  init() {
    this.isInit = true;
    let hit = game.level.raycast(this.pos.addxy(0, -10), this.pos.addxy(0, 60), ["Wall"]);
    this.pos = hit.hitData.hitPoint.clone();
    let pedestal = new FlagPedestal(this.alliance, hit.hitData.hitPoint.clone());
    this.pedestalPos = pedestal.pos.clone();
  }

  update() {
    if(!this.isInit) {
      this.init();
    }
    super.update();
    if(!this.char) {
      this.timeDropped += game.deltaTime;
    }
    if(this.pos.y > game.level.levelData.killY) {
      this.returnFlag();
    }
    if(this.timeDropped > 45 && this.pickedUpOnce) {
      this.returnFlag();
    }
  }

  onCollision(other: CollideData) {
    super.onCollision(other);
    if(this.char) return;
    let char = other.gameObject;
    if(char instanceof Character) {
      if(char.player.alliance !== this.alliance) {
        char.flag = this;
        char.setStingCharged(false);
        if(char.chargedRollingShieldProj) {
          char.chargedRollingShieldProj.destroySelf();
        }
        this.timeDropped = 0;
        this.char = char;
        this.useGravity = false;
        this.pickedUpOnce = true;
        game.level.gameMode.addKillFeedEntry(KillFeedEntry.CustomMessage(this.char.player.name + " took flag", this.char.player.alliance, this.char.player));
      }
    }
  }

  dropFlag() {
    game.level.gameMode.addKillFeedEntry(KillFeedEntry.CustomMessage(this.char.player.name + " dropped flag", this.char.player.alliance, this.char.player));
    this.useGravity = true;
    this.char = undefined;
  }

  returnFlag() {
    this.timeDropped = 0;
    this.pickedUpOnce = false;
    let team = this.alliance === 0 ? "Blue " : "Red ";
    game.level.gameMode.addKillFeedEntry(KillFeedEntry.CustomMessage(team + "flag returned", this.alliance));
    this.useGravity = true;
    this.char = undefined;
    this.pos = this.pedestalPos.clone();
  }

  render(x: number, y: number) {
    if(this.char) {
      
    }
    super.render(x, y);
  }
}

export class FlagPedestal extends Actor {

  alliance: number = 0;
  constructor(alliance: number, pos: Point) {
    super(game.sprites["flag_pedastal"], pos);
    this.alliance = alliance;
    this.useGravity = false;
    this.setzIndex(game.level.zChar - 1);
    if(this.alliance === 0) {
      this.renderEffects.add("blueshadow");
    }
    else {
      this.renderEffects.add("redshadow");
    }
  }

  onCollision(other: CollideData) {
    super.onCollision(other);
    let char = other.gameObject;
    if(char instanceof Character && char.flag && char.player.alliance === this.alliance) {
      char.flag.returnFlag();
      char.flag = undefined;
      if(char.ai) {
        char.ai.changeState(new FindPlayer(char));
      }
      let msg = char.player.name + " scored";
      game.level.gameMode.addKillFeedEntry(KillFeedEntry.CustomMessage(msg, char.player.alliance, char.player));
      let ctf = <CTF>game.level.gameMode;
      if(this.alliance === 0) {
        ctf.blueCaptures++;
      }
      else {
        ctf.redCaptures++;
      }
    }
  }

}