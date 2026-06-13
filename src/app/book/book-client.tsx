"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Bookmark, BookmarkCheck, CheckCircle2, Eye, EyeOff, RotateCcw, Search, Star } from "lucide-react";
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
  getPersonalExamples,
  getProgress,
  markRecallStatus,
  removePersonalExample,
  savePersonalExample,
  toggleBookmark,
  type Bookmark as StoredBookmark,
  type PersonalExamples,
  type RecallStatus,
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

type StudyFocusState = {
  examplesVisible: boolean;
  translationsVisibleByDefault: boolean;
  revealedTranslations: Record<string, boolean>;
};

type StudyListStatus = RecallStatus | "new";

const DEFAULT_STUDY_FOCUS_STATE: StudyFocusState = {
  examplesVisible: true,
  translationsVisibleByDefault: true,
  revealedTranslations: {},
};
const VISIBLE_STUDY_CONTENT_CLASS = "blur-0 opacity-100";
const HIDDEN_STUDY_CONTENT_CLASS = "select-none blur-[5px] opacity-60";

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

function getStudyStatus(id: string, progress: StudyProgress): StudyListStatus {
  if (progress.review[id]) {
    return "review";
  }

  if (progress.known[id]) {
    return "known";
  }

  if (progress.studied[id]) {
    return "learning";
  }

  return "new";
}

function getExampleKey(idiomId: string, index: number, englishText: string): string {
  return `${idiomId}:example:${index}:${englishText}`;
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
  const [studyFocus, setStudyFocus] = useState<StudyFocusState>(DEFAULT_STUDY_FOCUS_STATE);
  const [personalExamples, setPersonalExamples] = useState<PersonalExamples>({});
  const [personalSentence, setPersonalSentence] = useState("");

  const hasSearchQuery = Boolean(query.trim());
  const lessons = useMemo(() => getLessons(activeLevel), [activeLevel]);
  const lessonIdioms = useMemo(() => getIdiomsForLesson(activeLevel, activeLesson), [activeLevel, activeLesson]);
  const searchResults = useMemo(() => (hasSearchQuery ? getAllIdioms().filter((idiom) => idiomMatchesSearch(idiom, query)) : []), [hasSearchQuery, query]);
  const visibleIdioms = hasSearchQuery ? searchResults : lessonIdioms;
  const selectedIdiom = visibleIdioms.find((idiom) => idiom.id === selectedIdiomId) ?? visibleIdioms[0];
  const studiedCount = getAllIdioms(activeLevel).filter((idiom) => progress.studied[idiom.id]).length;
  const totalCount = getAllIdioms(activeLevel).length;
  const levelProgressPercent = totalCount ? (studiedCount / totalCount) * 100 : 0;
  const selectedIdiomIndex = selectedIdiom ? visibleIdioms.findIndex((idiom) => idiom.id === selectedIdiom.id) : -1;
  const selectedIdiomPosition = selectedIdiomIndex >= 0 ? selectedIdiomIndex + 1 : 0;
  const selectedIdiomKey = selectedIdiom?.id ?? "";
  const selectedStatus = selectedIdiom ? getStudyStatus(selectedIdiom.id, progress) : "new";
  const selectedExamples = selectedIdiom?.examples ?? [];
  const savedPersonalSentence = selectedIdiom ? personalExamples[selectedIdiom.id]?.text ?? "" : "";
  const personalSentenceChanged = personalSentence.trim() !== savedPersonalSentence;
  const selectedExamplesLabel = `${selectedExamples.length} example${selectedExamples.length === 1 ? "" : "s"}`;
  const studyFocusSummary = !selectedExamples.length
    ? "No examples for this idiom yet"
    : studyFocus.examplesVisible && studyFocus.translationsVisibleByDefault
      ? `${selectedExamplesLabel} with Persian translations`
      : studyFocus.examplesVisible
        ? `${selectedExamplesLabel}; Persian translations hidden`
        : studyFocus.translationsVisibleByDefault
          ? ""
          : "English examples and Persian translations hidden";
  const isDefaultStudyFocus =
    studyFocus.examplesVisible && studyFocus.translationsVisibleByDefault && !Object.keys(studyFocus.revealedTranslations).length;

  useEffect(() => {
    setProgress(getProgress());
    setBookmarks(getBookmarks());
    setPersonalExamples(getPersonalExamples());
  }, []);

  useEffect(() => {
    setStudyFocus((focus) => ({ ...focus, revealedTranslations: {} }));
  }, [activeLesson, activeLevel, query, selectedIdiomKey]);

  useEffect(() => {
    setPersonalSentence(selectedIdiomKey ? personalExamples[selectedIdiomKey]?.text ?? "" : "");
  }, [personalExamples, selectedIdiomKey]);

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
  const resetStudyFocus = (): void => {
    setStudyFocus({ ...DEFAULT_STUDY_FOCUS_STATE, revealedTranslations: {} });
  };
  const handleExamplesVisibilityChange = (examplesVisible: boolean): void => {
    setStudyFocus((focus) => ({ ...focus, examplesVisible }));
  };
  const handleTranslationsVisibilityChange = (translationsVisibleByDefault: boolean): void => {
    setStudyFocus((focus) => ({
      ...focus,
      translationsVisibleByDefault,
      revealedTranslations: translationsVisibleByDefault ? {} : focus.revealedTranslations,
    }));
  };
  const handleExampleTranslationVisibilityChange = (exampleKey: string, visible: boolean): void => {
    setStudyFocus((focus) => ({
      ...focus,
      revealedTranslations: {
        ...focus.revealedTranslations,
        [exampleKey]: visible,
      },
    }));
  };
  const handleRecallStatus = (status: RecallStatus): void => {
    if (!selectedIdiom) {
      return;
    }

    setProgress(markRecallStatus(selectedIdiom.id, status));
  };
  const handleSavePersonalSentence = (): void => {
    if (!selectedIdiom) {
      return;
    }

    setPersonalExamples(savePersonalExample(selectedIdiom.id, personalSentence));
  };
  const handleClearPersonalSentence = (): void => {
    if (!selectedIdiom) {
      return;
    }

    setPersonalSentence("");
    setPersonalExamples(removePersonalExample(selectedIdiom.id));
  };
  const handlePreviousIdiom = (): void => {
    if (selectedIdiomIndex > 0) {
      setSelectedIdiomId(visibleIdioms[selectedIdiomIndex - 1].id);
    }
  };
  const handleNextIdiom = (): void => {
    if (selectedIdiomIndex < visibleIdioms.length - 1) {
      setSelectedIdiomId(visibleIdioms[selectedIdiomIndex + 1].id);
    }
  };

  return (
    <main className="flex min-h-[calc(100dvh-2rem)] min-w-0 flex-col gap-4 overflow-hidden pb-4 pt-2 max-mobile:min-h-dvh max-mobile:overflow-visible">
      <Appbar title="Lesson Study" iconSrc="/icon/Seedling.svg" rightButton={<div />} onBackClick={() => history.back()} />

      <section className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] gap-4 max-mobile:min-h-0">
        <section className="rounded-lg border border-border bg-white p-3 shadow-sm">
          <div className="grid gap-3 laptop:grid-cols-[auto_minmax(220px,280px)_minmax(260px,1fr)] laptop:items-center">
            <div className="flex flex-wrap gap-2">
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
                  className={`min-h-10 rounded-lg border px-3 text-sm font-bold transition ${
                    activeLevel === level.id ? level.softAccent : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {level.label}
                </button>
              ))}
            </div>

            <div className="flex min-h-10 w-full items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3">
              <span className="shrink-0 text-xs font-bold text-gray-500">Studied</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-white">
                <div className="h-full rounded-full bg-primaryColor" style={{ width: `${levelProgressPercent}%` }} />
              </div>
              <span className="shrink-0 text-xs font-black text-gray-700">
                {studiedCount}/{totalCount}
              </span>
            </div>

            <label className="relative min-w-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search idioms, meanings, or lessons"
                className="pl-9"
              />
            </label>
          </div>

          {!hasSearchQuery ? (
            <div className="mt-3 grid gap-2 laptop:grid-cols-[82px_minmax(0,1fr)] laptop:items-center">
              <div className="text-xs font-black uppercase tracking-wide text-gray-500">Lessons</div>
              <div className="flex min-w-0 gap-2 overflow-x-auto pb-1 customScrollBarStyle">
                {lessons.map((lesson) => {
                  const idioms = getIdiomsForLesson(activeLevel, lesson.lesson_number);
                  const studiedInLesson = idioms.filter((idiom) => progress.studied[idiom.id]).length;
                  return (
                    <button
                      key={lesson.lesson_number}
                      type="button"
                      aria-label={`Lesson ${lesson.lesson_number}, ${studiedInLesson} of ${idioms.length} studied`}
                      onClick={() => {
                        setActiveLesson(lesson.lesson_number);
                        setSelectedIdiomId("");
                      }}
                      className={`flex min-h-10 min-w-[74px] items-center justify-between gap-2 rounded-lg border px-2.5 text-left transition ${
                        activeLesson === lesson.lesson_number
                          ? "border-primaryColor bg-primaryColor/10 shadow-sm"
                          : "border-gray-200 bg-white hover:border-primaryColor/40 hover:bg-gray-50"
                      }`}
                    >
                      <span className="text-sm font-black">{lesson.lesson_number}</span>
                      <span className="text-[11px] font-semibold text-gray-500">
                        {studiedInLesson}/{idioms.length}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="mt-3 rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-500">
              {searchResults.length} result(s) across all levels
            </div>
          )}

          <div className="mt-3 grid gap-2 border-t border-gray-100 pt-3 laptop:grid-cols-[150px_minmax(0,1fr)] laptop:items-center">
            <div className="flex flex-wrap items-center justify-between gap-2 laptop:block">
              <div>
                <h2 className="text-sm font-black">{hasSearchQuery ? "Matching idioms" : `Lesson ${activeLesson} idioms`}</h2>
                <p className="text-xs font-semibold text-gray-500">
                  {selectedIdiomPosition}/{visibleIdioms.length} selected
                </p>
              </div>
            </div>

            {visibleIdioms.length ? (
              <div className="flex min-w-0 gap-2 overflow-x-auto pb-1 customScrollBarStyle">
                {visibleIdioms.map((idiom) => (
                  <button
                    key={idiom.id}
                    type="button"
                    onClick={() => handleSelectIdiom(idiom)}
                    className={`min-h-[62px] min-w-[195px] max-w-[235px] rounded-lg border px-3 py-2 text-left transition ${
                      selectedIdiom?.id === idiom.id
                        ? "border-primaryColor bg-primaryColor/10 shadow-sm"
                        : "border-gray-200 bg-white hover:border-primaryColor/40 hover:bg-gray-50"
                    }`}
                  >
                    <span className="flex items-start justify-between gap-3">
                      <span className="min-w-0 truncate text-sm font-black">{idiom.english_phrase}</span>
                      <StatusBadge status={getStudyStatus(idiom.id, progress)} />
                    </span>
                    <span dir="rtl" className="mt-1 block truncate font-iranYekan text-xs leading-6 text-gray-500">
                      {idiom.persian_phrase_meaning}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-center text-sm font-semibold text-gray-500">
                No idioms match this search.
              </div>
            )}
          </div>
        </section>

        <article className="min-h-0 overflow-y-auto rounded-lg border border-border bg-white p-5 shadow-sm customScrollBarStyle">
          {selectedIdiom ? (
            <div className="flex flex-col gap-5">
              <div className="flex items-start justify-between gap-6 max-mobile:flex-col">
                <div className="min-w-0 flex-1">

                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    <h1 className="text-3xl font-black max-tablet:text-2xl">{selectedIdiom.english_phrase}</h1>
                    <p dir="rtl" className="font-iranYekan text-lg leading-8 text-gray-700">
                      {selectedIdiom.persian_phrase_meaning}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2 max-mobile:w-full max-mobile:justify-stretch">
                  <div className="flex min-h-10 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 px-3 max-mobile:min-h-12">
                    <StatusBadge status={selectedStatus} />
                  </div>
                  <Button type="button" variant="outline" className="max-mobile:flex-1" onClick={() => setBookmarks(toggleBookmark(selectedIdiom))}>
                    {isBookmarked(selectedIdiom) ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
                    {isBookmarked(selectedIdiom) ? "Saved" : "Save"}
                  </Button>
                </div>
              </div>

                <div className="flex items-center justify-center gap-3">
                  <span className="text-xs font-bold text-gray-500">
                    {selectedIdiomPosition} / {visibleIdioms.length}
                  </span>
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handlePreviousIdiom}
                  disabled={selectedIdiomIndex <= 0}
                  className="fixed left-4 top-1/2 -translate-y-1/2 z-50 px-2"
                >
                  <ArrowLeft className="size-4" />
                  <span>Previous</span>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleNextIdiom}
                  disabled={selectedIdiomIndex >= visibleIdioms.length - 1}
                  className="fixed right-4 top-1/2 -translate-y-1/2 z-50 px-2"
                >
                  <span>Next</span>
                  <ArrowRight className="size-4" />
                </Button>

                <div className="grid grid-cols-2 gap-3 max-tablet:grid-cols-1">
                  <InfoBlock title="English Definition" text={selectedIdiom.english_definition} />
                  <InfoBlock title="Persian Definition" text={selectedIdiom.persian_definition_meaning} rtl />
                </div>

                <div>
                  <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold">Examples</h2>
                      <p className="mt-1 text-xs font-semibold text-gray-500">{studyFocusSummary}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={studyFocus.examplesVisible ? "secondary" : "outline"}
                        onClick={() => handleExamplesVisibilityChange(!studyFocus.examplesVisible)}
                      >
                        {studyFocus.examplesVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        {studyFocus.examplesVisible ? "Hide English examples" : "Show English examples"}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={studyFocus.translationsVisibleByDefault ? "secondary" : "outline"}
                        disabled={!selectedExamples.length}
                        onClick={() => handleTranslationsVisibilityChange(!studyFocus.translationsVisibleByDefault)}
                      >
                        {studyFocus.translationsVisibleByDefault ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        {studyFocus.translationsVisibleByDefault ? "Hide Persian translations" : "Show Persian translations"}
                      </Button>
                      <Button type="button" size="sm" variant="ghost" disabled={isDefaultStudyFocus} onClick={resetStudyFocus}>
                        <RotateCcw className="size-4" />
                        Reset view
                      </Button>
                    </div>
                  </div>

                  {selectedExamples.length ? (
                    <div className="grid gap-3">
                      {selectedExamples.map((example, index) => {
                        const exampleKey = getExampleKey(selectedIdiom.id, index, example.english_text);
                        const translationVisible =
                          studyFocus.translationsVisibleByDefault || Boolean(studyFocus.revealedTranslations[exampleKey]);

                        return (
                          <div key={exampleKey} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                            <div className="flex items-start justify-between gap-3">
                              <p
                                dir="ltr"
                                aria-hidden={!studyFocus.examplesVisible}
                                className={`min-w-0 font-semibold leading-7 text-gray-900 transition-all duration-150 ${
                                  studyFocus.examplesVisible ? VISIBLE_STUDY_CONTENT_CLASS : HIDDEN_STUDY_CONTENT_CLASS
                                }`}
                              >
                                {example.english_text}
                              </p>
                              {!studyFocus.translationsVisibleByDefault ? (
                                <button
                                  type="button"
                                  aria-label={`${translationVisible ? "Hide" : "Reveal"} Persian translation for example ${index + 1}`}
                                  onClick={() => handleExampleTranslationVisibilityChange(exampleKey, !translationVisible)}
                                  className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:border-primaryColor/40 hover:bg-white focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primaryColor/25"
                                >
                                  {translationVisible ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
                                </button>
                              ) : (
                                <span className="size-10 shrink-0" aria-hidden="true" />
                              )}
                            </div>
                            <p
                              dir="rtl"
                              aria-hidden={!translationVisible}
                              className={`mt-2 font-iranYekan text-sm leading-7 text-gray-700 transition-all duration-150 ${
                                translationVisible ? VISIBLE_STUDY_CONTENT_CLASS : HIDDEN_STUDY_CONTENT_CLASS
                              }`}
                            >
                              {example.persian_meaning}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-5 text-center text-sm font-semibold text-gray-500">
                      No examples for this idiom yet.
                    </div>
                  )}
                </div>

                <section className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold">Recall check</h2>
                      <p className="mt-1 text-xs font-semibold text-gray-500">Mark how this idiom feels after studying.</p>
                    </div>
                    <StatusBadge status={selectedStatus} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 max-mobile:grid-cols-1">
                    <Button
                      type="button"
                      variant={selectedStatus === "known" ? "success" : "outline"}
                      aria-pressed={selectedStatus === "known"}
                      onClick={() => handleRecallStatus("known")}
                    >
                      <CheckCircle2 className="size-4" />
                      Got it
                    </Button>
                    <Button
                      type="button"
                      variant={selectedStatus === "learning" ? "secondary" : "outline"}
                      aria-pressed={selectedStatus === "learning"}
                      onClick={() => handleRecallStatus("learning")}
                    >
                      <RotateCcw className="size-4" />
                      Still learning
                    </Button>
                    <Button
                      type="button"
                      variant={selectedStatus === "review" ? "review" : "outline"}
                      aria-pressed={selectedStatus === "review"}
                      onClick={() => handleRecallStatus("review")}
                    >
                      <Star className="size-4" />
                      Needs review
                    </Button>
                  </div>
                </section>

              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-gray-500">No idioms match this search.</div>
            )}
        </article>
      </section>
    </main>
  );
}

function StatusBadge({ status }: { status: StudyListStatus }): React.ReactElement {
  const styles: Record<StudyListStatus, { label: string; className: string }> = {
    new: {
      label: "New",
      className: "border-gray-200 bg-white text-gray-500",
    },
    learning: {
      label: "Learning",
      className: "border-blue-200 bg-blue-50 text-blue-700",
    },
    review: {
      label: "Review",
      className: "border-amber-200 bg-amber-50 text-amber-800",
    },
    known: {
      label: "Known",
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    },
  };
  const style = styles[status];

  return (
    <span className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[11px] font-black ${style.className}`}>
      {style.label}
    </span>
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
