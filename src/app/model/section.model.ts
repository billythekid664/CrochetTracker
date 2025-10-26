export interface Section {
  name: string;
  sectionNumber: number;
  repeatCount: number;
  rounds: Array<Round>;
}

export interface Round {
  roundNumber: number
  repeatCount: number;
  stitches: Array<Stitch>;
  totalStitches: number;
}

export interface Stitch {
  quantity: number;
  type: StitchType;
}

export enum StitchType {
  CH,
  SC,
  INC,
  DEC
}
