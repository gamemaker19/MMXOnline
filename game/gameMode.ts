import { Level } from "./level";
import { game, UIData } from "./game";
import { Player } from "./player";
import * as Helpers from "./helpers";
import { KillFeedEntry } from "./killFeedEntry";
import { Rect } from "./rect";
import { Sprite } from "./sprite";
import { Graphics } from "pixi.js";

export class GameMode {

  level: Level;
  isOver: boolean = false;
  isTeamMode: boolean = false;
  overTime: number = 0;
  time: number = 0;

  localPlayers: Player[] = [];
  players: Player[] = [];
  mainPlayer: Player;
  killFeed: KillFeedEntry[] = [];

  isBrawl: boolean = false;

  weaponHUDContainer: PIXI.Container;
  weaponHUDSprites: Sprite[] = [];
  weaponHUDLabels: PIXI.Text[] = [];
  selectedWeaponRect: PIXI.Graphics;
  topText: PIXI.Text;
  botText: PIXI.Text;
  killFeedContainer: PIXI.Container;
  winScreenContainer: PIXI.Container;
  winScreenTitle: PIXI.Text;
  winScreenSubtitle: PIXI.Text;
  scoreboardCharIcons: Sprite[] = [];
  readySprite: Sprite;
  spawnChar: boolean = false;
  
  get screenWidth() { return this.level.screenWidth }
  get screenHeight() { return this.level.screenHeight; }
  get zoomScale() { return this.level.zoomScale; }

  constructor(level: Level) {
    this.level = level;
  }

  isCtf() { return (this instanceof CTF); }

  setupPlayers() {
    document.onkeydown = (e) => {
      for(let player of this.localPlayers) {
        player.onKeyDown(e.keyCode);
      }
      if(e.keyCode === 9 || e.keyCode === 37 || e.keyCode === 38 || e.keyCode === 39 || e.keyCode === 40 || (e.keyCode >= 112 && e.keyCode <= 121)) {
        e.preventDefault();
      }
    }

    document.onkeyup = (e) => {
      for(let player of this.localPlayers) {
        player.onKeyUp(e.keyCode);
      }
      if(e.keyCode === 9 || e.keyCode === 37 || e.keyCode === 38 || e.keyCode === 39 || e.keyCode === 40 || (e.keyCode >= 112 && e.keyCode <= 124)) {
        e.preventDefault();
      }
    }

    game.uiCanvas.onmousedown = (e) => {
      for(let player of this.localPlayers) {
        player.onKeyDown(e.button);
      }
      e.preventDefault();
    }

    game.uiCanvas.oncontextmenu = (e) => {
      e.preventDefault();
    }

    game.uiCanvas.onmouseup = (e) => {
      for(let player of this.localPlayers) {
        player.onKeyUp(e.button);
      }
      e.preventDefault();
    }

    document.onwheel = (e) => {
      if(e.deltaY < 0) {
        for(let player of this.localPlayers) {
          player.onKeyDown(3);
        }
      }
      else if(e.deltaY > 0) {
        for(let player of this.localPlayers) {
          player.onKeyDown(4);
        }
      }
    }

  }

  destroy() {
    document.onkeydown = undefined;
    document.onkeyup = undefined;
    game.uiCanvas.onmousedown = undefined;
    game.uiCanvas.onmouseup = undefined;
    document.onwheel = undefined;
  }

  update() {
    
    this.time += game.deltaTime;
    if(this.time < 0.4) {
      this.readySprite.draw(Math.round( (this.time/0.4)*9 ));
    }
    else if(this.time < 1.75) {
      this.readySprite.draw(9);
      if(Math.round(this.time*7.5) % 2 === 0) {
        this.readySprite.pixiSprite.visible = true;
      }
      else {
        this.readySprite.pixiSprite.visible = false;
      }
    }
    else {
      this.spawnChar = true
      this.readySprite.pixiSprite.visible = false;
    }

    let removed = false;
    for(let i = this.killFeed.length - 1; i >= 0; i--) {
      let killFeed = this.killFeed[i];
      killFeed.time += game.deltaTime;
      if(killFeed.time > 8) {
        //@ts-ignore
        _.remove(this.killFeed, killFeed);
        removed = true;
      }
    }
    if(removed) {
      this.drawKillFeed();
    }

    //Sort players by score
    this.players.sort(function(a, b) {
      if(a.kills > b.kills) return -1;
      else if(a.kills === b.kills) {
        if(a.deaths < b.deaths) return -1;
        if(a.deaths === b.deaths) return 0;
        if(a.deaths > b.deaths) return 1;
      }
      else {
        return 1;
      }
    });

  }

  playWinMusic() {
    game.music = game.winMusic;
    game.music.seek(0);
    game.music.play("musicStart");
  }

  playLoseMusic() {
    game.music = game.loseMusic;
    game.music.seek(0);
    game.music.play("musicStart");
  }

  createHUD() {
    if(!this.isBrawl) {
      this.createWeaponSwitchHUD();
    }
    this.createTopHUD();
    this.killFeedContainer = new PIXI.Container();
    game.level.uiContainer.addChild(this.killFeedContainer);
    this.createWinScreenHUD();
    this.createScoreboardHUD();
    this.readySprite = game.sprites["ready"].createAndDraw(game.level.uiContainer, 0, (this.screenWidth/2) - 21, this.screenHeight/2);
    if(this.isBrawl) {
      this.killFeedContainer.visible = false;
    }
  }

  createScoreboardHUD() {

  }

  createWinScreenHUD() {
    this.winScreenContainer = new PIXI.Container();
    this.winScreenTitle = Helpers.createAndDrawText(this.winScreenContainer, "", this.screenWidth/2, this.screenHeight/2, 24, "center", "middle");
    this.winScreenSubtitle = Helpers.createAndDrawText(this.winScreenContainer, "", this.screenWidth/2, (this.screenHeight/2) + 30, 12, "center", "top");
    game.level.uiContainer.addChild(this.winScreenContainer);
    this.winScreenContainer.visible = false;
  }

  drawHUD() {
    if(this.isOver) {
      this.drawWinScreen();
    }
  }

  checkIfWin() {
  }
  
  getWinner(): Player {
    //@ts-ignore
    return _.find(this.players, (player) => {
      return player.won;
    });
  }

  drawWinScreen() {

  }

  createWeaponSwitchHUD() {
    this.weaponHUDContainer = new PIXI.Container();
    game.level.uiContainer.addChild(this.weaponHUDContainer);
    let startX = Math.round(this.screenWidth * 0.43);
    let width = 20;
    let iconW = 9;
    let iconH = 9;
    let startY = this.screenHeight - 18;
    for(let i = 0; i < this.mainPlayer.weapons.length; i++) {
      let x = startX + (i * width);
      let y = startY;
      let sprite = game.sprites["hud_weapon_icon"].createAndDraw(this.weaponHUDContainer, i, x, y);
      this.weaponHUDSprites.push(sprite);
      let text = Helpers.createAndDrawText(this.weaponHUDContainer, String(i+1), x, y + 8, 6, "", "top");
    }
    this.selectedWeaponRect = Helpers.createAndDrawRect(this.weaponHUDContainer, new Rect(0, 0, iconW*2, iconH*2), undefined, 0x90EE90, 1);
  }

  drawWeaponSwitchHUD() {
    this.weaponHUDContainer.visible = game.options.showWeaponHUD && !game.level.mainPlayer.isZero;
    let startX = Math.round(this.screenWidth * 0.43);
    let width = 20;
    let iconW = 9;
    let iconH = 9;
    let startY = this.screenHeight - 18;
    for(let i = 0; i < this.mainPlayer.weapons.length; i++) {
      let x = startX + (i * width);
      let y = startY;
      if(this.mainPlayer.weaponIndex === i) {
        this.selectedWeaponRect.x = x - iconW;
        this.selectedWeaponRect.y = y - iconH;
      }
      this.weaponHUDSprites[i].draw(this.mainPlayer.weapons[i].index);
    }
  }

  addKillFeedEntry(killFeed: KillFeedEntry) {
    this.killFeed.unshift(killFeed);
    if(this.killFeed.length > 4) this.killFeed.pop();
    this.drawKillFeed();
  }

  createTopHUD() {
    this.topText = Helpers.createAndDrawText(game.level.uiContainer, "", 5, 5, 8, "left", "top");
    this.botText = Helpers.createAndDrawText(game.level.uiContainer, "", 5, 15, 8, "left", "top");
  }

  drawTopHUD() {
    let placeStr = "";
    let place = this.players.indexOf(this.mainPlayer) + 1;
    if(place === 1) placeStr = "1st";  
    else if(place === 2) placeStr = "2nd";
    else if(place === 3) placeStr = "3rd";
    else placeStr = String(place) + "th";
    this.topText.text = "Leader: " + String(this.currentWinner.kills);
    this.botText.text = "Kills: " + String(this.mainPlayer.kills) + "(" + placeStr + ")";
  }

  get currentWinner() {
    return this.players[0];
  }

  clearKillFeed() {
    for (var i = this.killFeedContainer.children.length - 1; i >= 0; i--) {	
      let child = this.killFeedContainer.children[i];
      this.killFeedContainer.removeChild(child);
      child.destroy(); 
    };
    /*
    game.level.uiContainer.removeChild(this.killFeedContainer);
    this.killFeedContainer.destroy({children:true,texture:true});
    this.killFeedContainer = new PIXI.Container();
    game.level.uiContainer.addChild(this.killFeedContainer);
    */
  }

  drawKillFeed() {
    this.clearKillFeed();
    let fromRight = this.screenWidth - 10;
    let fromTop = 10;
    let yDist = 12;
    for(let i = 0; i < this.killFeed.length; i++) {
      let killFeed = this.killFeed[i];

      let msg = "";
      if(killFeed.killer) {
        msg = killFeed.killer.name + "    " + killFeed.victim.name;
      }
      else if(killFeed.victim && !killFeed.customMessage) {
        msg = killFeed.victim.name + " died";
      }
      else {
        msg = killFeed.customMessage;
      }
      game.uiCtx.font = "6px mmx_font";
      if(killFeed.killer === this.mainPlayer || killFeed.victim == this.mainPlayer) {
        let msgLen = game.uiCtx.measureText(msg).width;
        let msgHeight = 10;
        Helpers.createAndDrawRect(this.killFeedContainer, new Rect(fromRight - msgLen - 2, fromTop - 2 + (i*yDist) - msgHeight/2, fromRight + 2, fromTop - 2 + msgHeight/2 + (i*yDist)), 0x000000, 0xFFFFFF, 1, 0.75);
      }

      let isKillerRed = killFeed.killer && killFeed.killer.alliance === 1 && this.isTeamMode;
      let isVictimRed = killFeed.victim && killFeed.victim.alliance === 1 && this.isTeamMode;
      if(!killFeed.victim) isVictimRed = killFeed.customMessageAlliance === 0 ? false : true;

      if(killFeed.killer) {
        let nameLen = game.uiCtx.measureText(killFeed.victim.name).width;
        Helpers.createAndDrawText(this.killFeedContainer, killFeed.victim.name, fromRight, fromTop + (i*yDist) - 5, 6, "right", "top", isVictimRed);
        let victimNameWidth = game.uiCtx.measureText(killFeed.victim.name).width;
        Helpers.createAndDrawText(this.killFeedContainer, killFeed.killer.name + "    ", fromRight - victimNameWidth, fromTop + (i*yDist) - 5, 6, "right", "top", isKillerRed);
        let weaponIndex = killFeed.weapon.index;
        game.sprites["hud_killfeed_weapon"].createAndDraw(this.killFeedContainer, weaponIndex, fromRight - nameLen - 13, fromTop + (i*yDist) - 2, undefined, undefined, undefined, undefined, undefined);
      }
      else {
        Helpers.createAndDrawText(this.killFeedContainer, msg, fromRight, fromTop + (i*yDist) - 5, 6, "right", "top", isVictimRed);
      }
      
    }
  }

  restart() {
    if(game.shouldLog()) {
      //@ts-ignore
      gtag('event', 'end game', {
        'event_label': this.level.mainPlayer.won ? "win" : "lose"
      });
      //@ts-ignore
      gtag('event', 'fps2', {
        'event_label': game.userGameData,
        'value': game.getAvgFps()
      });
    }
    game.restartLevel(this.level.levelData.name);
  }

}

export class Brawl extends GameMode {

  constructor(level: Level, uiData: UIData) {
    super(level);

    this.isBrawl = true;
    
    let health = 32;

    let p1Name = uiData.isPlayer1CPU ? "CPU" : "Player 1";
    let p2Name = uiData.isPlayer2CPU ? "CPU" : "Player 2";

    let player1 = new Player(p1Name, uiData.isPlayer1Zero, uiData.isPlayer1CPU, false, 0, health);
    let player2 = new Player(p2Name, uiData.isPlayer2Zero, uiData.isPlayer2CPU, true, 1, health, game.palettes["red"]);
    
    this.players.push(player1);
    this.localPlayers.push(player1);
    this.mainPlayer = player1;
    
    this.players.push(player2);
    this.localPlayers.push(player2);

    this.setupPlayers();
  }

  drawHUD() {
    super.drawHUD();
  }

  drawWinScreen() {
    let winner = this.getWinner();
    if(winner) {
      this.winScreenTitle.style.fontSize = 42;
      this.winScreenContainer.visible = true;
      this.winScreenTitle.text = winner.name + " wins!";
    }
  }


  checkIfWin() {
    if(!this.isOver) {
      let allianceGroups: { [alliance: number]: Player[] } = {};
      for(let player of this.level.players) {
        if(!player.character) continue;
        if(!allianceGroups[player.alliance]) allianceGroups[player.alliance] = [];
        allianceGroups[player.alliance].push(player);
      }
      if(Object.keys(allianceGroups).length === 1) {
        for(let alliance in allianceGroups) {
          for(let player of allianceGroups[alliance]) {
            player.won = true;
            this.isOver = true;
          }
        }
      }
      /*
      //@ts-ignore
      let deadPlayer = _.find(this.level.players, (player) => {
        return !player.character;
      });
      if(deadPlayer) {
        for(let player of this.level.players) {
          if(player.character) {
            this.isOver = true;
            player.won = true;
          }
        }
      }
      */
      if(this.isOver) {
        if(game.music) {
          game.music.stop();
        }
        this.playWinMusic();
      }
    }
    else {
      this.overTime += game.deltaTime;
      if(this.overTime > 10) {
        this.restart();
      }
    }

  }

}

export class FFADeathMatch extends GameMode {

  killsToWin: number = 20;
  scoreboardTexts: PIXI.Text[][] = [];
  scoreboardRowCount: number = 12;
  scoreboardContainer: PIXI.Container;
  
  constructor(level: Level, uiData: UIData) {
    super(level);
    this.killsToWin = uiData.playTo;
    let health = 16;
    let player1 = new Player(game.uiData.playerName, uiData.isPlayer1Zero, false, false, 0, health);
    this.players.push(player1);
    this.localPlayers.push(player1);
    this.mainPlayer = player1;
    
    for(var i = 0; i < uiData.numBots; i++) {
      let cpu: Player = new Player("CPU" + String(i+1), Helpers.randomRange(0, 1) === 0 ? true : false, true, false, i + 1, health, game.palettes["red"]);
      this.players.push(cpu);
      this.localPlayers.push(cpu);
    }

    this.setupPlayers();
  }

  drawHUD() {
    
    super.drawHUD();

    this.drawTopHUD();
    this.drawWeaponSwitchHUD();

    this.drawScoreboard();
    
  }

  drawWinScreen() {
    this.winScreenContainer.visible = true;
    if(this.mainPlayer.won) {
      this.winScreenTitle.text = "You won!";
    }
    else {
      this.winScreenTitle.text = "You lost!";
      //@ts-ignore
      let winner = _.find(this.players, (player) => {
        return player.won;
      });
      this.winScreenSubtitle.text = winner.name + " wins";
    }
  }

  createScoreboardHUD() {
    this.scoreboardContainer = new PIXI.Container();
    game.level.uiContainer.addChild(this.scoreboardContainer);
    let padding = 10;
    let top = padding + 2;
    let fontSize = 8;
    let col1x = padding + 10;
    let col2x = this.screenWidth * 0.33;
    let col3x = this.screenWidth * 0.5;
    let col4x = this.screenWidth * 0.75;
    let lineY = padding + 35;
    let labelY = lineY - 1;
    let labelTextY = labelY + 3;
    let line2Y = labelY + 12;
    let topPlayerY = line2Y + 2;
    Helpers.createAndDrawRect(this.scoreboardContainer, new Rect(padding, padding, this.screenWidth - padding, this.screenHeight - padding), 0x000000, undefined, undefined, 0.75);
    Helpers.createAndDrawText(this.scoreboardContainer, "Game Mode: FFA Deathmatch", padding + 10, top, fontSize, "left", "top", undefined, "white");
    Helpers.createAndDrawText(this.scoreboardContainer, "Map: " + this.level.levelData.name, padding + 10, top + 10, fontSize, "left", "top", undefined, "white");
    Helpers.createAndDrawText(this.scoreboardContainer, "Playing to: " + String(this.killsToWin), padding + 10, top + 20, fontSize, "left", "top", undefined, "white");
    Helpers.createAndDrawLine(this.scoreboardContainer, padding + 10, lineY, this.screenWidth - padding - 10, lineY, 0xFFFFFF, 1);
    Helpers.createAndDrawText(this.scoreboardContainer, "Player", col1x, labelTextY, fontSize, "left", "top", undefined, "white");
    Helpers.createAndDrawText(this.scoreboardContainer, "Char", col2x, labelTextY, fontSize, "left", "top", undefined, "white");
    Helpers.createAndDrawText(this.scoreboardContainer, "Kills", col3x, labelTextY, fontSize, "left", "top", undefined, "white");
    Helpers.createAndDrawText(this.scoreboardContainer, "Deaths", col4x, labelTextY, fontSize, "left", "top", undefined, "white");
    Helpers.createAndDrawLine(this.scoreboardContainer, padding + 10, line2Y, this.screenWidth - padding - 10, line2Y, 0xFFFFFF, 1);
    let rowH = 10;
    for(let i = 0; i < this.scoreboardRowCount; i++) {
      let text1 = Helpers.createAndDrawText(this.scoreboardContainer, "", col1x, topPlayerY + (i)*rowH, fontSize, "left", "top", undefined, "white");
      let text2 = Helpers.createAndDrawText(this.scoreboardContainer, "", col3x, topPlayerY + (i)*rowH, fontSize, "left", "top", undefined, "white");
      let text3 = Helpers.createAndDrawText(this.scoreboardContainer, "", col4x, topPlayerY + (i)*rowH, fontSize, "left", "top", undefined, "white");
      this.scoreboardTexts.push([text1, text2, text3]);
      this.scoreboardCharIcons.push(game.sprites["char_icon"].createAndDraw(this.scoreboardContainer, 0, col2x + 4, topPlayerY + (i)*rowH));
    }
    this.scoreboardContainer.visible = false;
  }

  drawScoreboard() {
    if(!this.mainPlayer) {
      this.scoreboardContainer.visible = false;
      return;
    }
    if(!this.mainPlayer.isHeld("scoreboard", false)) {
      this.scoreboardContainer.visible = false;
      return;  
    }
    this.scoreboardContainer.visible = true;
    for(let i = 0; i < this.scoreboardRowCount; i++) {
      let row = this.scoreboardTexts[i];
      let charIcon = this.scoreboardCharIcons[i];
      if(i < this.players.length) {
        let player = this.players[i];
        let color = (player === this.mainPlayer) ? "lightgreen" : "white";
        for(let text of row) {
          text.visible = true;
          text.style.fill = color;
        }
        row[0].text = player.name;
        row[1].text = String(player.kills);
        row[2].text = String(player.deaths);
        
        charIcon.pixiSprite.visible = true;
        charIcon.draw(player.isZero ? 1 : 0);
      }
      else {
        charIcon.pixiSprite.visible = false;
        row[0].visible = false;
        row[1].visible = false;
        row[2].visible = false;
      }
    }
  }

  checkIfWin() {
    if(!this.isOver) {
      for(let player of this.level.players) {
        if(player.kills >= this.killsToWin) {
          this.isOver = true;
          player.won = true;
        }
      }
      if(this.isOver) {
        if(game.music) {
          game.music.stop();
        }
        if(this.level.mainPlayer && this.level.mainPlayer.won) {
          this.playWinMusic();
        }
        else if(this.level.mainPlayer && !this.level.mainPlayer.won) {
          this.playLoseMusic();
        }
      }
    }
    else {
      this.overTime += game.deltaTime;
      if(this.overTime > 10) {
        this.restart();
      }
    }

  }

}

export class TeamDeathMatch extends GameMode {

  killsToWin: number = 50;

  constructor(level: Level, uiData: UIData) {
    super(level);
    this.isTeamMode = true;
    this.killsToWin = uiData.playTo;
    let health = 16;
    let player1 = new Player(game.uiData.playerName, uiData.isPlayer1Zero, false, false, game.uiData.player1Team === "red" ? 1 : 0, health);
    this.players.push(player1);
    this.localPlayers.push(player1);
    this.mainPlayer = player1;
    
    for(var i = 0; i < uiData.numRed; i++) {
      let alliance = 1;
      let cpu: Player = new Player("CPU" + String(i+1), Helpers.randomRange(0, 1) === 0 ? false : true, true, false, alliance, health, undefined);
      this.players.push(cpu);
      this.localPlayers.push(cpu);
    }
    for(var i = 0; i < uiData.numBlue; i++) {
      let alliance = 0;
      let cpu: Player = new Player("CPU" + String(i+1), Helpers.randomRange(0, 1) === 0 ? false : true, true, false, alliance, health, undefined);
      this.players.push(cpu);
      this.localPlayers.push(cpu);
    }

    this.setupPlayers();
  }

  drawHUD() {
    
    super.drawHUD();

    this.drawTopHUD();
    this.drawWeaponSwitchHUD();

    this.drawScoreboard();
  }

  drawTopHUD() {
    let blueKills = 0;
    let redKills = 0;
    for(let player of this.level.players) {
      if(player.alliance === 0) blueKills+=player.kills;
      else redKills+=player.kills;
    }
    if(redKills > blueKills) {
      this.topText.text = "Red: " + String(redKills);
      this.botText.text = "Blue: " + String(blueKills);
      Helpers.setTextGradient(this.topText, true);
      Helpers.setTextGradient(this.botText, false);
    }
    else {
      this.botText.text = "Red: " + String(redKills);
      this.topText.text = "Blue: " + String(blueKills);
      Helpers.setTextGradient(this.botText, true);
      Helpers.setTextGradient(this.topText, false);
    }
  }

  drawWinScreen() {
    let team: string;
    if(this.mainPlayer.won) {
      team = this.mainPlayer.alliance === 0 ? "Blue" : "Red";
    }
    else {
      team = this.mainPlayer.alliance === 0 ? "Red" : "Blue";
    }
    this.winScreenTitle.text = team + " team won!";
    this.winScreenTitle.style.fontSize = 48;
    this.winScreenContainer.visible = true;
  }
  
  blueCharIcons: Sprite[] = [];
  redCharIcons: Sprite[] = [];
  blueScoreText: PIXI.Text;
  redScoreText: PIXI.Text;
  blueScoreboardTexts: PIXI.Text[][] = [];
  redScoreboardTexts: PIXI.Text[][] = [];
  scoreboardRowCount: number = 12;
  scoreboardContainer: PIXI.Container;
  createScoreboardHUD() {
    this.scoreboardContainer = new PIXI.Container();
    game.level.uiContainer.addChild(this.scoreboardContainer);

    let padding = 10;
    let hPadding = padding + 5;
    let fontSize = 8;
    let col1x = padding + 5;
    let col2x = col1x - 11;
    let col3x = this.screenWidth * 0.3;
    let col4x = this.screenWidth * 0.4;
    let teamLabelY = padding + 40;
    let lineY = teamLabelY + 10;
    let labelY = lineY + 5;
    let line2Y = labelY + 10;
    let topPlayerY = line2Y + 5;

    Helpers.createAndDrawRect(this.scoreboardContainer, new Rect(0, 0, this.screenWidth, this.screenHeight), 0x000000, undefined, undefined, 0.75);
    Helpers.createAndDrawText(this.scoreboardContainer, "Game Mode: Team Deathmatch", hPadding, padding + 10 - 5, fontSize, "left", "top", false, "white");
    Helpers.createAndDrawText(this.scoreboardContainer, "Map: " + this.level.levelData.name, hPadding, padding + 20 - 5, fontSize, "left", "top", false, "white");
    Helpers.createAndDrawText(this.scoreboardContainer, "Playing to: " + String(this.killsToWin), hPadding, padding + 30 - 5, fontSize, "left", "top", false, "white");
    Helpers.createAndDrawLine(this.scoreboardContainer, hPadding, lineY, this.screenWidth - hPadding, lineY, 0xFFFFFF, 1);

    //Blue
    this.blueScoreText = Helpers.createAndDrawText(this.scoreboardContainer, "Blue: ", col1x, teamLabelY, fontSize, "left", "top");
    Helpers.createAndDrawText(this.scoreboardContainer, "Player", col1x, labelY, fontSize, "left", "top", false, "white");
    //Helpers.createAndDrawText(this.scoreboardContainer, "C", col2x, labelY, fontSize, "left", "top", false, "white");
    Helpers.createAndDrawText(this.scoreboardContainer, "K", col3x, labelY, fontSize, "left", "top", false, "white");
    Helpers.createAndDrawText(this.scoreboardContainer, "D", col4x, labelY, fontSize, "left", "top", false, "white");

    //Red
    this.redScoreText = Helpers.createAndDrawText(this.scoreboardContainer, "Red: ", this.screenWidth*0.5 + col1x, teamLabelY, fontSize, "left", "top", true);
    Helpers.createAndDrawText(this.scoreboardContainer, "Player", this.screenWidth*0.5 + col1x, labelY, fontSize, "left", "top", false, "white");
    //Helpers.createAndDrawText(this.scoreboardContainer, "C", this.screenWidth*0.5 + col2x, labelY, fontSize, "left", "top", false, "white");
    Helpers.createAndDrawText(this.scoreboardContainer, "K", this.screenWidth*0.5 + col3x, labelY, fontSize, "left", "top", false, "white");
    Helpers.createAndDrawText(this.scoreboardContainer, "D", this.screenWidth*0.5 + col4x, labelY, fontSize, "left", "top", false, "white");
    
    /*
    Helpers.drawLine(this.scoreboardContainer, col2x - 5, lineY, col2x - 5, lineY + this.screenHeight * 0.5, "white", 1);
    Helpers.drawLine(this.scoreboardContainer, col3x - 5, lineY, col3x - 5, lineY + this.screenHeight * 0.5, "white", 1);
    Helpers.drawLine(this.scoreboardContainer, this.screenWidth*0.5 + col2x - 5, lineY, this.screenWidth*0.5 + col2x - 5, lineY + this.screenHeight * 0.5, "white", 1);
    Helpers.drawLine(this.scoreboardContainer, this.screenWidth*0.5 + col3x - 5, lineY, this.screenWidth*0.5 + col3x - 5, lineY + this.screenHeight * 0.5, "white", 1);
    */

    Helpers.createAndDrawLine(this.scoreboardContainer, hPadding, line2Y, this.screenWidth - hPadding, line2Y, 0xFFFFFF, 1);
    let rowH = 10;
    for(let i = 0; i < this.scoreboardRowCount; i++) {
      let text1 = Helpers.createAndDrawText(this.scoreboardContainer, "", col1x, topPlayerY + (i)*rowH, fontSize, "left", "top", false, "blue");
      let text2 = Helpers.createAndDrawText(this.scoreboardContainer, "", col3x, topPlayerY + (i)*rowH, fontSize, "left", "top", false, "blue");
      let text3 = Helpers.createAndDrawText(this.scoreboardContainer, "", col4x, topPlayerY + (i)*rowH, fontSize, "left", "top", false, "blue");
      this.blueScoreboardTexts.push([text1, text2, text3]);
      this.blueCharIcons.push(game.sprites["char_icon"].createAndDraw(this.scoreboardContainer, 0, col2x + 4, topPlayerY + (i)*rowH));
    }
    for(let i = 0; i < this.scoreboardRowCount; i++) {
      let text1 = Helpers.createAndDrawText(this.scoreboardContainer, "", this.screenWidth*0.5 + col1x, topPlayerY + (i)*rowH, fontSize, "left", "top", true, "red");
      let text2 = Helpers.createAndDrawText(this.scoreboardContainer, "", this.screenWidth*0.5 + col3x, topPlayerY + (i)*rowH, fontSize, "left", "top", true, "red");
      let text3 = Helpers.createAndDrawText(this.scoreboardContainer, "", this.screenWidth*0.5 + col4x, topPlayerY + (i)*rowH, fontSize, "left", "top", true, "red");
      this.redScoreboardTexts.push([text1, text2, text3]);
      this.redCharIcons.push(game.sprites["char_icon"].createAndDraw(this.scoreboardContainer, 0, this.screenWidth*0.5 + col2x + 4, topPlayerY  + (i)*rowH));
    }

    this.scoreboardContainer.visible = false;
  }

  drawScoreboard() {
    if(!this.mainPlayer) {
      this.scoreboardContainer.visible = false;
      return;
    }
    if(!this.mainPlayer.isHeld("scoreboard", false)) {
      this.scoreboardContainer.visible = false;
      return;  
    }

    this.scoreboardContainer.visible = true;
    let blueKills = 0;
    let redKills = 0;
    for(let player of this.level.players) {
      if(player.alliance === 0) blueKills+=player.kills;
      else redKills+=player.kills;
    }

    //@ts-ignore
    let redPlayers = _.filter(this.players, (player) => {
      return player.alliance === 1;
    });
    //@ts-ignore
    let bluePlayers = _.filter(this.players, (player) => {
      return player.alliance === 0;
    });

    this.blueScoreText.text = "Blue: " + String(blueKills);
    this.redScoreText.text = "Red: " + String(redKills);
    for(let i = 0; i < this.scoreboardRowCount; i++) {
      //Blue
      let rowBlue = this.blueScoreboardTexts[i];
      let charIconBlue = this.blueCharIcons[i];
      if(i < bluePlayers.length) {
        let player = bluePlayers[i];
        let color = (player === this.mainPlayer) ? "lightgreen" : "lightblue";
        for(let text of rowBlue) {
          text.visible = true;
          text.style.fill = color;
        }
        rowBlue[0].text = player.name;
        rowBlue[1].text = String(player.kills);
        rowBlue[2].text = String(player.deaths);
        charIconBlue.pixiSprite.visible = true;
        charIconBlue.draw(player.isZero ? 1 : 0);
      }
      else {
        rowBlue[0].visible = false;
        rowBlue[1].visible = false;
        rowBlue[2].visible = false;
        charIconBlue.pixiSprite.visible = false;
      }
      //Red
      let rowRed = this.redScoreboardTexts[i];
      let charIconRed = this.redCharIcons[i];
      if(i < redPlayers.length) {
        let player = redPlayers[i];
        let color = (player === this.mainPlayer) ? "lightgreen" : "pink";
        for(let text of rowRed) {
          text.visible = true;
          text.style.fill = color;
        }
        rowRed[0].text = player.name;
        rowRed[1].text = String(player.kills);
        rowRed[2].text = String(player.deaths);
        charIconRed.draw(player.isZero ? 1 : 0);
      }
      else {
        rowRed[0].visible = false;
        rowRed[1].visible = false;
        rowRed[2].visible = false;
        charIconRed.pixiSprite.visible = false;
      }
    }
  }

  checkIfWin() {
    if(!this.isOver) {
      let blueKills = 0;
      let redKills = 0;
      for(let player of this.level.players) {
        if(player.alliance === 0) blueKills+=player.kills;
        else redKills+=player.kills;
      }

      if(blueKills >= this.killsToWin) {
        this.isOver = true;
        //@ts-ignore
        _.each(this.players, (player) => {
          if(player.alliance === 0) {
            player.won = true;
          }
        });
      }
      else if(redKills >= this.killsToWin) {
        this.isOver = true;
        //@ts-ignore
        _.each(this.players, (player) => {
          if(player.alliance === 1) {
            player.won = true;
          }
        });
      }

      if(this.isOver) {
        if(game.music) {
          game.music.stop();
        }
        if(this.level.mainPlayer && this.level.mainPlayer.won) {
          this.playWinMusic();
        }
        else if(this.level.mainPlayer && !this.level.mainPlayer.won) {
          this.playLoseMusic();
        }
      }
    }
    else {
      this.overTime += game.deltaTime;
      if(this.overTime > 10) {
        this.restart();
      }
    }

  }

}


export class CTF extends GameMode {

  capturesToWin: number = 3;
  blueCaptures: number = 0;
  redCaptures: number = 0;

  constructor(level: Level, uiData: UIData) {
    super(level);
    this.isTeamMode = true;
    this.capturesToWin = uiData.playTo;
    let health = 16;
    let player1 = new Player(game.uiData.playerName, uiData.isPlayer1Zero, false, false, uiData.player1Team === "red" ? 1 : 0, health);
    this.players.push(player1);
    this.localPlayers.push(player1);
    this.mainPlayer = player1;
    
    for(var i = 0; i < uiData.numRed; i++) {
      let alliance = 1;
      let cpu: Player = new Player("CPU" + String(i+1), Helpers.randomRange(0, 1) === 0 ? false : true, true, false, alliance, health, undefined);
      this.players.push(cpu);
      this.localPlayers.push(cpu);
    }
    for(var i = 0; i < uiData.numBlue; i++) {
      let alliance = 0;
      let cpu: Player = new Player("CPU" + String(i+1), Helpers.randomRange(0, 1) === 0 ? false : true, true, false, alliance, health, undefined);
      this.players.push(cpu);
      this.localPlayers.push(cpu);
    }

    this.setupPlayers();
  }

  drawHUD() {
    
    super.drawHUD();

    this.drawTopHUD();
    this.drawWeaponSwitchHUD();

    this.drawScoreboard();
  }

  drawTopHUD() {
    if(this.redCaptures > this.blueCaptures) {
      this.topText.text = "Red: " + String(this.redCaptures);
      this.botText.text = "Blue: " + String(this.blueCaptures);
      Helpers.setTextGradient(this.topText, true);
      Helpers.setTextGradient(this.botText, false);
    }
    else {
      this.botText.text = "Red: " + String(this.redCaptures);
      this.topText.text = "Blue: " + String(this.blueCaptures);
      Helpers.setTextGradient(this.botText, true);
      Helpers.setTextGradient(this.topText, false);
    }
  }

  drawWinScreen() {
    let team: string;
    if(this.mainPlayer.won) {
      team = this.mainPlayer.alliance === 0 ? "Blue" : "Red";
    }
    else {
      team = this.mainPlayer.alliance === 0 ? "Red" : "Blue";
    }
    this.winScreenTitle.text = team + " team won!";
    this.winScreenTitle.style.fontSize = 48;
    this.winScreenContainer.visible = true;
  }
  
  blueCharIcons: Sprite[] = [];
  redCharIcons: Sprite[] = [];
  blueScoreText: PIXI.Text;
  redScoreText: PIXI.Text;
  blueScoreboardTexts: PIXI.Text[][] = [];
  redScoreboardTexts: PIXI.Text[][] = [];
  scoreboardRowCount: number = 12;
  scoreboardContainer: PIXI.Container;
  createScoreboardHUD() {
    this.scoreboardContainer = new PIXI.Container();
    game.level.uiContainer.addChild(this.scoreboardContainer);

    let padding = 10;
    let hPadding = padding + 5;
    let fontSize = 8;
    let col1x = padding + 5;
    let col2x = col1x - 11;
    let col3x = this.screenWidth * 0.3;
    let col4x = this.screenWidth * 0.4;
    let teamLabelY = padding + 40;
    let lineY = teamLabelY + 10;
    let labelY = lineY + 5;
    let line2Y = labelY + 10;
    let topPlayerY = line2Y + 5;

    Helpers.createAndDrawRect(this.scoreboardContainer, new Rect(0, 0, this.screenWidth, this.screenHeight), 0x000000, undefined, undefined, 0.75);
    Helpers.createAndDrawText(this.scoreboardContainer, "Game Mode: Capture the Flag", hPadding, padding + 10 - 5, fontSize, "left", "top", false, "white");
    Helpers.createAndDrawText(this.scoreboardContainer, "Map: " + this.level.levelData.name, hPadding, padding + 20 - 5, fontSize, "left", "top", false, "white");
    Helpers.createAndDrawText(this.scoreboardContainer, "Playing to: " + String(this.capturesToWin), hPadding, padding + 30 - 5, fontSize, "left", "top", false, "white");
    Helpers.createAndDrawLine(this.scoreboardContainer, hPadding, lineY, this.screenWidth - hPadding, lineY, 0xFFFFFF, 1);

    //Blue
    this.blueScoreText = Helpers.createAndDrawText(this.scoreboardContainer, "Blue: ", col1x, teamLabelY, fontSize, "left", "top");
    Helpers.createAndDrawText(this.scoreboardContainer, "Player", col1x, labelY, fontSize, "left", "top", false, "white");
    //Helpers.createAndDrawText(this.scoreboardContainer, "C", col2x, labelY, fontSize, "left", "top", false, "white");
    Helpers.createAndDrawText(this.scoreboardContainer, "K", col3x, labelY, fontSize, "left", "top", false, "white");
    Helpers.createAndDrawText(this.scoreboardContainer, "D", col4x, labelY, fontSize, "left", "top", false, "white");

    //Red
    this.redScoreText = Helpers.createAndDrawText(this.scoreboardContainer, "Red: ", this.screenWidth*0.5 + col1x, teamLabelY, fontSize, "left", "top", true);
    Helpers.createAndDrawText(this.scoreboardContainer, "Player", this.screenWidth*0.5 + col1x, labelY, fontSize, "left", "top", false, "white");
    //Helpers.createAndDrawText(this.scoreboardContainer, "C", this.screenWidth*0.5 + col2x, labelY, fontSize, "left", "top", false, "white");
    Helpers.createAndDrawText(this.scoreboardContainer, "K", this.screenWidth*0.5 + col3x, labelY, fontSize, "left", "top", false, "white");
    Helpers.createAndDrawText(this.scoreboardContainer, "D", this.screenWidth*0.5 + col4x, labelY, fontSize, "left", "top", false, "white");
    
    /*
    Helpers.drawLine(this.scoreboardContainer, col2x - 5, lineY, col2x - 5, lineY + this.screenHeight * 0.5, "white", 1);
    Helpers.drawLine(this.scoreboardContainer, col3x - 5, lineY, col3x - 5, lineY + this.screenHeight * 0.5, "white", 1);
    Helpers.drawLine(this.scoreboardContainer, this.screenWidth*0.5 + col2x - 5, lineY, this.screenWidth*0.5 + col2x - 5, lineY + this.screenHeight * 0.5, "white", 1);
    Helpers.drawLine(this.scoreboardContainer, this.screenWidth*0.5 + col3x - 5, lineY, this.screenWidth*0.5 + col3x - 5, lineY + this.screenHeight * 0.5, "white", 1);
    */

    Helpers.createAndDrawLine(this.scoreboardContainer, hPadding, line2Y, this.screenWidth - hPadding, line2Y, 0xFFFFFF, 1);
    let rowH = 10;
    for(let i = 0; i < this.scoreboardRowCount; i++) {
      let text1 = Helpers.createAndDrawText(this.scoreboardContainer, "", col1x, topPlayerY + (i)*rowH, fontSize, "left", "top", false, "blue");
      let text2 = Helpers.createAndDrawText(this.scoreboardContainer, "", col3x, topPlayerY + (i)*rowH, fontSize, "left", "top", false, "blue");
      let text3 = Helpers.createAndDrawText(this.scoreboardContainer, "", col4x, topPlayerY + (i)*rowH, fontSize, "left", "top", false, "blue");
      this.blueScoreboardTexts.push([text1, text2, text3]);
      this.blueCharIcons.push(game.sprites["char_icon"].createAndDraw(this.scoreboardContainer, 0, col2x + 4, topPlayerY + (i)*rowH));
    }
    for(let i = 0; i < this.scoreboardRowCount; i++) {
      let text1 = Helpers.createAndDrawText(this.scoreboardContainer, "", this.screenWidth*0.5 + col1x, topPlayerY + (i)*rowH, fontSize, "left", "top", true, "red");
      let text2 = Helpers.createAndDrawText(this.scoreboardContainer, "", this.screenWidth*0.5 + col3x, topPlayerY + (i)*rowH, fontSize, "left", "top", true, "red");
      let text3 = Helpers.createAndDrawText(this.scoreboardContainer, "", this.screenWidth*0.5 + col4x, topPlayerY + (i)*rowH, fontSize, "left", "top", true, "red");
      this.redScoreboardTexts.push([text1, text2, text3]);
      this.redCharIcons.push(game.sprites["char_icon"].createAndDraw(this.scoreboardContainer, 0, this.screenWidth*0.5 + col2x + 4, topPlayerY  + (i)*rowH));
    }

    this.scoreboardContainer.visible = false;
  }

  drawScoreboard() {
    if(!this.mainPlayer) {
      this.scoreboardContainer.visible = false;
      return;
    }
    if(!this.mainPlayer.isHeld("scoreboard", false)) {
      this.scoreboardContainer.visible = false;
      return;  
    }

    this.scoreboardContainer.visible = true;

    //@ts-ignore
    let redPlayers = _.filter(this.players, (player) => {
      return player.alliance === 1;
    });
    //@ts-ignore
    let bluePlayers = _.filter(this.players, (player) => {
      return player.alliance === 0;
    });

    this.blueScoreText.text = "Blue: " + String(this.blueCaptures);
    this.redScoreText.text = "Red: " + String(this.redCaptures);
    for(let i = 0; i < this.scoreboardRowCount; i++) {
      //Blue
      let rowBlue = this.blueScoreboardTexts[i];
      let charIconBlue = this.blueCharIcons[i];
      if(i < bluePlayers.length) {
        let player = bluePlayers[i];
        let color = (player === this.mainPlayer) ? "lightgreen" : "lightblue";
        for(let text of rowBlue) {
          text.visible = true;
          text.style.fill = color;
        }
        rowBlue[0].text = player.name;
        rowBlue[1].text = String(player.kills);
        rowBlue[2].text = String(player.deaths);
        charIconBlue.pixiSprite.visible = true;
        charIconBlue.draw(player.isZero ? 1 : 0);
      }
      else {
        rowBlue[0].visible = false;
        rowBlue[1].visible = false;
        rowBlue[2].visible = false;
        charIconBlue.pixiSprite.visible = false;
      }
      //Red
      let rowRed = this.redScoreboardTexts[i];
      let charIconRed = this.redCharIcons[i];
      if(i < redPlayers.length) {
        let player = redPlayers[i];
        let color = (player === this.mainPlayer) ? "lightgreen" : "pink";
        for(let text of rowRed) {
          text.visible = true;
          text.style.fill = color;
        }
        rowRed[0].text = player.name;
        rowRed[1].text = String(player.kills);
        rowRed[2].text = String(player.deaths);
        charIconRed.pixiSprite.visible = true;
        charIconRed.draw(player.isZero ? 1 : 0);
      }
      else {
        rowRed[0].visible = false;
        rowRed[1].visible = false;
        rowRed[2].visible = false;
        charIconRed.pixiSprite.visible = false;
      }
    }
  }

  checkIfWin() {
    if(!this.isOver) {
      
      if(this.blueCaptures >= this.capturesToWin) {
        this.isOver = true;
        //@ts-ignore
        _.each(this.players, (player) => {
          if(player.alliance === 0) {
            player.won = true;
          }
        });
      }
      else if(this.redCaptures >= this.capturesToWin) {
        this.isOver = true;
        //@ts-ignore
        _.each(this.players, (player) => {
          if(player.alliance === 1) {
            player.won = true;
          }
        });
      }

      if(this.isOver) {
        if(game.music) {
          game.music.stop();
        }
        if(this.level.mainPlayer && this.level.mainPlayer.won) {
          this.playWinMusic();
        }
        else if(this.level.mainPlayer && !this.level.mainPlayer.won) {
          this.playLoseMusic();
        }
      }
    }
    else {
      this.overTime += game.deltaTime;
      if(this.overTime > 10) {
        this.restart();
      }
    }

  }

}