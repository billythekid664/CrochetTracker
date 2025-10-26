import { StitchType } from "./section.model";

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
  userSections?: Array<UserSection>
}

export interface UserSection {
  orderNumber: number;
  sectionNumber: number;
  sectionComplete: boolean;
  userRounds?: Array<UserRound>;
}

export interface UserRound {
  orderNumber: number;
  roundComplete: boolean;
  stitches: Array<UserStitch>;
}

export interface UserStitch {
  completed: boolean,
  quantityComplete: number;
  stitchType: StitchType
}
