import { Character, CharState, Idle, WarpIn } from "./character";
import { Weapon, Buster, Torpedo, Sting, RollingShield, ShotgunIce, FireWave, Tornado, Boomerang, ElectricSpark } from "./weapon";
import { game, Menu } from "./game";
import { Palette } from "./color";
import { ElectricSparkProj } from "./projectile";
import * as Helpers from "./helpers";
import { cheat } from "./cheats";
import { Point } from "./point";
import { SpawnPoint } from "./spawnPoint";

export class Player {
  
  input: { [name: string]: boolean; } = {};
  inputPressed: { [name: string]: boolean } = {};

  controllerInput: { [name: string]: boolean; } = {};
  controllerInputPressed: { [name: string]: boolean } = {};

  inputMapping: { [code: number]: string } = {}; //Map game keycodes (i.e. "jump", "shoot" to js keycodes)
  buttonMapping: { [code: number]: string } = {};
  axesMapping: { [code: number]: string } = {};
  name: string;
  character: Character;
  alliance: number;
  health: number;
  maxHealth: number;
  weapons: Weapon[];
  weaponIndex: number;
  palette: Palette;
  id: number;
  isAI: boolean;
  respawnTime: number = 0;
  kills: number = 0;
  deaths: number = 0;
  won: boolean = false;
  lockWeapon: boolean = false;
  isZero: boolean = false;
  isPlayer2: boolean = false;

  constructor(name: string, isZero: boolean, isAI: boolean, isPlayer2: boolean, alliance: number, maxHealth: number, palette?: Palette) {
    this.name = name;
    this.alliance = alliance;
    this.id = Helpers.getAutoIncId();
    this.isAI = isAI;
    this.isPlayer2 = isPlayer2;
    this.palette = palette;
    this.isZero = isZero;

    if(game.uiData.isBrawl) {
      if(!isAI && alliance === 0) {
        this.inputMapping = game.getPlayerControls(1);
      }
      else if(!isAI && alliance === 1) {
        this.inputMapping = game.getPlayerControls(2);
      }
    }
    else {
      if(!isAI) {
        this.inputMapping = game.getPlayerControls(1);
      }
    }

    this.health = maxHealth;
    this.maxHealth = maxHealth;

    this.configureWeapons(isAI, isPlayer2);
  }
  
  configureWeapons(isAI: boolean, isPlayer2: boolean) {
    this.weapons = [];
    if(!isAI || isPlayer2) {
      let arr = isPlayer2 ? game.uiData.player2Weapons : game.uiData.player1Weapons;
      if(!game.uiData.isProd) arr = [true,true,true,true,true,true,true,true,true];
      if(arr[0]) this.weapons.push(new Buster());
      if(arr[1]) this.weapons.push(new Torpedo());
      if(arr[2]) this.weapons.push(new Sting());
      if(arr[3]) this.weapons.push(new RollingShield());
      if(arr[4]) this.weapons.push(new FireWave());
      if(arr[5]) this.weapons.push(new Tornado());
      if(arr[6]) this.weapons.push(new ElectricSpark());
      if(arr[7]) this.weapons.push(new Boomerang());
      if(arr[8]) this.weapons.push(new ShotgunIce());
    }
    else {
      let pool = [0,1,2,3,4,5,6,7,8];
      let nums: number[] = this.getRandomSubarray(pool, 3);
      for(let i = 0; i < nums.length; i++) {
        if(nums[i] === 0) this.weapons.push(new Buster());
        if(nums[i] === 1) this.weapons.push(new Torpedo());
        if(nums[i] === 2) this.weapons.push(new Sting());
        if(nums[i] === 3) this.weapons.push(new RollingShield());
        if(nums[i] === 4) this.weapons.push(new FireWave());
        if(nums[i] === 5) this.weapons.push(new Tornado());
        if(nums[i] === 6) this.weapons.push(new ElectricSpark());
        if(nums[i] === 7) this.weapons.push(new Boomerang());
        if(nums[i] === 8) this.weapons.push(new ShotgunIce());
      }
    }
    this.weaponIndex = 0;
  }

  getRandomSubarray(arr: number[], size: number) {
    var shuffled = arr.slice(0), i = arr.length, temp, index;
    while (i--) {
        index = Math.floor((i + 1) * Math.random());
        temp = shuffled[index];
        shuffled[index] = shuffled[i];
        shuffled[i] = temp;
    }
    return shuffled.slice(0, size);
  }

  updateControls() {
    
    if(!this.isAI && this.alliance === 0) {
      this.inputMapping = game.getPlayerControls(1);
    }
    else if(!this.isAI && this.alliance === 1) {
      this.inputMapping = game.getPlayerControls(2);
    }

  }

  warpedIn: boolean = false;
  update() {
    if(this.respawnTime === 0 && !this.character) {
      
      if(game.level.mainPlayer === this && game.level.gameMode.isTeamMode) {
        if(game.uiData.player1Team === "red") {
          this.alliance = 1;
        }
        else {
          this.alliance = 0;
        }
      }

      let spawnPoint = game.level.getSpawnPoint(this);
      if(!spawnPoint) return;
        
      if(game.level.mainPlayer === this) {
        this.isZero = game.uiData.isPlayer1Zero;
      }

      this.configureWeapons(this.isAI, this.isPlayer2);

      this.health = this.maxHealth;
      for(let weapon of this.weapons) {
        weapon.ammo = weapon.maxAmmo;
      }

      let charState: CharState = undefined;
      if(!this.warpedIn) {
        charState = new WarpIn();
      }
      else {
        charState = new Idle();
      }

      this.character = new Character(this, spawnPoint.pos.x, spawnPoint.getGroundY(), charState);
      if(!this.warpedIn) {
        this.character.isVisible = false;
      }
      if(this.isAI) {
        this.character.addAI();
      }
      this.character.palette = this.palette;
      this.character.changePaletteWeapon();
      this.character.xDir = spawnPoint.xDir;
      
      if(this === game.level.mainPlayer) {
        game.level.computeCamPos(this.character.getCamCenterPos());
        //console.log(game.level.camX + "," + game.level.camY);
      }
      this.warpedIn = true;
    }
    if(this.respawnTime > 0 && !game.level.gameMode.isOver) {
      this.respawnTime = Helpers.clampMin0(this.respawnTime - game.deltaTime);
    }
  }

  get canControl() {
    if(game.level.gameMode.isOver) {
      return false;
    }
    if(game.uiData.menu !== Menu.None && !this.isAI) {
      return false;
    }
    if(this.character && (this.character.shotgunIceChargeTime > 0 || this.character.freezeTime > 0)) {
      return false;
    }
    return true;
  }

  isPressed(keyName: string, checkIfCanControl: boolean = true) {
    if(checkIfCanControl && !this.canControl) return false;
    return this.inputPressed[keyName] || this.controllerInputPressed[keyName];
  }

  isHeld(keyName: string, checkIfCanControl: boolean = true) {
    if(checkIfCanControl && !this.canControl) return false;
    return this.input[keyName] || this.controllerInput[keyName];
  }

  setButtonMapping(controllerName: string) {
    if(controllerName === "Xbox 360 Controller (XInput STANDARD GAMEPAD)") {
      this.buttonMapping[100] = "left";
      this.buttonMapping[102] = "right";
      this.buttonMapping[104] = "up";
      this.buttonMapping[101] = "down";
      this.buttonMapping[1] = "dash";
      this.buttonMapping[0] = "jump";
      this.buttonMapping[2] = "shoot";
      this.buttonMapping[4] = "weaponleft";
      this.buttonMapping[5] = "weaponright";

      this.axesMapping[0] = "left|right";
      this.axesMapping[1] = "up|down";

      this.buttonMapping[8] = "scoreboard";
    }
    else if(controllerName === "USB GamePad (Vendor: 0e8f Product: 3013)") {
      this.buttonMapping[1] = "dash";
      this.buttonMapping[2] = "jump";
      this.buttonMapping[3] = "shoot";
      this.buttonMapping[6] = "weaponleft";
      this.buttonMapping[7] = "weaponright";
      this.buttonMapping[8] = "reset";
      
      this.axesMapping[0] = "left|right";
      this.axesMapping[1] = "up|down";
    }
  }

  get weapon() {
    return this.weapons[this.weaponIndex];
  }

  setAxes(axes: number, value: number) {
    if(this.isAI) return;
    let key = this.axesMapping[axes];
    if(!key) return;
    let key1 = key.split("|")[1];
    let key2 = key.split("|")[0];

    if(value > 0.2) {
      if(!this.controllerInput[key1]) this.controllerInputPressed[key1] = true;
      this.controllerInput[key1] = true;
      this.controllerInputPressed[key2] = false;
      this.controllerInput[key2] = false;
    }
    else if(value < -0.2) {
      if(!this.controllerInput[key2]) this.controllerInputPressed[key2] = true;
      this.controllerInput[key2] = true;
      this.controllerInputPressed[key1] = false;
      this.controllerInput[key1] = false;
    }
    else {
      this.controllerInputPressed[key1] = false;
      this.controllerInput[key1] = false;
      this.controllerInputPressed[key2] = false;
      this.controllerInput[key2] = false;
    }

  }

  onButtonDown(button: number) {
    if(this.isAI) return;
    let key = this.buttonMapping[button];
    if(!this.controllerInput[key]) this.controllerInputPressed[key] = true;
    this.controllerInput[key] = true;
    if(key === "reset") {
      game.restartLevel("sm_bossroom");
      return;
    }
  }

  onButtonUp(button: number) {
    if(this.isAI) return;
    let key = this.buttonMapping[button];
    this.controllerInput[key] = false;
    this.controllerInputPressed[key] = false;
  }

  press(key: string) {
    if(!this.input[key]) this.inputPressed[key] = true;
    this.input[key] = true;
  }

  release(key: string) {
    this.input[key] = false;
    this.inputPressed[key] = false;
  }

  onKeyDown(keycode: number) {
    if(this.isAI) return;
    let key = this.inputMapping[keycode];
    if(!this.input[key]) this.inputPressed[key] = true;
    this.input[key] = true;
    if(this === game.level.mainPlayer) {
      cheat(key, keycode);
    }
  }

  onKeyUp(keycode: number) {
    if(this.isAI) return;
    let key = this.inputMapping[keycode];
    this.input[key] = false;
    this.inputPressed[key] = false;
  }

  clearInputPressed() {
    this.inputPressed = {};
    //No "mousewheel up" event, must clean up manually
    let mouseUpMap = this.inputMapping[3];
    if(mouseUpMap) this.input[mouseUpMap] = false;
    let mouseDownMap = this.inputMapping[4];
    if(mouseDownMap) this.input[mouseDownMap] = false;
    this.controllerInputPressed = {};
  }

  clearAiInput() {
    this.input = {};
    if(this.character && this.character.ai.framesChargeHeld > 0) {
      this.input["shoot"] = true;
    }
    if(this.character) {
      if(this.character.ai.jumpTime > 0) {
        this.input["jump"] = true;
      }
      else {
        this.input["jump"] = false;
      }
    }
    this.controllerInputPressed = {};
  }

  destroyCharacter() {
    this.respawnTime = 5;
    this.character.destroySelf();
    this.character = undefined;
  }

}