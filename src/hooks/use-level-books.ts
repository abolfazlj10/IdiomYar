"use client";

import { useCallback, useRef, useState } from "react";
import type { Book, LevelId } from "@/types/types";
import type { LevelBooks } from "@/lib/idioms";

const pendingLoads = new Map<LevelId, Promise<Book>>();

async function fetchLevelBook(level: LevelId): Promise<Book> {
  const pending = pendingLoads.get(level);

  if (pending) {
    return pending;
  }

  const request = fetch(`/api/idioms/${level}`).then(async (response) => {
    if (!response.ok) {
      throw new Error(`Unable to load ${level} idioms.`);
    }

    return (await response.json()) as Book;
  });

  pendingLoads.set(level, request);

  try {
    return await request;
  } finally {
    pendingLoads.delete(level);
  }
}

export function useLevelBooks(initialLevel?: LevelId, initialBook?: Book) {
  const initialBooks = initialLevel && initialBook ? { [initialLevel]: initialBook } : {};
  const booksRef = useRef<LevelBooks>(initialBooks);
  const [books, setBooks] = useState<LevelBooks>(initialBooks);

  const ensureLevel = useCallback(async (level: LevelId): Promise<Book> => {
    if (booksRef.current[level]) {
      return booksRef.current[level];
    }

    const book = await fetchLevelBook(level);
    if (!booksRef.current[level]) {
      booksRef.current = { ...booksRef.current, [level]: book };
      setBooks(booksRef.current);
    }
    return book;
  }, []);

  const ensureLevels = useCallback(async (levels: LevelId[]): Promise<void> => {
    const missingLevels = [...new Set(levels)].filter((level) => !booksRef.current[level]);

    if (!missingLevels.length) {
      return;
    }

    const loaded = await Promise.all(missingLevels.map(async (level) => [level, await fetchLevelBook(level)] as const));
    booksRef.current = { ...booksRef.current, ...Object.fromEntries(loaded) };
    setBooks(booksRef.current);
  }, []);

  return { books, ensureLevel, ensureLevels };
}
