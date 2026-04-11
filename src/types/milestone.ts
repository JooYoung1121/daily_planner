export interface MilestoneStage {
  id: string;
  name: string;
  description: string;
  done: boolean;
}

export interface MilestoneItem {
  id: string;
  name: string;
  category: string;
  stages: MilestoneStage[];
  currentStageIndex: number; // which stage the item is currently at
  createdAt: string;
  updatedAt: string;
}
