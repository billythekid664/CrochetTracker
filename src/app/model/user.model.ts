import { StitchType } from "./round.model";

export interface User {
  uid: string;
  firstName: string;
  lastName: string;
  provider: string;
  email: string;
}

export interface UserProject {
  projectUid: string;
  userUid?: string;
  ownderUid?: string;
  projectName: string;
  userRounds?: Array<UserRound>
}

export interface UserRound {
  roundComplete: boolean
  stitches: Array<Array<UserStitch>>;
}

export interface UserStitch {
  completed: boolean,
  stitchType: StitchType
}
