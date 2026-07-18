import { isLevelId, type LevelSummary } from "@/lib/idioms";
import type { LevelId } from "@/types/types";

export type StudyPosition = {
  level: LevelId;
  lesson: number;
};

export type StudySearchParamsBase = {
  level?: string | string[];
  lesson?: string | string[];
};

export function getParam(value: string | string[] | undefined): string | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

export function getLevelLessons(summaries: LevelSummary[], level: LevelId) {
  return summaries.find((summary) => summary.id === level)?.lessons ?? [];
}

export function getFirstLessonNumber(summaries: LevelSummary[], level: LevelId): number {
  return getLevelLessons(summaries, level)[0]?.lesson_number ?? 1;
}

export function getNextLessonPosition(
  summaries: LevelSummary[],
  level: LevelId,
  lessonNumber: number
): StudyPosition | null {
  const levelIndex = summaries.findIndex((item) => item.id === level);

  if (levelIndex < 0) {
    return null;
  }

  const lessons = getLevelLessons(summaries, level);
  const lessonIndex = lessons.findIndex((lesson) => lesson.lesson_number === lessonNumber);
  const nextLesson = lessonIndex >= 0 ? lessons[lessonIndex + 1] : undefined;

  if (nextLesson) {
    return { level, lesson: nextLesson.lesson_number };
  }

  for (const nextLevel of summaries.slice(levelIndex + 1)) {
    const firstLesson = nextLevel.lessons[0];

    if (firstLesson) {
      return { level: nextLevel.id, lesson: firstLesson.lesson_number };
    }
  }

  return null;
}

export function getPreviousLessonPosition(
  summaries: LevelSummary[],
  level: LevelId,
  lessonNumber: number
): StudyPosition | null {
  const levelIndex = summaries.findIndex((item) => item.id === level);

  if (levelIndex < 0) {
    return null;
  }

  const lessons = getLevelLessons(summaries, level);
  const lessonIndex = lessons.findIndex((lesson) => lesson.lesson_number === lessonNumber);
  const previousLesson = lessonIndex > 0 ? lessons[lessonIndex - 1] : undefined;

  if (previousLesson) {
    return { level, lesson: previousLesson.lesson_number };
  }

  for (let previousLevelIndex = levelIndex - 1; previousLevelIndex >= 0; previousLevelIndex -= 1) {
    const previousLevel = summaries[previousLevelIndex];
    const lastLesson = previousLevel.lessons.at(-1);

    if (lastLesson) {
      return { level: previousLevel.id, lesson: lastLesson.lesson_number };
    }
  }

  return null;
}

export function parseLevelParam(value: string | null): LevelId | null {
  return isLevelId(value) ? value : null;
}

export function parseLessonParam(summaries: LevelSummary[], level: LevelId, value: string | null): number | null {
  const lessonNumber = Number(value);

  if (!Number.isInteger(lessonNumber)) {
    return null;
  }

  return getLevelLessons(summaries, level).some((lesson) => lesson.lesson_number === lessonNumber) ? lessonNumber : null;
}

export function findLessonPosition(summaries: LevelSummary[], value: string | null): StudyPosition | null {
  const lessonNumber = Number(value);

  if (!Number.isInteger(lessonNumber)) {
    return null;
  }

  for (const level of summaries) {
    if (level.lessons.some((lesson) => lesson.lesson_number === lessonNumber)) {
      return { level: level.id, lesson: lessonNumber };
    }
  }

  return null;
}
