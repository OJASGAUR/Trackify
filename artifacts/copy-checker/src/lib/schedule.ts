import { format, addDays, getDay, isAfter, isBefore, parseISO } from "date-fns";
import { AppSettings, Task, ClassName, CopyType } from "./types";

export function isSecondSaturday(date: Date): boolean {
  if (getDay(date) !== 6) return false;
  const day = date.getDate();
  return day >= 8 && day <= 14;
}

export function isWorkingDay(date: Date, settings: AppSettings): boolean {
  const dow = getDay(date);
  if (!settings.workingDays.includes(dow)) return false;
  if (settings.skipSecondSaturday && isSecondSaturday(date)) return false;
  return true;
}

function getClassCapacity(settings: AppSettings, classId: ClassName) {
  return settings.classesConfig.find((c) => c.id === classId)?.studentsCount ?? 40;
}

export function generateSchedule(settings: AppSettings, existingTasks: Task[] = []): Task[] {
  const tasks: Task[] = [...existingTasks];
  const today = parseISO(format(new Date(), "yyyy-MM-dd"));
  const startDate = parseISO(settings.startDate);

  const allCombos: { classId: ClassName; copyType: CopyType }[] = [];
  settings.classesConfig.forEach((c) => {
    allCombos.push({ classId: c.id, copyType: "Homework" });
    allCombos.push({ classId: c.id, copyType: "Classwork" });
  });

  const scheduledKeys = new Set(
    existingTasks.filter((t) => !t.isManual).map((t) => `${t.classId}-${t.copyType}`)
  );
  const unscheduled = allCombos.filter((c) => !scheduledKeys.has(`${c.classId}-${c.copyType}`));

  if (unscheduled.length === 0) return tasks;

  const workingDates: string[] = [];
  let current = startDate;
  while (workingDates.length < 60) {
    if (isWorkingDay(current, settings)) {
      const dateStr = format(current, "yyyy-MM-dd");
      if (!isBefore(current, today)) {
        workingDates.push(dateStr);
      }
    }
    current = addDays(current, 1);
  }

  const sundayFallbacks: string[] = [];
  current = addDays(today, 1);
  while (sundayFallbacks.length < 6) {
    if (getDay(current) === 0) {
      const dateStr = format(current, "yyyy-MM-dd");
      if (isAfter(current, today)) sundayFallbacks.push(dateStr);
    }
    current = addDays(current, 1);
  }

  const scheduleDates = [...workingDates];
  while (scheduleDates.length < unscheduled.length) {
    const nextSunday = sundayFallbacks[scheduleDates.length % sundayFallbacks.length];
    if (!scheduleDates.includes(nextSunday)) scheduleDates.push(nextSunday);
    else break;
  }

  const perDayTarget = Math.max(1, settings.defaultCopiesPerDay);
  const perDaySlots = Math.max(1, Math.ceil(perDayTarget / 2));
  let dayIndex = 0;

  unscheduled.forEach((combo) => {
    let placed = false;
    let safety = 0;
    while (!placed && safety < scheduleDates.length * 2) {
      const date = scheduleDates[dayIndex % scheduleDates.length];
      const dayCount = tasks.filter((t) => t.assignedDate === date && !t.isManual).length;
      const targetForDay = date === scheduleDates[dayIndex % scheduleDates.length] && getDay(parseISO(date)) === 0 ? 1 : perDaySlots;
      if (dayCount < targetForDay) {
        tasks.push({
          id: `${combo.classId}-${combo.copyType}`,
          classId: combo.classId,
          copyType: combo.copyType,
          assignedDate: date,
          status: "pending",
          checkedCount: 0,
          isManual: false,
        });
        placed = true;
      } else {
        dayIndex++;
      }
      safety++;
    }
    if (!placed && scheduleDates.length > 0) {
      const date = scheduleDates[scheduleDates.length - 1];
      tasks.push({
        id: `${combo.classId}-${combo.copyType}`,
        classId: combo.classId,
        copyType: combo.copyType,
        assignedDate: date,
        status: "pending",
        checkedCount: 0,
        isManual: false,
      });
    }
    dayIndex++;
  });

  return tasks;
}
