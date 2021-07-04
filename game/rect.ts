import { Point } from "./point";
import { Shape } from "./shape";

export class Rect {

  topLeftPoint: Point;
  botRightPoint: Point;

  static Create(topLeftPoint: Point, botRightPoint: Point) {
    return new Rect(topLeftPoint.x, topLeftPoint.y, botRightPoint.x, botRightPoint.y);
  }

  constructor(x1: number, y1: number, x2: number, y2: number) {    
    this.topLeftPoint = new Point(x1, y1);
    this.botRightPoint = new Point(x2, y2);
  }

  getShape(): Shape {
    return new Shape([this.topLeftPoint, new Point(this.x2, this.y1), this.botRightPoint, new Point(this.x1, this.y2)]);
  }

  get midX(): number {
    return (this.topLeftPoint.x + this.botRightPoint.x) * 0.5;
  }
  get x1(): number {
    return this.topLeftPoint.x;
  }
  get y1(): number {
    return this.topLeftPoint.y;
  }
  get x2(): number {
    return this.botRightPoint.x;
  }
  get y2(): number {
    return this.botRightPoint.y;
  }

  get w(): number {
    return this.botRightPoint.x - this.topLeftPoint.x;
  }

  get h(): number {
    return this.botRightPoint.y - this.topLeftPoint.y;
  }

  getPoints(): Point[] {
    return [
      new Point(this.topLeftPoint.x, this.topLeftPoint.y),
      new Point(this.botRightPoint.x, this.topLeftPoint.y),
      new Point(this.botRightPoint.x, this.botRightPoint.y),
      new Point(this.topLeftPoint.x, this.botRightPoint.y),
    ];
  }

  overlaps(other: Rect) {
    // If one rectangle is on left side of other
    if (this.x1 > other.x2 || other.x1 > this.x2)
      return false;
    // If one rectangle is above other
    if (this.y1 > other.y2 || other.y1 > this.y2)
      return false;
    return true;
  }

  clone(x: number, y: number) {
    return new Rect(this.x1 + x, this.y1 + y, this.x2 + x, this.y2 + y);
  }
  
}