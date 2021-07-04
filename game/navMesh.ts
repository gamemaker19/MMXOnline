import { Point } from "./point";
import { Ladder } from "./wall";
import { GameObject } from "./gameObject";

export class NavMeshNode {

  name: string;
  pos: Point;
  neighbors: NavMeshNeighbor[] = [];
  neighborJson: string;
  isRedFlagNode: boolean; 
  isBlueFlagNode: boolean;
  
  constructor(name: string, pos: Point, neighborJson: any) {
    this.name = name;
    this.pos = pos;
    this.neighborJson = neighborJson;
    if(neighborJson.isBlueFlagNode) {
      this.isBlueFlagNode = true;
    }
    if(neighborJson.isRedFlagNode) {
      this.isRedFlagNode = true;
    }
  }

  setNeighbors(nodeList: NavMeshNode[], gameObjects: GameObject[]) {
    let properties: any = this.neighborJson;
    for(let jsonNeighbor of properties.neighbors) {
      //@ts-ignore
      let node = _.find(nodeList, (iterNode) => {
        return iterNode.name === jsonNeighbor.nodeName;
      });
      //@ts-ignore
      let ladder = _.find(gameObjects, (gameobject) => {
        return (gameobject instanceof Ladder) && gameobject.name === jsonNeighbor.ladderName;
      });
      let navMeshNeighbor = new NavMeshNeighbor(
        node, 
        jsonNeighbor.isJumpNode ? true : false,
        jsonNeighbor.isDropNode ? true: false, 
        <Ladder>ladder,
        jsonNeighbor.platformJumpDir ? jsonNeighbor.platformJumpDir : 0
      );
      this.neighbors.push(navMeshNeighbor);
    }
  }

  getNeighbor(neighborNode: NavMeshNode) {
    //@ts-ignore
    let node = _.find(this.neighbors, (neighbor) => {
      return neighbor.node === neighborNode;
    })
    return node;
  }

  getNodePath(destNode: NavMeshNode) {
    if(this === destNode) {
      return [destNode];
    }
    let found = false;
    let pathToNode: NavMeshNode[] = [];
    let foundPath: NavMeshNode[] = [];

    let visited = new Set();

    function getNextNodeDfs(curNode: NavMeshNode) {
      if(found) return;
      if(visited.has(curNode)) return;
      visited.add(curNode);

      if(!found && curNode === destNode) {
        found = true;
        foundPath = pathToNode.slice(0);
        return;
      }

      //@ts-ignore
      let neighbors = _.shuffle(curNode.neighbors);
      for(let neighbor of neighbors) {
        pathToNode.push(neighbor.node);
        getNextNodeDfs(neighbor.node);
        pathToNode.pop();
      }
    }
    
    getNextNodeDfs(this);
    if(foundPath.length > 0) {
      return foundPath;
    }
    console.log("Dest node is " + destNode.name);
    console.log("This node: " + this.name);
    throw "Next node not found!";
  }

}

export class NavMeshNeighbor {
  
  node: NavMeshNode;
  isJumpNode: boolean;
  platformJumpDir: number;
  isDropNode: boolean;
  ladder: Ladder;

  constructor(node: NavMeshNode, isJumpNode: boolean, isDropNode: boolean, ladder: Ladder, platformJumpDir: number) {
    this.node = node;
    this.isJumpNode = isJumpNode;
    this.isDropNode = isDropNode;
    this.ladder = ladder;
    this.platformJumpDir = platformJumpDir;
  }

}