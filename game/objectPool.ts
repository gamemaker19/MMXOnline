import { Sprite } from "./sprite";

export interface PoolItem {
  isFree(): boolean;
  free(): void;
  reserve(): void;
}

export class ObjectPool {

  pool: { [key: string]: PoolItem[] } = {};
  maxSize: number = 24;

  constructor() {
  }

  get(key: string) {
    let pool = this.pool[key];
    if(!pool) {
      return undefined;
    }
    for(let poolItem of pool) {
      if(poolItem.isFree()) {
        poolItem.reserve();
        return poolItem;
      }
    }
    return undefined;
  }

  add(key: string, poolItem: PoolItem) {
    let pool = this.pool[key];
    if(!pool) {
      pool = [];
      this.pool[key] = pool;
    }
    else {
      if(pool.length > this.maxSize) {
        //console.log("Max pool size exceeded");
        //return;
      }
    }
    pool.push(poolItem);
  }

}