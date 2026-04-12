export type ClassName = "6A" | "6B" | "7D" | "8B" | "9D" | "10C";
export type CopyType = "Homework" | "Classwork";
export type TaskStatus = "pending" | "checked" | "partial" | "skipped";

export interface ClassConfig {
  id: ClassName;
  name: string;
  studentsCount: number;
}

export interface Task {
  id: string; // unique
  classId: ClassName;
  copyType: CopyType;
  assignedDate: string; // YYYY-MM-DD
  status: TaskStatus;
  checkedCount: number;
}

export interface AppSettings {
  startDate: string; // YYYY-MM-DD
  workingDays: number[]; // 0-6 (0 is Sun)
  classesConfig: ClassConfig[];
}

export const DEFAULT_CLASSES: ClassConfig[] = [
  { id: "6A", name: "Class 6A", studentsCount: 40 },
  { id: "6B", name: "Class 6B", studentsCount: 40 },
  { id: "7D", name: "Class 7D", studentsCount: 40 },
  { id: "8B", name: "Class 8B", studentsCount: 40 },
  { id: "9D", name: "Class 9D", studentsCount: 40 },
  { id: "10C", name: "Class 10C", studentsCount: 40 },
];
