"use client";

import { useEffect, useMemo, useState } from "react";
import { Bookmark, BookmarkCheck, CheckCircle2, Search } from "lucide-react";
import Appbar from "@/components/appbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  findIdiomById,
  getAllIdioms,
  getIdiomsForLesson,
  getLessons,
  idiomMatchesSearch,
  LEVELS,
  type IdiomEntry,
} from "@/lib/idioms";
import {
  getBookmarks,
  getProgress,
  markStudied,
  toggleBookmark,
  type Bookmark as StoredBookmark,
  type StudyProgress,
} from "@/lib/storage";
import type { LevelId } from "@/types/types";

const DEFAULT_LEVEL: LevelId = "elementary";

export type StudySearchParams = {
  level?: string | string[];
  lesson?: string | string[];
  idiom?: string | string[];
};

type BookPageProps = {
  searchParams?: StudySearchParams;
};

type RequestedStudyPosition = {
  level: LevelId;
  lesson: number;
  idiomId?: string;
};

function getParam(value: string | string[] | undefined): string | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function getFirstLessonNumber(level: LevelId): number {
  return getLessons(level)[0]?.lesson_number ?? 1;
}

function parseLevelParam(value: string | null): LevelId | null {
  return LEVELS.some((level) => level.id === value) ? (value as LevelId) : null;
}

function parseLessonParam(level: LevelId, value: string | null): number | null {
  const lessonNumber = Number(value);

  if (!Number.isInteger(lessonNumber)) {
    return null;
  }

  return getLessons(level).some((lesson) => lesson.lesson_number === lessonNumber) ? lessonNumber : null;
}

function findRequestedIdiom(value: string | null): IdiomEntry | undefined {
  if (!value) {
    return undefined;
  }

  const directMatch = findIdiomById(value);

  if (directMatch) {
    return directMatch;
  }

  try {
    return findIdiomById(decodeURIComponent(value));
  } catch {
    return undefined;
  }
}

function getRequestedStudyPosition(searchParams?: StudySearchParams): RequestedStudyPosition | null {
  const requestedIdiom = findRequestedIdiom(getParam(searchParams?.idiom));

  if (requestedIdiom) {
    return {
      level: requestedIdiom.level,
      lesson: requestedIdiom.lessonNumber,
      idiomId: requestedIdiom.id,
    };
  }

  const level = parseLevelParam(getParam(searchParams?.level));

  if (!level) {
    return null;
  }

  return {
    level,
    lesson: parseLessonParam(level, getParam(searchParams?.lesson)) ?? getFirstLessonNumber(level),
  };
}

export default function Book({ searchParams }: BookPageProps): React.ReactElement {
  const requestedLevelParam = getParam(searchParams?.level);
  const requestedLessonParam = getParam(searchParams?.lesson);
  const requestedIdiomParam = getParam(searchParams?.idiom);
  const requestedPosition = useMemo(
    () =>
      getRequestedStudyPosition({
        level: requestedLevelParam ?? undefined,
        lesson: requestedLessonParam ?? undefined,
        idiom: requestedIdiomParam ?? undefined,
      }),
    [requestedLevelParam, requestedLessonParam, requestedIdiomParam]
  );
  const [activeLevel, setActiveLevel] = useState<LevelId>(requestedPosition?.level ?? DEFAULT_LEVEL);
  const [activeLesson, setActiveLesson] = useState<number>(
    requestedPosition?.lesson ?? getFirstLessonNumber(requestedPosition?.level ?? DEFAULT_LEVEL)
  );
  const [selectedIdiomId, setSelectedIdiomId] = useState<string>(requestedPosition?.idiomId ?? "");
  const [query, setQuery] = useState("");
  const [progress, setProgress] = useState<StudyProgress>({ studied: {}, known: {}, review: {} });
  const [bookmarks, setBookmarks] = useState<StoredBookmark[]>([]);

  const hasSearchQuery = Boolean(query.trim());
  const lessons = useMemo(() => getLessons(activeLevel), [activeLevel]);
  const lessonIdioms = useMemo(() => getIdiomsForLesson(activeLevel, activeLesson), [activeLevel, activeLesson]);
  const searchResults = useMemo(() => (hasSearchQuery ? getAllIdioms().filter((idiom) => idiomMatchesSearch(idiom, query)) : []), [hasSearchQuery, query]);
  const visibleIdioms = hasSearchQuery ? searchResults : lessonIdioms;
  const selectedIdiom = visibleIdioms.find((idiom) => idiom.id === selectedIdiomId) ?? visibleIdioms[0];
  const studiedCount = getAllIdioms(activeLevel).filter((idiom) => progress.studied[idiom.id]).length;
  const totalCount = getAllIdioms(activeLevel).length;

  useEffect(() => {
    setProgress(getProgress());
    setBookmarks(getBookmarks());
  }, []);

  useEffect(() => {
    if (!requestedPosition) {
      return;
    }

    setActiveLevel(requestedPosition.level);
    setActiveLesson(requestedPosition.lesson);
    setSelectedIdiomId(requestedPosition.idiomId ?? "");
    setQuery("");
  }, [requestedPosition]);

  useEffect(() => {
    if (visibleIdioms.length && !visibleIdioms.some((idiom) => idiom.id === selectedIdiomId)) {
      setSelectedIdiomId(visibleIdioms[0].id);
    }
  }, [selectedIdiomId, visibleIdioms]);

  const isBookmarked = (idiom: IdiomEntry): boolean => bookmarks.some((item) => item.id === idiom.id);
  const handleSelectIdiom = (idiom: IdiomEntry): void => {
    setSelectedIdiomId(idiom.id);

    if (hasSearchQuery) {
      setActiveLevel(idiom.level);
      setActiveLesson(idiom.lessonNumber);
    }
  };

  return (
    <main className="flex min-h-[calc(100dvh-2rem)] min-w-0 flex-col gap-4 overflow-hidden pb-4 pt-2 max-mobile:min-h-dvh max-mobile:overflow-visible">
      <Appbar title="Book Study" iconSrc="/icon/Open Book.svg" rightButton={<div />} onBackClick={() => history.back()} />

      <section className="grid min-h-0 flex-1 grid-cols-[290px_minmax(0,1fr)] gap-4 max-laptop:grid-cols-1">
        <aside className="flex min-h-0 flex-col gap-3 rounded-lg border border-border bg-white p-3 shadow-sm max-laptop:max-h-[360px]">
          <div className="grid grid-cols-3 gap-2">
            {LEVELS.map((level) => (
              <button
                key={level.id}
                type="button"
                onClick={() => {
                  setActiveLevel(level.id);
                  setActiveLesson(getFirstLessonNumber(level.id));
                  setSelectedIdiomId("");
                  setQuery("");
                }}
                className={`rounded-lg border px-2 py-2 text-xs font-bold transition ${
                  activeLevel === level.id ? level.softAccent : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {level.label}
              </button>
            ))}
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <div className="mb-1 text-xs font-semibold text-gray-500">Studied in this level</div>
            <div className="flex items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-white">
                <div className="h-full rounded-full bg-primaryColor" style={{ width: `${totalCount ? (studiedCount / totalCount) * 100 : 0}%` }} />
              </div>
              <span className="text-xs font-bold text-gray-700">
                {studiedCount}/{totalCount}
              </span>
            </div>
          </div>

          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search idioms, meanings, or lessons"
              className="pl-9"
            />
          </label>

          <div className="min-h-0 flex-1 overflow-y-auto pr-1 customScrollBarStyle">
            {!query.trim() ? (
              <div className="grid grid-cols-2 gap-2">
                {lessons.map((lesson) => {
                  const idioms = getIdiomsForLesson(activeLevel, lesson.lesson_number);
                  const studiedInLesson = idioms.filter((idiom) => progress.studied[idiom.id]).length;
                  return (
                    <button
                      key={lesson.lesson_number}
                      type="button"
                      onClick={() => {
                        setActiveLesson(lesson.lesson_number);
                        setSelectedIdiomId("");
                      }}
                      className={`rounded-lg border p-3 text-left transition ${
                        activeLesson === lesson.lesson_number
                          ? "border-primaryColor bg-primaryColor/10 shadow-sm"
                          : "border-gray-200 bg-white hover:border-primaryColor/40"
                      }`}
                    >
                      <div className="text-sm font-bold">Lesson {lesson.lesson_number}</div>
                      <div className="mt-1 text-xs text-gray-500">
                        {studiedInLesson}/{idioms.length} studied
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-xs text-gray-500">{searchResults.length} result(s) across all levels</div>
            )}
          </div>
        </aside>

        <section className="grid min-h-0 grid-cols-[minmax(260px,360px)_minmax(0,1fr)] gap-4 max-tablet:grid-cols-1 max-mobile:min-h-0">
          <div className="min-h-0 overflow-y-auto rounded-lg border border-border bg-white p-3 shadow-sm customScrollBarStyle">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">{query.trim() ? "Search Results" : `Lesson ${activeLesson}`}</h2>
                <p className="text-xs text-gray-500">{visibleIdioms.length} idioms</p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {visibleIdioms.map((idiom) => (
                <button
                  key={idiom.id}
                  type="button"
                  onClick={() => handleSelectIdiom(idiom)}
                  className={`rounded-lg border p-3 text-left transition ${
                    selectedIdiom?.id === idiom.id ? "border-primaryColor bg-primaryColor/10" : "border-gray-200 bg-white hover:border-primaryColor/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-sm font-bold">{idiom.english_phrase}</span>
                    {progress.studied[idiom.id] ? <CheckCircle2 className="size-4 shrink-0 text-green-600" /> : null}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">{idiom.persian_phrase_meaning}</div>
                  {hasSearchQuery ? (
                    <div className="mt-2 text-[11px] font-bold uppercase tracking-wide text-primaryColor">
                      {idiom.levelLabel} · Lesson {idiom.lessonNumber}
                    </div>
                  ) : null}
                </button>
              ))}
            </div>
          </div>

          <article className="min-h-0 overflow-y-auto rounded-lg border border-border bg-white p-5 shadow-sm customScrollBarStyle">
            {selectedIdiom ? (
              <div className="flex flex-col gap-5">
                <div className="flex items-start justify-between gap-4 max-mobile:flex-col">
                  <div className="min-w-0">
                    <div className="mb-2 text-xs font-bold uppercase tracking-wide text-primaryColor">
                      {selectedIdiom.levelLabel} · Lesson {selectedIdiom.lessonNumber}
                    </div>
                    <h1 className="text-3xl font-black max-tablet:text-2xl">{selectedIdiom.english_phrase}</h1>
                    <p className="mt-2 font-iranYekan text-lg text-gray-700">{selectedIdiom.persian_phrase_meaning}</p>
                  </div>
                  <div className="flex shrink-0 gap-2 max-mobile:grid max-mobile:w-full max-mobile:grid-cols-2">
                    <Button
                      type="button"
                      variant={progress.studied[selectedIdiom.id] ? "secondary" : "outline"}
                      className="max-mobile:w-full"
                      onClick={() => setProgress(markStudied(selectedIdiom.id, !progress.studied[selectedIdiom.id]))}
                    >
                      <CheckCircle2 className="size-4" />
                      {progress.studied[selectedIdiom.id] ? "Studied" : "Mark studied"}
                    </Button>
                    <Button type="button" variant="outline" className="max-mobile:w-full" onClick={() => setBookmarks(toggleBookmark(selectedIdiom))}>
                      {isBookmarked(selectedIdiom) ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
                      {isBookmarked(selectedIdiom) ? "Saved" : "Save"}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 max-tablet:grid-cols-1">
                  <InfoBlock title="English Definition" text={selectedIdiom.english_definition} />
                  <InfoBlock title="Persian Definition" text={selectedIdiom.persian_definition_meaning} rtl />
                  <InfoBlock title="Usage Note" text={selectedIdiom.english_explanation} />
                  <InfoBlock title="یادداشت کاربردی" text={selectedIdiom.persian_explanation_meaning} rtl />
                </div>

                <div>
                  <h2 className="mb-3 text-lg font-bold">Examples</h2>
                  <div className="grid gap-3">
                    {selectedIdiom.examples?.map((example) => (
                      <div key={example.english_text} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                        <p className="font-semibold text-gray-900">{example.english_text}</p>
                        <p dir="rtl" className="mt-2 font-iranYekan text-sm leading-7 text-gray-700">
                          {example.persian_meaning}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-gray-500">No idioms match this search.</div>
            )}
          </article>
        </section>
      </section>
    </main>
  );
}

function InfoBlock({ title, text, rtl = false }: { title: string; text?: string | null; rtl?: boolean }): React.ReactElement {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">{title}</div>
      <p dir={rtl ? "rtl" : "ltr"} className={`${rtl ? "font-iranYekan text-right leading-7" : "leading-6"} text-sm text-gray-800`}>
        {text || "No extra note for this idiom."}
      </p>
    </div>
  );
}
