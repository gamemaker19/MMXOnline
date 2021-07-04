import { Rect } from "./rect";
import { Shape } from "./shape";

export enum Direction {
  Up,
  Down,
  Left,
  Right
}

export class NoScroll {

  shape: Shape;
  freeDir: Direction;
  constructor(shape: Shape, dir: Direction) {
    this.shape = shape;
    this.freeDir = dir;
  }

}