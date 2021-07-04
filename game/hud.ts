import { Level } from "./level";
import { Player } from "./player";
import { game } from "./game";
import { Sprite } from "./sprite";

export class PlayerHUD {

  container: PIXI.Container;
  ammoContainer: PIXI.Container;
  fullHealthBars: Sprite[] = [];
  emptyHealthBars: Sprite[] = [];
  fullAmmoBars: Sprite[] = [];
  emptyAmmoBars: Sprite[] = [];
  healthBase: Sprite;
  healthTop: Sprite;
  ammoBase: Sprite;
  ammoTop: Sprite;
  player: Player;
  playerNum: number;
  constructor(player: Player, playerNum: number, container: PIXI.Container) {
    this.player = player;
    this.playerNum = playerNum;
    this.container = container;

    //Health
    let baseX = 10;
    if(this.playerNum === 2) baseX = game.level.screenWidth - 4 - baseX;
    
    let baseY = game.level.screenHeight/2;
    baseY += 25;
    let healthBaseSprite = "hud_health_base";
    this.healthBase = game.sprites[healthBaseSprite].createAndDraw(container, 0, baseX, baseY, 1, 1, undefined, 1, this.player.palette);
    baseY -= 16;
    for(let i = 0; i < Math.ceil(this.player.maxHealth); i++) {
      this.emptyHealthBars.push(game.sprites["hud_health_empty"].createAndDraw(container, 0, baseX, baseY));
      this.fullHealthBars.push(game.sprites["hud_health_full"].createAndDraw(container, 0, baseX, baseY));
      baseY -= 2;
    }
    this.healthTop = game.sprites["hud_health_top"].createAndDraw(container, 0, baseX, baseY);

    this.ammoContainer = new PIXI.Container();
    this.container.addChild(this.ammoContainer);

    //Weapon
    baseX = 25;
    if(this.playerNum === 2) baseX = game.level.screenWidth - 4 - baseX;
    
    baseY = game.level.screenHeight/2;
    baseY += 25;
    this.ammoBase = game.sprites["hud_weapon_base"].createAndDraw(this.ammoContainer, this.player.weapon.spriteIndex, baseX, baseY);
    baseY -= 16;
    for(let i = 0; i < Math.ceil(this.player.weapon.ammo); i++) {
      this.emptyAmmoBars.push(game.sprites["hud_health_empty"].createAndDraw(this.ammoContainer, 0, baseX, baseY));
      this.fullAmmoBars.push(game.sprites["hud_weapon_full"].createAndDraw(this.ammoContainer, this.player.weapon.spriteIndex, baseX, baseY));
      baseY -= 2;
    }
    this.ammoTop = game.sprites["hud_health_top"].createAndDraw(this.ammoContainer, 0, baseX, baseY);
    
    this.ammoContainer.visible = false;

    this.update();
  }

  update() {
    
    for(let i = 0; i < Math.ceil(this.player.maxHealth); i++) {
      if(i < Math.ceil(this.player.health)) {
        this.fullHealthBars[i].pixiSprite.visible = true;
        this.emptyHealthBars[i].pixiSprite.visible = false;
      }
      else {
        this.fullHealthBars[i].pixiSprite.visible = false;
        this.emptyHealthBars[i].pixiSprite.visible = true;
      }
    }

    //Weapon
    if(!this.player.isZero) {
      this.healthBase.draw(0);
      this.ammoContainer.visible = true;
      this.ammoBase.draw(this.player.weapon.spriteIndex);
      for(let i = 0; i < Math.ceil(this.player.weapon.maxAmmo); i++) {
        this.fullAmmoBars[i].draw(this.player.weapon.spriteIndex);
        if(i < Math.ceil(this.player.weapon.ammo)) {
          this.fullAmmoBars[i].pixiSprite.visible = true;
          this.emptyAmmoBars[i].pixiSprite.visible = false;
        }
        else {
          this.fullAmmoBars[i].pixiSprite.visible = false;
          this.emptyAmmoBars[i].pixiSprite.visible = true;
        }
      }
    }
    else {
      this.healthBase.draw(1);
      this.ammoContainer.visible = false;
    }

  }

}

export class HUD {
  
  level: Level;
  player1HUD: PlayerHUD;
  player2HUD: PlayerHUD;

  constructor(level: Level) {
    this.level = level;
    this.player1HUD = new PlayerHUD(this.level.localPlayers[0], 1, this.level.uiContainer);
    if(this.level.localPlayers.length > 1 && this.level.gameMode.isBrawl) {
      this.player2HUD = new PlayerHUD(this.level.localPlayers[1], 2, this.level.uiContainer);
    }
    this.updateHUD();
  }
  
  updateHUD() {
    this.player1HUD.update();
    if(this.player2HUD) {
      this.player2HUD.update();
    }
  }
  
}