export interface Section {
  name: string;
  sectionNumber: number;
  repeatCount?: number;
  rounds: Array<Round>;
}

export interface Round {
  roundNumber: number
  repeatCount?: number;
  stitches: Array<Stitch>;
  totalStitches: number;
}

export interface Stitch {
  quantity: number;
  type: StitchType;
}

export enum StitchType {
  CH = 'CH',
  SC = 'SC',
  INC = 'INC',
  DEC = 'DEC'
}

export interface StitchTypeMetadata {
  type: StitchType;
  displayName: string;
  stitchCount: number;
}

export const STITCH_TYPES: StitchTypeMetadata[] = [
  { type: StitchType.CH, displayName: 'Chain', stitchCount: 1 },
  { type: StitchType.SC, displayName: 'Single Crochet', stitchCount: 1 },
  { type: StitchType.INC, displayName: 'Increase', stitchCount: 2 },
  { type: StitchType.DEC, displayName: 'Decrease', stitchCount: -1 }
];

export function getStitchMetadata(type: StitchType): StitchTypeMetadata {
  return STITCH_TYPES.find(st => st.type === type) || STITCH_TYPES[0];
}
