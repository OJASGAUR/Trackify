import { format, addDays, getDay } from "date-fns";
import { AppSettings, Task, ClassName, CopyType } from "./types";

/** Returns true if the given date is the 2nd Saturday of its month */
export function isSecondSaturday(date: Date): boolean {
  if (getDay(date) !== 6) return false; // not a Saturday
  const day = date.getDate();
  return day >= 8 && day <= 14;
}

/** Returns true if this date is a valid working day per the settings */
export function isWorkingDay(date: Date, settings: AppSettings): boolean {
  const dow = getDay(date); // 0=Sun … 6=Sat
  if (!settings.workingDays.includes(dow)) return false;
  if (settings.skipSecondSaturday && isSecondSaturday(date)) return false;
  return true;
}

export function generateSchedule(
  settings: AppSettings,
  existingTasks: Task[] = []
): Task[] {
  const tasks: Task[] = [...existingTasks];

  // Build the full list of class × copy-type combos
  const allCombos: { classId: ClassName; copyType: CopyType }[] = [];
  settings.classesConfig.forEach((c) => {
    allCombos.push({ classId: c.id, copyType: "Homework" });
    allCombos.push({ classId: c.id, copyType: "Classwork" });
  });

  // Filter out combos that are already scheduled (non-manual tasks)
  const scheduledKeys = new Set(
    existingTasks
      .filter((t) => !t.isManual)
      .map((t) => `${t.classId}-${t.copyType}`)
  );
  const unscheduled = allCombos.filter(
    (c) => !scheduledKeys.has(`${c.classId}-${c.copyType}`)
  );

  if (unscheduled.length === 0) return tasks;

  // Collect working days from start date until we have enough
  const startDate = new Date(settings.startDate + "T00:00:00");
  const workingDates: string[] = [];
  let current = startDate;
  // Collect up to 35 working days (covers a full month comfortably)
  while (workingDates.length < 35) {
    if (isWorkingDay(current, settings)) {
      workingDates.push(format(current, "yyyy-MM-dd"));
    }
    current = addDays(current, 1);
  }

  // Spread combos evenly across the first 26 working days (≈1 month)
  const window = Math.min(26, workingDates.length);
  const step = window / Math.max(1, unscheduled.length);

  unscheduled.forEach((combo, idx) => {
    // Evenly spaced index into working days
    let dayIndex = Math.round(idx * step);
    // Clamp to valid range
    if (dayIndex >= workingDates.length) dayIndex = workingDates.length - 1;

    // Avoid putting more than 2 auto tasks on the same day
    let attempts = 0;
    while (
      attempts < workingDates.length &&
      tasks.filter((t) => t.assignedDate === workingDates[dayIndex] && !t.isManual).length >= 2
    ) {
      dayIndex = (dayIndex + 1) % workingDates.length;
      attempts++;
    }

    tasks.push({
      id: `${combo.classId}-${combo.copyType}`,
      classId: combo.classId,
      copyType: combo.copyType,
      assignedDate: workingDates[dayIndex],
      status: "pending",
      checkedCount: 0,
      isManual: false,
    });
  });

  return tasks;
}
