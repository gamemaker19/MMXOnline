import { Rect } from "./rect";
import { Point } from "./point";
import { Collider } from "./collider";

export class Frame {

  rect: Rect;
  duration: number;
  offset: Point;
  hitboxes: Collider[];
  POIs: Point[];

  constructor(rect: Rect, duration: number, offset: Point) {
    this.rect = rect;
    this.duration = duration;
    this.offset = offset;
    this.hitboxes = [];
    this.POIs = [];
  }

  getBusterOffset() {
    if(this.POIs.length > 0)
      return this.POIs[0];
    return undefined;
  }

}