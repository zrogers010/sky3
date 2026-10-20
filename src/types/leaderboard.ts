export interface Model {
  name: string;
  developer: string;
  iou: number;
  structural: number;
  assembly: number;
  physical: number;
  cases: number;
}

export interface Dataset {
  name: string;
  models: Model[];
}
