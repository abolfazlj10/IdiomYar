import "server-only";

import type { Book, LevelId } from "@/types/types";
import { LEVELS, getLessons, type LevelBooks, type LevelSummary } from "@/lib/idioms";

const bookLoaders: Record<LevelId, () => Promise<Book>> = {
  elementary: async () => (await import("@/data/book/elementry.json")).default as Book,
  intermediate: async () => (await import("@/data/book/intermediate.json")).default as Book,
  advanced: async () => (await import("@/data/book/advanced.json")).default as Book,
};

export function loadBook(level: LevelId): Promise<Book> {
  return bookLoaders[level]();
}

export async function loadBooks(levels: LevelId[] = LEVELS.map((level) => level.id)): Promise<LevelBooks> {
  const uniqueLevels = [...new Set(levels)];
  const entries = await Promise.all(uniqueLevels.map(async (level) => [level, await loadBook(level)] as const));
  return Object.fromEntries(entries) as LevelBooks;
}

export async function loadLevelSummaries(): Promise<LevelSummary[]> {
  const books = await loadBooks();

  return LEVELS.map((level) => ({
    id: level.id,
    lessons: getLessons(books[level.id]).map((lesson) => ({
      lesson_number: lesson.lesson_number,
      lesson_name: lesson.lesson_name,
      idiomCount: lesson.idioms.length,
    })),
  }));
}
