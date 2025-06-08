import { Round } from "./round.model";

export interface Project {
  name: string;
  rounds: Array<Round>;
  ownerUid: string;
}
