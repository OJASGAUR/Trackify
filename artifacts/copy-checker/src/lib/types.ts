export type ClassName = "6A" | "6B" | "7D" | "8B" | "9D" | "10C";
export type CopyType = "Homework" | "Classwork";
export type TaskStatus = "pending" | "checked" | "partial" | "skipped";

export interface ClassConfig {
  id: ClassName;
  name: string;
  studentsCount: number;
}

export interface Task {
  id: string;
  classId: ClassName;
  copyType: CopyType;
  assignedDate: string;
  status: TaskStatus;
  checkedCount: number;
  isManual?: boolean;
}

export interface AppSettings {
  startDate: string;
  workingDays: number[];
  skipSecondSaturday: boolean;
  classesConfig: ClassConfig[];
  defaultCopiesPerDay: number;
}

export const DEFAULT_CLASSES: ClassConfig[] = [
  { id: "6A", name: "Class 6A", studentsCount: 40 },
  { id: "6B", name: "Class 6B", studentsCount: 40 },
  { id: "7D", name: "Class 7D", studentsCount: 40 },
  { id: "8B", name: "Class 8B", studentsCount: 40 },
  { id: "9D", name: "Class 9D", studentsCount: 40 },
  { id: "10C", name: "Class 10C", studentsCount: 40 },
];

export const DEFAULT_SETTINGS: AppSettings = {
  startDate: new Date().toISOString().slice(0, 10),
  workingDays: [1, 2, 3, 4, 5, 6],
  skipSecondSaturday: true,
  classesConfig: DEFAULT_CLASSES,
  defaultCopiesPerDay: 20,
};