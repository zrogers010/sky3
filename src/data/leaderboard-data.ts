import type { Model, Dataset } from '../types/leaderboard';

const allTasksModels: Model[] = [
  {
    name: 'Sample-Spatial-XL',
    developer: 'Example Lab A',
    iou: 0.812,
    structural: 91.4,
    assembly: 84.7,
    physical: 88.2,
    cases: 1200
  },
  {
    name: 'Demo-Geometry-7B',
    developer: 'Example Lab B',
    iou: 0.794,
    structural: 89.0,
    assembly: 81.3,
    physical: 85.9,
    cases: 1200
  },
  {
    name: 'Mock-Assembly-Base',
    developer: 'Example Lab C',
    iou: 0.761,
    structural: 85.6,
    assembly: 86.2,
    physical: 79.4,
    cases: 1200
  },
  {
    name: 'Placeholder-Physics-2',
    developer: 'Example Lab A',
    iou: 0.703,
    structural: 82.1,
    assembly: 74.8,
    physical: 87.5,
    cases: 1200
  },
  {
    name: 'Test-PointNet-S',
    developer: 'Example Lab D',
    iou: 0.748,
    structural: 78.9,
    assembly: 70.2,
    physical: 72.6,
    cases: 1200
  },
  {
    name: 'Example-Mesh-v0',
    developer: 'Example Lab E',
    iou: 0.685,
    structural: 74.3,
    assembly: 66.9,
    physical: 70.1,
    cases: 1200
  },
  {
    name: 'Dummy-Structure-Lite',
    developer: 'Example Lab F',
    iou: 0.642,
    structural: 70.8,
    assembly: 61.5,
    physical: 68.4,
    cases: 1200
  },
  {
    name: 'Sandbox-Baseline-0',
    developer: 'Sky3 baseline (sample)',
    iou: 0.551,
    structural: 62.0,
    assembly: 48.7,
    physical: 59.3,
    cases: 1200
  }
];

const reconstructionModels: Model[] = [
  {
    name: 'Fictional-Recon-XL',
    developer: 'Example Lab G',
    iou: 0.834,
    structural: 88.2,
    assembly: 79.1,
    physical: 85.3,
    cases: 450
  },
  {
    name: 'Sample-Depth-Net',
    developer: 'Example Lab H',
    iou: 0.801,
    structural: 84.6,
    assembly: 76.8,
    physical: 81.9,
    cases: 450
  },
  {
    name: 'Mock-3D-Gen',
    developer: 'Example Lab I',
    iou: 0.778,
    structural: 81.3,
    assembly: 73.5,
    physical: 78.4,
    cases: 450
  },
  {
    name: 'Placeholder-Mesh-Pro',
    developer: 'Example Lab J',
    iou: 0.745,
    structural: 77.9,
    assembly: 69.2,
    physical: 74.1,
    cases: 450
  },
  {
    name: 'Demo-Voxel-Base',
    developer: 'Example Lab K',
    iou: 0.712,
    structural: 73.8,
    assembly: 64.7,
    physical: 69.8,
    cases: 450
  },
  {
    name: 'Test-Recon-Lite',
    developer: 'Example Lab L',
    iou: 0.668,
    structural: 68.5,
    assembly: 58.3,
    physical: 63.2,
    cases: 450
  }
];

const parsingModels: Model[] = [
  {
    name: 'Sample-Parser-Ultra',
    developer: 'Example Lab M',
    iou: 0.823,
    structural: 94.7,
    assembly: 88.4,
    physical: 82.6,
    cases: 380
  },
  {
    name: 'Mock-Structure-AI',
    developer: 'Example Lab N',
    iou: 0.792,
    structural: 91.2,
    assembly: 84.9,
    physical: 78.3,
    cases: 380
  },
  {
    name: 'Placeholder-Segment-7B',
    developer: 'Example Lab O',
    iou: 0.766,
    structural: 87.5,
    assembly: 80.6,
    physical: 74.1,
    cases: 380
  },
  {
    name: 'Demo-Part-Detect',
    developer: 'Example Lab P',
    iou: 0.734,
    structural: 83.8,
    assembly: 76.2,
    physical: 69.5,
    cases: 380
  },
  {
    name: 'Test-Boundary-Net',
    developer: 'Example Lab Q',
    iou: 0.701,
    structural: 79.4,
    assembly: 71.8,
    physical: 64.7,
    cases: 380
  },
  {
    name: 'Example-Parse-Lite',
    developer: 'Example Lab R',
    iou: 0.658,
    structural: 74.1,
    assembly: 65.3,
    physical: 58.9,
    cases: 380
  }
];

const assemblyModels: Model[] = [
  {
    name: 'Fictional-Assembly-Pro',
    developer: 'Example Lab S',
    iou: 0.786,
    structural: 86.9,
    assembly: 92.8,
    physical: 84.7,
    cases: 370
  },
  {
    name: 'Sample-Hierarchy-XL',
    developer: 'Example Lab T',
    iou: 0.758,
    structural: 83.4,
    assembly: 89.3,
    physical: 80.2,
    cases: 370
  },
  {
    name: 'Mock-Tree-Builder',
    developer: 'Example Lab U',
    iou: 0.729,
    structural: 79.8,
    assembly: 85.7,
    physical: 75.6,
    cases: 370
  },
  {
    name: 'Placeholder-Joint-AI',
    developer: 'Example Lab V',
    iou: 0.695,
    structural: 75.3,
    assembly: 81.4,
    physical: 70.8,
    cases: 370
  },
  {
    name: 'Demo-Assembly-Base',
    developer: 'Example Lab W',
    iou: 0.662,
    structural: 70.9,
    assembly: 76.9,
    physical: 65.3,
    cases: 370
  },
  {
    name: 'Test-Connect-Lite',
    developer: 'Example Lab X',
    iou: 0.623,
    structural: 65.7,
    assembly: 71.2,
    physical: 59.1,
    cases: 370
  }
];

export const datasets: Record<string, Dataset> = {
  all: {
    name: 'All tasks',
    models: allTasksModels
  },
  reconstruction: {
    name: '2D-to-3D reconstruction',
    models: reconstructionModels
  },
  parsing: {
    name: 'Structural parsing',
    models: parsingModels
  },
  assembly: {
    name: 'Assembly',
    models: assemblyModels
  }
};
