import type { Book, Idiom, LevelId, Lesson } from "@/types/types";

export type LevelMeta = {
  id: LevelId;
  sourceId: "elementry" | "intermediate" | "advanced";
  label: string;
  shortLabel: string;
  description: string;
  accent: string;
  softAccent: string;
  icon: string;
};

export type IdiomEntry = Idiom & {
  id: string;
  level: LevelId;
  levelLabel: string;
  lessonNumber: number;
  lessonName: string;
};

export type LevelBooks = Partial<Record<LevelId, Book>>;

export type LevelLessonSummary = Pick<Lesson, "lesson_number" | "lesson_name"> & {
  idiomCount: number;
};

export type LevelSummary = {
  id: LevelId;
  lessons: LevelLessonSummary[];
};

export const LEVELS: LevelMeta[] = [
  {
    id: "elementary",
    sourceId: "elementry",
    label: "Elementary",
    shortLabel: "Level 1",
    description: "Everyday idioms for core conversation.",
    accent: "green",
    softAccent: "bg-green-50 text-green-700 border-green-200",
    icon: "Seedling.svg",
  },
  {
    id: "intermediate",
    sourceId: "intermediate",
    label: "Intermediate",
    shortLabel: "Level 2",
    description: "Practical idioms for richer expression.",
    accent: "blue",
    softAccent: "bg-blue-50 text-blue-700 border-blue-200",
    icon: "Potted Plant.svg",
  },
  {
    id: "advanced",
    sourceId: "advanced",
    label: "Advanced",
    shortLabel: "Level 3",
    description: "Specialized idioms for fluent nuance.",
    accent: "red",
    softAccent: "bg-red-50 text-red-700 border-red-200",
    icon: "Deciduous Tree.svg",
  },
];

export function isLevelId(value: unknown): value is LevelId {
  return LEVELS.some((level) => level.id === value);
}

export function getLevelMeta(level: LevelId): LevelMeta {
  return LEVELS.find((item) => item.id === level) ?? LEVELS[0];
}

export function getLessons(book: Book | undefined): Lesson[] {
  return book?.levels[0]?.lessons ?? [];
}

export function getIdiomId(level: LevelId, lessonNumber: number, phrase: string): string {
  return `${level}:${lessonNumber}:${phrase}`;
}

export function getIdiomsForLesson(book: Book | undefined, level: LevelId, lessonNumber: number): IdiomEntry[] {
  const meta = getLevelMeta(level);
  const lesson = getLessons(book).find((item) => item.lesson_number === lessonNumber);

  if (!lesson) {
    return [];
  }

  return lesson.idioms.map((idiom) => ({
    ...idiom,
    id: getIdiomId(level, lesson.lesson_number, idiom.english_phrase),
    level,
    levelLabel: meta.label,
    lessonNumber: lesson.lesson_number,
    lessonName: lesson.lesson_name ?? `Lesson ${lesson.lesson_number}`,
  }));
}

export function getAllIdioms(books: LevelBooks, level?: LevelId): IdiomEntry[] {
  const levels = level ? [level] : LEVELS.map((item) => item.id);

  return levels.flatMap((levelId) =>
    getLessons(books[levelId]).flatMap((lesson) =>
      getIdiomsForLesson(books[levelId], levelId, lesson.lesson_number)
    )
  );
}

export function findIdiomById(books: LevelBooks, id: string): IdiomEntry | undefined {
  const level = id.split(":", 1)[0];
  const levels = isLevelId(level) ? [level] : LEVELS.map((item) => item.id);

  return levels.flatMap((levelId) => getAllIdioms(books, levelId)).find((idiom) => idiom.id === id);
}

export function normalizeSearch(value: string): string {
  return value.trim().toLowerCase();
}

export function idiomMatchesSearch(idiom: IdiomEntry, query: string): boolean {
  const normalized = normalizeSearch(query);

  if (!normalized) {
    return true;
  }

  return [
    idiom.english_phrase,
    idiom.persian_phrase_meaning,
    idiom.english_definition,
    idiom.persian_definition_meaning,
    idiom.english_explanation,
    idiom.persian_explanation_meaning,
    idiom.levelLabel,
    `lesson ${idiom.lessonNumber}`,
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(normalized));
}
