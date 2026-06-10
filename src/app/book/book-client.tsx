"use client";

import { useEffect, useMemo, useState } from "react";
import { Bookmark, BookmarkCheck, CheckCircle2, Eye, EyeOff, MessageCircle, RotateCcw, Search, Star } from "lucide-react";
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
  const selectedIdiomKey = selectedIdiom?.id ?? "";
  const selectedStatus = selectedIdiom ? getStudyStatus(selectedIdiom.id, progress) : "new";
  const selectedExamples = selectedIdiom?.examples ?? [];
  const savedPersonalSentence = selectedIdiom ? personalExamples[selectedIdiom.id]?.text ?? "" : "";
  const personalSentenceChanged = personalSentence.trim() !== savedPersonalSentence;
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

  return (
    <main className="flex min-h-[calc(100dvh-2rem)] min-w-0 flex-col gap-4 overflow-hidden pb-4 pt-2 max-mobile:min-h-dvh max-mobile:overflow-visible">
      <Appbar title="Lesson Study" iconSrc="/icon/Seedling.svg" rightButton={<div />} onBackClick={() => history.back()} />

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
                    <StatusBadge status={getStudyStatus(idiom.id, progress)} />
                  </div>
                  <div dir="rtl" className="mt-1 font-iranYekan text-xs leading-6 text-gray-500">
                    {idiom.persian_phrase_meaning}
                  </div>
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
                    <p dir="rtl" className="mt-2 font-iranYekan text-lg leading-8 text-gray-700">
                      {selectedIdiom.persian_phrase_meaning}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 max-mobile:grid max-mobile:w-full max-mobile:grid-cols-2">
                    <div className="flex min-h-10 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 px-3 max-mobile:min-h-12">
                      <StatusBadge status={selectedStatus} />
                    </div>
                    <Button type="button" variant="outline" className="max-mobile:w-full" onClick={() => setBookmarks(toggleBookmark(selectedIdiom))}>
                      {isBookmarked(selectedIdiom) ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
                      {isBookmarked(selectedIdiom) ? "Saved" : "Save"}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 max-tablet:grid-cols-1">
                  <InfoBlock title="English Definition" text={selectedIdiom.english_definition} />
                  <InfoBlock title="Persian Definition" text={selectedIdiom.persian_definition_meaning} rtl />
                </div>

                <div>
                  <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold">Examples</h2>
                      <p className="mt-1 text-xs font-semibold text-gray-500">
                        {studyFocus.examplesVisible ? `${selectedExamples.length} example(s) available` : "Examples hidden for recall"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={studyFocus.examplesVisible ? "secondary" : "outline"}
                        onClick={() => handleExamplesVisibilityChange(!studyFocus.examplesVisible)}
                      >
                        {studyFocus.examplesVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        {studyFocus.examplesVisible ? "Hide examples" : "Show examples"}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={studyFocus.translationsVisibleByDefault ? "secondary" : "outline"}
                        disabled={!studyFocus.examplesVisible || !selectedExamples.length}
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

                  {!studyFocus.examplesVisible ? (
                    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-5 text-center">
                      <p className="text-sm font-semibold text-gray-600">Examples are hidden for focused recall.</p>
                      <Button type="button" variant="outline" className="mt-3" onClick={() => handleExamplesVisibilityChange(true)}>
                        <Eye className="size-4" />
                        Show examples
                      </Button>
                    </div>
                  ) : selectedExamples.length ? (
                    <div className="grid gap-3">
                      {selectedExamples.map((example, index) => {
                        const exampleKey = getExampleKey(selectedIdiom.id, index, example.english_text);
                        const translationVisible =
                          studyFocus.translationsVisibleByDefault || Boolean(studyFocus.revealedTranslations[exampleKey]);

                        return (
                          <div key={exampleKey} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                            <div className="flex items-start justify-between gap-3">
                              <p dir="ltr" className="min-w-0 font-semibold leading-7 text-gray-900">
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
                              ) : null}
                            </div>
                            {translationVisible ? (
                              <p dir="rtl" className="mt-2 font-iranYekan text-sm leading-7 text-gray-700">
                                {example.persian_meaning}
                              </p>
                            ) : (
                              <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-dashed border-gray-300 bg-white px-3 py-2">
                                <span className="text-xs font-bold text-gray-500">Persian translation hidden</span>
                                <Button type="button" size="sm" variant="ghost" onClick={() => handleExampleTranslationVisibilityChange(exampleKey, true)}>
                                  <Eye className="size-4" />
                                  Reveal
                                </Button>
                              </div>
                            )}
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

                <section className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <MessageCircle className="size-4 text-primaryColor" />
                    <h2 className="text-lg font-bold">My sentence</h2>
                  </div>
                  <textarea
                    value={personalSentence}
                    dir="ltr"
                    rows={3}
                    onChange={(event) => setPersonalSentence(event.target.value)}
                    placeholder="Write one sentence with this idiom."
                    className="min-h-24 w-full resize-y rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm leading-6 text-gray-900 shadow-sm outline-none transition focus:border-primaryColor/50 focus:ring-3 focus:ring-primaryColor/20"
                  />
                  <div className="mt-3 flex flex-wrap justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={!personalSentence && !savedPersonalSentence}
                      onClick={handleClearPersonalSentence}
                    >
                      Clear
                    </Button>
                    <Button type="button" disabled={!personalSentence.trim() || !personalSentenceChanged} onClick={handleSavePersonalSentence}>
                      Save sentence
                    </Button>
                  </div>
                </section>
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
