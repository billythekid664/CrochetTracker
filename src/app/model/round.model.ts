export interface Round {
  roundNumber: number
  stitches: Array<Stitch>;
  totalStitches: number;
}

export interface Stitch {
  quantity: number;
  type: StitchType;
}

export enum StitchType {
  SC,
  INC,
  DEC
}
