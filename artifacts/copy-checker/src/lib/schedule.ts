import {
  format,
  addDays,
  getDay,
  isBefore,
  parseISO,
  endOfMonth,
  eachDayOfInterval,
} from "date-fns";
import { AppSettings, Task, ClassName, CopyType } from "./types";

export function isSecondSaturday(date: Date): boolean {
  if (getDay(date) !== 6) return false;
  const d = date.getDate();
  return d >= 8 && d <= 14;
}

export function isWorkingDay(date: Date, settings: AppSettings): boolean {
  const dow = getDay(date);
  if (!settings.workingDays.includes(dow)) return false;
  if (settings.skipSecondSaturday && isSecondSaturday(date)) return false;
  return true;
}

interface ComboSlot {
  classId: ClassName;
  copyType: CopyType;
  partIndex: number;
  totalParts: number;
  partTotal: number;
  partStart: number;
}

/**
 * Build slots in a MIXED, interleaved order so the two parts of the same class
 * are spread apart with other classes in between.
 *
 * Order: for each part round → for each copyType → for each class
 * Result: [6A-HW-1, 6B-HW-1, ..., 6A-CW-1, 6B-CW-1, ..., 6A-HW-2, 6B-HW-2, ...]
 */
function buildAllSlots(settings: AppSettings): ComboSlot[] {
  const perDay = Math.max(1, settings.defaultCopiesPerDay);
  const classes = settings.classesConfig;
  const maxParts = Math.max(
    ...classes.map((c) => Math.max(1, Math.ceil(c.studentsCount / perDay)))
  );

  const slots: ComboSlot[] = [];

  for (let p = 1; p <= maxParts; p++) {
    for (const copyType of ["Homework", "Classwork"] as CopyType[]) {
      for (const c of classes) {
        const totalParts = Math.max(1, Math.ceil(c.studentsCount / perDay));
        if (p > totalParts) continue;
        const partStart = (p - 1) * perDay + 1;
        const partEnd = Math.min(p * perDay, c.studentsCount);
        slots.push({
          classId: c.id as ClassName,
          copyType,
          partIndex: p,
          totalParts,
          partTotal: partEnd - partStart + 1,
          partStart,
        });
      }
    }
  }

  return slots;
}

/** Working day strings from today (or startDate if later) through end of current month */
function collectWorkingDatesInMonth(settings: AppSettings): string[] {
  const today = parseISO(format(new Date(), "yyyy-MM-dd"));
  const startDate = parseISO(settings.startDate);
  const from = isBefore(startDate, today) ? today : startDate;
  const monthEnd = endOfMonth(from);
  return eachDayOfInterval({ start: from, end: monthEnd })
    .filter((d) => isWorkingDay(d, settings))
    .map((d) => format(d, "yyyy-MM-dd"));
}

/** Future Sundays after today (up to 90 days ahead) as genuine last-resort overflow */
function collectSundayFallbacks(): string[] {
  const today = parseISO(format(new Date(), "yyyy-MM-dd"));
  const dates: string[] = [];
  let cur = addDays(today, 1);
  const limit = addDays(today, 90);
  while (cur <= limit) {
    if (getDay(cur) === 0) dates.push(format(cur, "yyyy-MM-dd"));
    cur = addDays(cur, 1);
  }
  return dates;
}

/** Maximum auto-tasks allowed on a single day */
const MAX_PER_DAY = 3;

export function generateSchedule(settings: AppSettings, existingTasks: Task[] = []): Task[] {
  const allSlots = buildAllSlots(settings);

  // Which auto slots are already scheduled (v2 format = has partIndex)
  const scheduledKeys = new Set(
    existingTasks
      .filter((t) => !t.isManual && t.partIndex !== undefined)
      .map((t) => t.id)
  );

  const unscheduled = allSlots.filter(
    (s) => !scheduledKeys.has(`${s.classId}-${s.copyType}-pt${s.partIndex}`)
  );

  if (unscheduled.length === 0) return [...existingTasks];

  // Build date pool: try working days only first.
  // Only pull in Sunday fallbacks if even MAX_PER_DAY tasks/day isn't enough.
  const workingDates = collectWorkingDatesInMonth(settings);
  const datePool = [...workingDates];

  if (workingDates.length * MAX_PER_DAY < unscheduled.length) {
    // Genuinely need extra days — use future Sundays as overflow
    for (const d of collectSundayFallbacks()) {
      if (!datePool.includes(d)) datePool.push(d);
      if (datePool.length * MAX_PER_DAY >= unscheduled.length) break;
    }
  }

  if (datePool.length === 0) return [...existingTasks];

  // How many tasks per day (spread evenly, at most MAX_PER_DAY)
  const tasksPerDay = Math.min(
    MAX_PER_DAY,
    Math.ceil(unscheduled.length / datePool.length)
  );

  // Assign slots across dates
  const newTasks: Task[] = [];
  let di = 0;
  let countOnDate = 0;

  for (const slot of unscheduled) {
    if (countOnDate >= tasksPerDay && di < datePool.length - 1) {
      di++;
      countOnDate = 0;
    }
    newTasks.push({
      id: `${slot.classId}-${slot.copyType}-pt${slot.partIndex}`,
      classId: slot.classId,
      copyType: slot.copyType,
      assignedDate: datePool[di],
      status: "pending",
      checkedCount: 0,
      isManual: false,
      partIndex: slot.partIndex,
      totalParts: slot.totalParts,
      partTotal: slot.partTotal,
      partStart: slot.partStart,
    });
    countOnDate++;
  }

  return [...existingTasks, ...newTasks];
}
