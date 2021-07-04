import { Collider, CollideData } from "./collider";

export interface GameObject {
  name: string;
  preUpdate(): void;
  update(): void;
  render(x: number, y: number): void;
  collider: Collider;
  onCollision(other: CollideData): void;
}