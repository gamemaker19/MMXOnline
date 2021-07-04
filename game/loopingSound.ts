import { game } from "./game";
import { Actor } from "./actor";

export class LoopingSound {

  startClip: string;
  loopClip: string;
  startSoundId: number;
  loopSoundId: number;
  actor: Actor;
  times: number = 0;
  stopped: boolean = false;
  constructor(startClip: string, loopClip: string, actor: Actor) {
    this.startClip = startClip;
    this.loopClip = loopClip;
    this.actor = actor;
  }

  play() {
    if(this.stopped) return;
    if(!this.startSoundId && !this.loopSoundId) {
      this.startSoundId = game.playSound(this.startClip, this.actor.getSoundVolume(), true);
    }
    if(this.startSoundId && !game.soundSheet.playing(this.startSoundId)) {
      this.times = 1;
      this.startSoundId = undefined;
      this.loopSoundId = game.playSound(this.loopClip, this.actor.getSoundVolume(), true);
    }
    if(this.times >= 1 && this.times <= 4 && !game.soundSheet.playing(this.loopSoundId)) {
      this.times++;
      this.loopSoundId = game.playSound(this.loopClip, this.actor.getSoundVolume(), true);
    }
    if(this.times > 4) {
      this.stop(false);
    }
  }

  stop(resetTimes: boolean = true) {
    if(this.stopped) return;
    if(resetTimes) {
      this.times = 0; 
    }
    if(this.startSoundId) {
      //console.log("STOP");
      game.soundSheet.stop(this.startSoundId);
      this.startSoundId = undefined;
    }
    if(this.loopSoundId) {
      //console.log("STOP");
      game.soundSheet.stop(this.loopSoundId);
      this.loopSoundId = undefined;
    }
    this.stopped = true;
  }

  reset() {
    this.stopped = false;
    this.times = 0;
    //console.log("RESET");
  }

}