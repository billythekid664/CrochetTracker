export interface Round {
  name?: string;
  stitches: Array<Array<Stitch>>;
  totalStitches: number;
}

export interface Stitch {
  quantity: number;
  stitchType: StitchType;
}

export enum StitchType {
  SC,
  INC,
  DEC
}
