import { format, addDays, getDay, isAfter, isBefore, parseISO, startOfDay } from "date-fns";
import { AppSettings, Task, DEFAULT_CLASSES, ClassName, CopyType } from "./types";

export function generateSchedule(
  settings: AppSettings,
  existingTasks: Task[] = []
): Task[] {
  const tasks: Task[] = [...existingTasks];
  
  // Find which copy types are NOT yet scheduled
  const allCombos: { classId: ClassName; copyType: CopyType }[] = [];
  settings.classesConfig.forEach((c) => {
    allCombos.push({ classId: c.id, copyType: "Homework" });
    allCombos.push({ classId: c.id, copyType: "Classwork" });
  });

  const unscheduledCombos = allCombos.filter(
    (combo) =>
      !existingTasks.some(
        (t) => t.classId === combo.classId && t.copyType === combo.copyType
      )
  );

  if (unscheduledCombos.length === 0) {
    return tasks;
  }

  // Determine working days from start date to start date + 30 days
  const startDate = parseISO(settings.startDate);
  const workingDates: string[] = [];
  
  let current = startDate;
  // Let's get ~30 working days
  while (workingDates.length < 30) {
    const dayOfWeek = getDay(current);
    if (settings.workingDays.includes(dayOfWeek)) {
      workingDates.push(format(current, "yyyy-MM-dd"));
    }
    current = addDays(current, 1);
  }

  // Distribute the remaining combos
  // We have max 12 combos. Let's space them out evenly across the first 24 working days, 1 every 2 days.
  // Or if more, 1 per day.
  const interval = Math.floor(24 / Math.max(1, unscheduledCombos.length));
  
  let dayIndex = 0;
  unscheduledCombos.forEach((combo) => {
    // Skip dates that already have 2 tasks assigned
    while (
      dayIndex < workingDates.length &&
      tasks.filter((t) => t.assignedDate === workingDates[dayIndex]).length >= 2
    ) {
      dayIndex++;
    }

    if (dayIndex < workingDates.length) {
      tasks.push({
        id: `${combo.classId}-${combo.copyType}`,
        classId: combo.classId,
        copyType: combo.copyType,
        assignedDate: workingDates[dayIndex],
        status: "pending",
        checkedCount: 0,
      });
      dayIndex += Math.max(1, interval);
    } else {
      // fallback just put it at the end
      tasks.push({
        id: `${combo.classId}-${combo.copyType}`,
        classId: combo.classId,
        copyType: combo.copyType,
        assignedDate: workingDates[workingDates.length - 1],
        status: "pending",
        checkedCount: 0,
      });
    }
  });

  return tasks;
}
