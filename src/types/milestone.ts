export interface MilestoneStage {
  id: string;
  name: string;
  done: boolean;
}

export interface MilestoneItem {
  id: string;
  name: string;
  category: string;
  stages: MilestoneStage[];
  createdAt: string;
  updatedAt: string;
}

export interface MilestoneTemplate {
  id: string;
  name: string;
  stageNames: string[];
}
