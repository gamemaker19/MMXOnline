import { Geometry } from "./geometry";
import { Point } from "./point";

export class Wall extends Geometry {
  constructor(name: string, points: Point[]) {
    super(name, points);
    this.collider.isClimbable = true;
  }
}

export class Ladder extends Geometry {
  constructor(name: string, points: Point[]) {
    super(name, points);
    this.collider.isTrigger = true;
  }
}

export class KillZone extends Geometry {
  stingInvuln: boolean;
  constructor(name: string, points: Point[], stingInvuln: boolean) {
    super(name, points);
    this.stingInvuln = stingInvuln;
    this.collider.isTrigger = true;
  }
}

export class JumpZone extends Geometry {
  targetNode: string;
  constructor(name: string, points: Point[], targetNode: string) {
    super(name, points);
    this.collider.isTrigger = true;
    this.targetNode = targetNode;
  }
}