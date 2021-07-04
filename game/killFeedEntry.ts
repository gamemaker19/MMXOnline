import { Player } from "./player";
import { Weapon } from "./weapon";

export class KillFeedEntry {
  killer: Player;
  victim: Player;
  weapon: Weapon;
  customMessage: string;
  customMessageAlliance: number = 0;
  time: number = 0;
  constructor(killer: Player, victim: Player, weapon: Weapon) {
    this.killer = killer;
    this.victim = victim;
    this.weapon = weapon;
  }
  static CustomMessage(message: string, alliance: number, player?: Player) {
    let kfe = new KillFeedEntry(undefined, undefined, undefined);
    kfe.customMessage = message;
    kfe.customMessageAlliance = alliance;
    kfe.victim = player;
    return kfe;
  }
}