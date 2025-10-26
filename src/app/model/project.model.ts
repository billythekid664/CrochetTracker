import { Section } from "./section.model";

export interface Project {
  id: string;
  name: string;
  description?: string;
  sections: Array<Section>;
  ownerUid: string;
}
