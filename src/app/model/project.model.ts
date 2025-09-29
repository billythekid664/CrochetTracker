import { Round } from "./round.model";

export interface Project {
  id: string;
  name: string;
  description?: string;
  rounds: Array<Round>;
  ownerUid: string;
}
