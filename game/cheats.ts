import { game } from "./game";
import { Anim } from "./actor";
import { Point } from "./point";
import { KillFeedEntry } from "./killFeedEntry";

export function cheat(key: string, keycode: number) {

  if(game.uiData.isProd) return false;

  //F1
  if(keycode === 112) {
    for(let player of game.level.players) {
      player.health = 1;
      if(player !== game.level.mainPlayer) {
        //player.character.applyDamage(undefined, undefined, 1000);
      }
      //player.health = 1;
    }
    /*
    if(game.level.mainPlayer) {
      game.level.mainPlayer.character.pos.x = game.level.redFlag.pos.x - 100;
      game.level.mainPlayer.character.pos.y = game.level.redFlag.pos.y;
      game.level.computeCamPos(game.level.mainPlayer.character.getCamCenterPos());
    }
    */
  }
  //F2
  if(keycode === 113) {
    for(let player of game.level.players) { 
      
      if(!player.isAI && player !== game.level.mainPlayer) {
        player.isAI = true;
        player.character.addAI();
      }
      /*
      if(player.isAI) {
        player.character.ai = undefined;
        player.isAI = false;
        player.inputMapping = game.getPlayerControls(2);
        game.level.localPlayers.push(player);
      }
      */
    }
  }
  //F3
  if(keycode === 114) {
    game.level.mainPlayer.kills = 20;
  }
  //F4
  if(keycode === 115) {
    //@ts-ignore
    let cpu = _.find(game.level.players, (player) => {
      return player.isAI;
    });
    cpu.kills = 20;
  }
  //F5
  if(keycode === 116) {
    /*
    for(let i = 0; i < 10000; i++) {
      let test = new Anim(new Point(0, 0), game.sprites["buster1_fade"], 1);
      test.destroySelf();
    }
    */
   game.level.gameMode.addKillFeedEntry(new KillFeedEntry(undefined, game.level.mainPlayer, undefined));
  }

  if(keycode === 75) {
    game.level.mainPlayer.character.applyDamage(undefined, undefined, 100);
  }
  if(keycode === 116) {
    for(let player of game.level.players) {
      if(player.isAI) {
        player.character.changeWeapon(3);
        player.lockWeapon = true;
      }
    }
  }
  if(key === "reset") {
    game.restartLevel("sm_bossroom");
    return;
  }
  if(keycode === 80) {
    game.paused = !game.paused;
  }
}
