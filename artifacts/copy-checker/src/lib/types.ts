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
  assignedDate: string; // YYYY-MM-DD
  status: TaskStatus;
  checkedCount: number;
  isManual?: boolean;
  // Part info (v2 schedule format)
  partIndex?: number;   // 1-based (1, 2, ...)
  totalParts?: number;  // how many parts this class×type is split into
  partTotal?: number;   // total copies in this part (e.g. 20)
  partStart?: number;   // first student index in this part (1-based)
}

export interface AppSettings {
  startDate: string; // YYYY-MM-DD
  workingDays: number[]; // 0-6 (0=Sun, 1=Mon, ..., 6=Sat)
  skipSecondSaturday: boolean;
  classesConfig: ClassConfig[];
  defaultCopiesPerDay: number; // how many copies to assign per task slot (default 20)
  testDate?: string;
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
  workingDays: [1, 2, 3, 4, 5, 6], // Mon–Sat
  skipSecondSaturday: true,
  classesConfig: DEFAULT_CLASSES,
  defaultCopiesPerDay: 20,
};
