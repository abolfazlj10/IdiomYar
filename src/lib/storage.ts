import type { LevelId } from "@/types/types";
import type { IdiomEntry } from "@/lib/idioms";

const PROGRESS_KEY = "idioms:v1:progress";
const BOOKMARKS_KEY = "idioms:v1:bookmarks";
const STORIES_KEY = "idioms:v1:stories";
const PERSONAL_EXAMPLES_KEY = "idioms:v1:personal-examples";

export type RecallStatus = "known" | "learning" | "review";

export type StudyProgress = {
  studied: Record<string, string>;
  known: Record<string, string>;
  review: Record<string, string>;
};

export type Bookmark = {
  id: string;
  phrase: string;
  level: LevelId;
  lessonNumber: number;
  createdAt: string;
};

export type SavedStory = {
  id: string;
  idioms: string[];
  information: string;
  story: string;
  storyFa: string;
  storyEn: string;
  createdAt: string;
};

export type PersonalExamples = Record<
  string,
  {
    text: string;
    updatedAt: string;
  }
>;

const EMPTY_PROGRESS: StudyProgress = {
  studied: {},
  known: {},
  review: {},
};

function canUseStorage(): boolean {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function readJson<T>(key: string, fallback: T): T {
  if (!canUseStorage()) {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

function now(): string {
  return new Date().toISOString();
}

function uniqueId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function getProgress(): StudyProgress {
  return readJson<StudyProgress>(PROGRESS_KEY, EMPTY_PROGRESS);
}

export function saveProgress(progress: StudyProgress): void {
  writeJson(PROGRESS_KEY, progress);
}

export function updateProgress(mutator: (progress: StudyProgress) => StudyProgress): StudyProgress {
  const next = mutator(getProgress());
  saveProgress(next);
  return next;
}

export function markStudied(id: string, studied = true): StudyProgress {
  return updateProgress((progress) => {
    const next = {
      studied: { ...progress.studied },
      known: { ...progress.known },
      review: { ...progress.review },
    };

    if (studied) {
      next.studied[id] = now();
    } else {
      delete next.studied[id];
    }

    return next;
  });
}

export function markCard(id: string, status: "known" | "review"): StudyProgress {
  return markRecallStatus(id, status);
}

export function markRecallStatus(id: string, status: RecallStatus): StudyProgress {
  return updateProgress((progress) => {
    const timestamp = now();
    const next = {
      studied: { ...progress.studied, [id]: timestamp },
      known: { ...progress.known },
      review: { ...progress.review },
    };

    if (status === "known") {
      next.known[id] = timestamp;
      delete next.review[id];
    } else if (status === "review") {
      next.review[id] = timestamp;
      delete next.known[id];
    } else {
      delete next.known[id];
      delete next.review[id];
    }

    return next;
  });
}

export function getBookmarks(): Bookmark[] {
  return readJson<Bookmark[]>(BOOKMARKS_KEY, []);
}

export function saveBookmarks(bookmarks: Bookmark[]): void {
  writeJson(BOOKMARKS_KEY, bookmarks);
}

export function toggleBookmark(idiom: Pick<IdiomEntry, "id" | "english_phrase" | "level" | "lessonNumber">): Bookmark[] {
  const bookmarks = getBookmarks();
  const exists = bookmarks.some((item) => item.id === idiom.id);

  const next = exists
    ? bookmarks.filter((item) => item.id !== idiom.id)
    : [
        {
          id: idiom.id,
          phrase: idiom.english_phrase,
          level: idiom.level,
          lessonNumber: idiom.lessonNumber,
          createdAt: now(),
        },
        ...bookmarks,
      ];

  saveBookmarks(next);
  return next;
}

export function removeBookmark(id: string): Bookmark[] {
  const next = getBookmarks().filter((item) => item.id !== id);
  saveBookmarks(next);
  return next;
}

export function getStories(): SavedStory[] {
  return readJson<SavedStory[]>(STORIES_KEY, []);
}

export function saveStories(stories: SavedStory[]): void {
  writeJson(STORIES_KEY, stories);
}

export function addStory(story: Omit<SavedStory, "id" | "createdAt">): SavedStory[] {
  const nextStory: SavedStory = {
    ...story,
    id: uniqueId("story"),
    createdAt: now(),
  };
  const next = [nextStory, ...getStories()];
  saveStories(next);
  return next;
}

export function removeStory(id: string): SavedStory[] {
  const next = getStories().filter((item) => item.id !== id);
  saveStories(next);
  return next;
}

export function getPersonalExamples(): PersonalExamples {
  return readJson<PersonalExamples>(PERSONAL_EXAMPLES_KEY, {});
}

export function savePersonalExample(id: string, text: string): PersonalExamples {
  const examples = getPersonalExamples();
  const trimmedText = text.trim();
  const next = { ...examples };

  if (trimmedText) {
    next[id] = {
      text: trimmedText,
      updatedAt: now(),
    };
  } else {
    delete next[id];
  }

  writeJson(PERSONAL_EXAMPLES_KEY, next);
  return next;
}

export function removePersonalExample(id: string): PersonalExamples {
  const examples = getPersonalExamples();
  const next = { ...examples };
  delete next[id];
  writeJson(PERSONAL_EXAMPLES_KEY, next);
  return next;
}
