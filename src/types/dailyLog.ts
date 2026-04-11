export type Mood = 'great' | 'good' | 'okay' | 'bad';

export interface DailyLogEntry {
  id: string;
  date: string;
  content: string;
  mood?: Mood;
  createdAt: string;
  updatedAt: string;
}
