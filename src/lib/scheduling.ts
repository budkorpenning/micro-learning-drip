/**
 * Pure scheduling logic for spaced repetition
 * Based on simplified SM-2 algorithm
 */

export type Grade = 1 | 2 | 3 | 4;

interface ScheduleInput {
  intervalDays: number;
  easeFactor: number;
  grade: Grade;
}

interface ScheduleOutput {
  intervalDays: number;
  easeFactor: number;
}

const MIN_EASE_FACTOR = 1.3;

/**
 * Calculate the next interval and ease factor based on grade
 *
 * Grade effects:
 * 1 (Forgot):  interval = 1,             ease -= 0.20
 * 2 (Hard):    interval = max(2, ×1.2),  ease -= 0.10
 * 3 (Good):    interval = max(3, ×1.5),  ease += 0
 * 4 (Easy):    interval = max(5, ×2.5),  ease += 0.15
 */
export function calculateNextSchedule(input: ScheduleInput): ScheduleOutput {
  const { intervalDays, easeFactor, grade } = input;

  let newInterval: number;
  let newEaseFactor: number;

  switch (grade) {
    case 1: // Forgot
      newInterval = 1;
      newEaseFactor = easeFactor - 0.2;
      break;

    case 2: // Hard
      newInterval = Math.max(2, Math.round(intervalDays * 1.2));
      newEaseFactor = easeFactor - 0.1;
      break;

    case 3: // Good
      newInterval = Math.max(3, Math.round(intervalDays * 1.5));
      newEaseFactor = easeFactor; // no change
      break;

    case 4: // Easy
      newInterval = Math.max(5, Math.round(intervalDays * 2.5));
      newEaseFactor = easeFactor + 0.15;
      break;

    default:
      throw new Error(`Invalid grade: ${grade}`);
  }

  // Ensure ease factor doesn't go below minimum
  newEaseFactor = Math.max(MIN_EASE_FACTOR, newEaseFactor);

  return {
    intervalDays: newInterval,
    easeFactor: newEaseFactor,
  };
}

/**
 * Calculate the due date from now + interval days
 */
export function calculateDueDate(intervalDays: number): Date {
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + intervalDays);
  return dueDate;
}
