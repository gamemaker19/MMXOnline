import { Point } from "./point";
import { game } from "./game";

export enum Team {
  Neutral = 0,
  Blue = 1,
  Red = 2
}

export class SpawnPoint {

  name: string;
  pos: Point;
  xDir: number;
  num: number;
  team: Team;
  alliance: number;
  constructor(name: string, point: Point, xDir: number, num: number, team: Team) {
    this.name = name;
    this.pos = point;
    this.xDir = xDir || 1;
    this.num = num || 0;
    this.team = team;
    if(team === Team.Blue) this.alliance = 0;
    else if(team === Team.Red) this.alliance = 1;
  }

  occupied() {
    //if(this.name !== "Spawn Point2") return true; //Beginning of level
    let nearbyChars = game.level.getActorsInRadius(this.pos, 30, ["Character"]);
    if(nearbyChars.length > 0) return true;
    return false;
  }

  getGroundY() {
    let hit = game.level.raycast(this.pos, this.pos.addxy(0, 60), ["Wall"]);
    return hit.hitData.hitPoint.y - 1;
  }

}