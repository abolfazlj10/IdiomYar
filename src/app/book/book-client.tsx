"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Check,
  ChevronDown,
  Eye,
  EyeOff,
  PanelRightOpen,
  Search,
  Settings2,
  X,
} from "lucide-react";
import Appbar from "@/components/appbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
  toggleBookmark,
  type Bookmark as StoredBookmark,
  type RecallStatus,
  type StudyProgress,
} from "@/lib/storage";
import { cn } from "@/lib/utils";
import type { LevelId } from "@/types/types";

const DEFAULT_LEVEL: LevelId = "elementary";
const STUDY_BLUR_MODE_KEY = "idioms:v1:lesson-study-blur-mode";

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

type StudyPosition = {
  level: LevelId;
  lesson: number;
};

type StudyListStatus = RecallStatus | "new";
type StudyBlurMode = "persian" | "english" | "none";

type StudyBlurModeOption = {
  id: StudyBlurMode;
  label: string;
  description: string;
};

const STUDY_STATUS_LABELS: Record<StudyListStatus, string> = {
  new: "New",
  learning: "Learning",
  review: "Review",
  known: "Known",
};

const STUDY_BLUR_MODE_OPTIONS: StudyBlurModeOption[] = [
  {
    id: "persian",
    label: "Persian hidden",
    description: "English stays visible. Persian meanings start blurred.",
  },
  {
    id: "english",
    label: "English hidden",
    description: "Persian stays visible. English examples start blurred.",
  },
  {
    id: "none",
    label: "Both visible",
    description: "Both example lines stay visible by default.",
  },
];

const BLURRED_STUDY_CONTENT_CLASS = "select-none";
const BLURRED_STUDY_CONTENT_STYLE = {
  filter: "blur(6px)",
  opacity: 0.55,
} satisfies CSSProperties;
const HEADER_TOOL_BUTTON_CLASS = "min-h-9 px-3 py-1.5 text-xs font-bold max-mobile:min-h-10 max-mobile:px-3";
const HEADER_ICON_BUTTON_CLASS = "size-9 max-mobile:size-10";

function getParam(value: string | string[] | undefined): string | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function getFirstLessonNumber(level: LevelId): number {
  return getLessons(level)[0]?.lesson_number ?? 1;
}

function getNextLessonPosition(level: LevelId, lessonNumber: number): StudyPosition | null {
  const levelIndex = LEVELS.findIndex((item) => item.id === level);

  if (levelIndex < 0) {
    return null;
  }

  const lessons = getLessons(level);
  const lessonIndex = lessons.findIndex((lesson) => lesson.lesson_number === lessonNumber);
  const nextLesson = lessonIndex >= 0 ? lessons[lessonIndex + 1] : undefined;

  if (nextLesson) {
    return {
      level,
      lesson: nextLesson.lesson_number,
    };
  }

  for (const nextLevel of LEVELS.slice(levelIndex + 1)) {
    const firstLesson = getLessons(nextLevel.id)[0];

    if (firstLesson) {
      return {
        level: nextLevel.id,
        lesson: firstLesson.lesson_number,
      };
    }
  }

  return null;
}

function getPreviousLessonPosition(level: LevelId, lessonNumber: number): StudyPosition | null {
  const levelIndex = LEVELS.findIndex((item) => item.id === level);

  if (levelIndex < 0) {
    return null;
  }

  const lessons = getLessons(level);
  const lessonIndex = lessons.findIndex((lesson) => lesson.lesson_number === lessonNumber);
  const previousLesson = lessonIndex > 0 ? lessons[lessonIndex - 1] : undefined;

  if (previousLesson) {
    return {
      level,
      lesson: previousLesson.lesson_number,
    };
  }

  for (let previousLevelIndex = levelIndex - 1; previousLevelIndex >= 0; previousLevelIndex -= 1) {
    const previousLevel = LEVELS[previousLevelIndex];
    const lastLesson = getLessons(previousLevel.id).at(-1);

    if (lastLesson) {
      return {
        level: previousLevel.id,
        lesson: lastLesson.lesson_number,
      };
    }
  }

  return null;
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

function readStudyBlurMode(): StudyBlurMode {
  if (typeof window === "undefined") {
    return "persian";
  }

  try {
    const value = window.localStorage.getItem(STUDY_BLUR_MODE_KEY);

    return value === "english" || value === "none" || value === "persian" ? value : "persian";
  } catch {
    return "persian";
  }
}

function saveStudyBlurMode(mode: StudyBlurMode): void {
  try {
    window.localStorage.setItem(STUDY_BLUR_MODE_KEY, mode);
  } catch {
    // The in-memory state still updates when storage is unavailable.
  }
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
  const [studyToolsOpen, setStudyToolsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [blurMode, setBlurMode] = useState<StudyBlurMode>("persian");
  const [exampleOverrides, setExampleOverrides] = useState<Record<string, boolean>>({});

  const hasSearchQuery = Boolean(query.trim());
  const trimmedQuery = query.trim();
  const lessons = useMemo(() => getLessons(activeLevel), [activeLevel]);
  const lessonIdioms = useMemo(() => getIdiomsForLesson(activeLevel, activeLesson), [activeLevel, activeLesson]);
  const searchResults = useMemo(
    () => (hasSearchQuery ? getAllIdioms().filter((idiom) => idiomMatchesSearch(idiom, query)) : []),
    [hasSearchQuery, query]
  );
  const visibleIdioms = hasSearchQuery ? searchResults : lessonIdioms;
  const selectedIdiom = visibleIdioms.find((idiom) => idiom.id === selectedIdiomId) ?? visibleIdioms[0];
  const allLevelIdioms = useMemo(() => getAllIdioms(activeLevel), [activeLevel]);
  const studiedCount = allLevelIdioms.filter((idiom) => progress.studied[idiom.id]).length;
  const totalCount = allLevelIdioms.length;
  const levelProgressPercent = totalCount ? (studiedCount / totalCount) * 100 : 0;
  const selectedIdiomIndex = selectedIdiom ? visibleIdioms.findIndex((idiom) => idiom.id === selectedIdiom.id) : -1;
  const selectedIdiomPosition = selectedIdiomIndex >= 0 ? selectedIdiomIndex + 1 : 0;
  const selectedIdiomKey = selectedIdiom?.id ?? "";
  const selectedExamples = selectedIdiom?.examples ?? [];
  const activeLevelMeta = LEVELS.find((level) => level.id === activeLevel) ?? LEVELS[0];
  const previousLessonPosition = useMemo(
    () => (hasSearchQuery ? null : getPreviousLessonPosition(activeLevel, activeLesson)),
    [activeLesson, activeLevel, hasSearchQuery]
  );
  const nextLessonPosition = useMemo(
    () => (hasSearchQuery ? null : getNextLessonPosition(activeLevel, activeLesson)),
    [activeLesson, activeLevel, hasSearchQuery]
  );
  const previousLessonLevelLabel = previousLessonPosition ? LEVELS.find((level) => level.id === previousLessonPosition.level)?.label ?? "" : "";
  const nextLessonLevelLabel = nextLessonPosition ? LEVELS.find((level) => level.id === nextLessonPosition.level)?.label ?? "" : "";
  const isFirstVisibleIdiom = selectedIdiomIndex <= 0;
  const isLastVisibleIdiom = selectedIdiomIndex >= visibleIdioms.length - 1;
  const currentBlurMode = STUDY_BLUR_MODE_OPTIONS.find((mode) => mode.id === blurMode) ?? STUDY_BLUR_MODE_OPTIONS[0];
  const activeStudyLabel = hasSearchQuery ? `Search: ${trimmedQuery}` : `${activeLevelMeta.label} / Lesson ${activeLesson}`;
  const detailItems = selectedIdiom
    ? [
        { title: "English definition", text: selectedIdiom.english_definition, dir: "ltr" as const },
        { title: "Persian definition", text: selectedIdiom.persian_definition_meaning, dir: "rtl" as const },
        { title: "English note", text: selectedIdiom.english_explanation, dir: "ltr" as const },
        { title: "Persian note", text: selectedIdiom.persian_explanation_meaning, dir: "rtl" as const },
      ].filter((item) => Boolean(item.text))
    : [];

  useEffect(() => {
    setProgress(getProgress());
    setBookmarks(getBookmarks());
    setBlurMode(readStudyBlurMode());
  }, []);

  useEffect(() => {
    setExampleOverrides({});
  }, [selectedIdiomKey, blurMode]);

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
  const handleBlurModeChange = (mode: StudyBlurMode): void => {
    setBlurMode(mode);
    setExampleOverrides({});
    saveStudyBlurMode(mode);
  };
  const handleLevelChange = (level: LevelId): void => {
    setActiveLevel(level);
    setActiveLesson(getFirstLessonNumber(level));
    setSelectedIdiomId("");
    setQuery("");
  };
  const handleSelectLesson = (lessonNumber: number): void => {
    setActiveLesson(lessonNumber);
    setSelectedIdiomId("");
    setQuery("");
    setStudyToolsOpen(false);
  };
  const handleSelectIdiom = (idiom: IdiomEntry): void => {
    setSelectedIdiomId(idiom.id);
    setStudyToolsOpen(false);

    if (hasSearchQuery) {
      setActiveLevel(idiom.level);
      setActiveLesson(idiom.lessonNumber);
    }
  };
  const clearSearch = (): void => {
    setQuery("");
    setSelectedIdiomId("");
  };
  const goToLesson = (position: StudyPosition, placement: "start" | "end"): void => {
    const idioms = getIdiomsForLesson(position.level, position.lesson);
    const nextSelectedIdiom = placement === "end" ? idioms.at(-1) : idioms[0];

    setActiveLevel(position.level);
    setActiveLesson(position.lesson);
    setSelectedIdiomId(nextSelectedIdiom?.id ?? "");
    setQuery("");
  };
  const handlePreviousIdiom = (): void => {
    if (selectedIdiomIndex > 0) {
      setSelectedIdiomId(visibleIdioms[selectedIdiomIndex - 1].id);
      return;
    }

    if (previousLessonPosition) {
      goToLesson(previousLessonPosition, "end");
    }
  };
  const handleNextIdiom = (): void => {
    if (selectedIdiomIndex < visibleIdioms.length - 1) {
      setSelectedIdiomId(visibleIdioms[selectedIdiomIndex + 1].id);
      return;
    }

    if (nextLessonPosition) {
      goToLesson(nextLessonPosition, "start");
    }
  };
  const toggleExampleOverride = (exampleKey: string): void => {
    setExampleOverrides((current) => ({ ...current, [exampleKey]: !current[exampleKey] }));
  };

  return (
    <main className="flex min-h-[calc(100dvh-2rem)] min-w-0 flex-col overflow-hidden pb-24 pt-2 max-mobile:min-h-dvh max-mobile:overflow-visible">
      <div className="max-mobile:hidden">
        <Appbar title="Lesson Study" iconSrc="/icon/Seedling.svg" rightButton={<div />} onBackClick={() => history.back()} />
      </div>

      <section className="flex min-h-0 flex-1 flex-col">
        <header className="mx-auto w-full max-w-5xl px-4 py-2.5 max-mobile:px-0 max-mobile:pt-0">
          <div className="hidden max-mobile:block">
            <div className="grid grid-cols-[2.5rem_minmax(0,1fr)_2.5rem] items-center">
              <button
                type="button"
                onClick={() => history.back()}
                aria-label="Go back"
                className="inline-flex size-10 items-center justify-center rounded-full text-slate-700 transition-colors duration-150 hover:bg-white focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primaryColor/25"
              >
                <ArrowLeft className="size-5" aria-hidden="true" />
              </button>

              <div className="flex min-w-0 items-center justify-center gap-2 text-center text-xl font-black tracking-tight text-slate-950">
                <span className="truncate">Lesson Study</span>
                <img src="/icon/Seedling.svg" alt="" className="size-6 shrink-0" />
              </div>

              {selectedIdiom ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label={isBookmarked(selectedIdiom) ? "Remove saved idiom" : "Save idiom"}
                      onClick={() => setBookmarks(toggleBookmark(selectedIdiom))}
                      className="inline-flex size-10 items-center justify-center rounded-full text-slate-700 transition-colors duration-150 hover:bg-white focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primaryColor/25"
                    >
                      {isBookmarked(selectedIdiom) ? (
                        <BookmarkCheck className="size-5 text-primaryColor" aria-hidden="true" />
                      ) : (
                        <Bookmark className="size-5" aria-hidden="true" />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent sideOffset={8}>{isBookmarked(selectedIdiom) ? "Saved" : "Save idiom"}</TooltipContent>
                </Tooltip>
              ) : (
                <span aria-hidden="true" />
              )}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStudyToolsOpen(true)}
                className="flex min-h-13 min-w-0 items-center gap-2 rounded-lg border border-gray-200 bg-white/90 px-3 text-left text-slate-700 shadow-sm transition-[background-color,border-color,box-shadow] duration-150 hover:border-primaryColor/35 hover:bg-white focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primaryColor/25"
              >
                <PanelRightOpen className="size-4 shrink-0 text-slate-500" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block text-[10px] font-black uppercase tracking-wide text-slate-400">Lesson</span>
                  <span className="block truncate text-[13px] font-black leading-5 text-slate-950">{activeStudyLabel}</span>
                </span>
              </button>

              <button
                type="button"
                aria-expanded={settingsOpen}
                aria-controls="study-settings-panel"
                onClick={() => setSettingsOpen((open) => !open)}
                className={cn(
                  "flex min-h-13 min-w-0 items-center gap-2 rounded-lg border px-3 text-left shadow-sm transition-[background-color,border-color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primaryColor/25",
                  settingsOpen ? "border-primaryColor/30 bg-primaryColor/10 text-slate-950" : "border-gray-200 bg-white/90 text-slate-700 hover:border-primaryColor/35 hover:bg-white"
                )}
              >
                <Settings2 className="size-4 shrink-0 text-slate-500" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[10px] font-black uppercase tracking-wide text-slate-400">Focus</span>
                  <span className="block truncate text-xs font-black leading-5">{currentBlurMode.label}</span>
                </span>
                <ChevronDown className={cn("size-3.5 shrink-0 transition-transform duration-150", settingsOpen && "rotate-180")} aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2.5 max-mobile:hidden">
            <Button type="button" variant="outline" onClick={() => setStudyToolsOpen(true)} className={cn("min-w-0 justify-start", HEADER_TOOL_BUTTON_CLASS)}>
              <PanelRightOpen className="size-3.5" aria-hidden="true" />
              <span className="truncate">{activeStudyLabel}</span>
            </Button>

            <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
              <Button
                type="button"
                variant={settingsOpen ? "secondary" : "outline"}
                aria-expanded={settingsOpen}
                aria-controls="study-settings-panel"
                onClick={() => setSettingsOpen((open) => !open)}
                className={cn("min-w-0 justify-start", HEADER_TOOL_BUTTON_CLASS)}
              >
                <Settings2 className="size-3.5" aria-hidden="true" />
                <span className="truncate">{currentBlurMode.label}</span>
                <ChevronDown className={cn("size-3.5 transition-transform duration-150", settingsOpen && "rotate-180")} aria-hidden="true" />
              </Button>

              {selectedIdiom ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      aria-label={isBookmarked(selectedIdiom) ? "Remove saved idiom" : "Save idiom"}
                      onClick={() => setBookmarks(toggleBookmark(selectedIdiom))}
                      className={HEADER_ICON_BUTTON_CLASS}
                    >
                      {isBookmarked(selectedIdiom) ? (
                        <BookmarkCheck className="size-4 text-primaryColor" aria-hidden="true" />
                      ) : (
                        <Bookmark className="size-4" aria-hidden="true" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent sideOffset={8}>{isBookmarked(selectedIdiom) ? "Saved" : "Save idiom"}</TooltipContent>
                </Tooltip>
              ) : null}
            </div>
          </div>

          {settingsOpen ? (
            <div id="study-settings-panel" className="mt-3 rounded-lg border border-gray-200 bg-white p-2 shadow-sm">
              <div className="grid gap-2 tablet:grid-cols-3">
                {STUDY_BLUR_MODE_OPTIONS.map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    aria-pressed={blurMode === mode.id}
                    onClick={() => handleBlurModeChange(mode.id)}
                    className={cn(
                      "min-h-16 rounded-lg border px-3 py-2 text-left transition-[background-color,border-color,box-shadow,color] duration-150 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primaryColor/25",
                      blurMode === mode.id
                        ? "border-primaryColor bg-primaryColor/10 text-gray-950"
                        : "border-gray-200 bg-white text-gray-600 hover:border-primaryColor/35 hover:bg-gray-50"
                    )}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-xs font-black">{mode.label}</span>
                      {blurMode === mode.id ? <Check className="size-3.5 text-primaryColor" aria-hidden="true" /> : null}
                    </span>
                    <span className="mt-1 block text-[11px] font-semibold leading-4 text-gray-500">{mode.description}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </header>

        <article className="min-h-0 flex-1 overflow-y-auto customScrollBarStyle">
          {selectedIdiom ? (
            <div className="mx-auto flex w-full max-w-3xl flex-col px-4 pb-9 pt-5 max-mobile:pt-4">
              <section className="pb-5 text-center">
                <h1 dir="ltr" className="break-words text-[2rem] font-black leading-[2.35rem] text-gray-950 max-mobile:text-[1.625rem] max-mobile:leading-[2.05rem]">
                  {selectedIdiom.english_phrase}
                </h1>
                <p dir="rtl" className="mx-auto mt-3 max-w-2xl font-iranYekan text-lg leading-8 text-gray-700 max-mobile:text-base max-mobile:leading-7">
                  {selectedIdiom.persian_phrase_meaning}
                </p>
              </section>

              <section className="border-t border-gray-200 py-5" aria-labelledby="examples-heading">
                <div className="mb-1 flex items-center justify-between gap-3">
                  <h2 id="examples-heading" className="text-[11px] font-black uppercase tracking-wide text-gray-500">
                    Examples
                  </h2>
                  <p className="text-xs font-semibold text-gray-500">{currentBlurMode.label}</p>
                </div>

                {selectedExamples.length ? (
                  <div className="divide-y divide-gray-200">
                    {selectedExamples.map((example, index) => {
                      const exampleKey = getExampleKey(selectedIdiom.id, index, example.english_text);
                      const overrideActive = Boolean(exampleOverrides[exampleKey]);
                      const englishBlurred = blurMode === "english" && !overrideActive;
                      const persianBlurred = blurMode === "persian" ? !overrideActive : blurMode === "none" ? overrideActive : false;
                      const actionLabel = getExampleToggleLabel(blurMode, overrideActive, index + 1);
                      const actionRevealsContent = blurMode === "none" ? overrideActive : !overrideActive;

                      return (
                        <div key={exampleKey} className="group relative py-4 pl-12 max-mobile:pl-12">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                aria-label={actionLabel}
                                onClick={() => toggleExampleOverride(exampleKey)}
                                className="absolute left-0 top-4 inline-flex size-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 shadow-sm opacity-100 transition-[opacity,border-color,background-color,color,box-shadow] duration-150 hover:border-primaryColor/40 hover:text-primaryColor focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primaryColor/25 max-mobile:size-10 laptop:opacity-0 laptop:group-hover:opacity-100 laptop:focus-visible:opacity-100"
                              >
                                {actionRevealsContent ? <Eye className="size-4" aria-hidden="true" /> : <EyeOff className="size-4" aria-hidden="true" />}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent sideOffset={8}>{actionLabel}</TooltipContent>
                          </Tooltip>

                          <p
                            dir="ltr"
                            aria-hidden={englishBlurred}
                            className={cn(
                              "text-[17px] font-semibold leading-8 text-gray-950 transition-[filter,opacity] duration-150 max-mobile:text-[15px] max-mobile:leading-7",
                              englishBlurred && BLURRED_STUDY_CONTENT_CLASS
                            )}
                            style={englishBlurred ? BLURRED_STUDY_CONTENT_STYLE : undefined}
                          >
                            {example.english_text}
                          </p>
                          <p
                            dir="rtl"
                            aria-hidden={persianBlurred}
                            className={cn(
                              "mt-2 font-iranYekan text-[15px] leading-8 text-gray-700 transition-[filter,opacity] duration-150 max-mobile:text-sm max-mobile:leading-7",
                              persianBlurred && BLURRED_STUDY_CONTENT_CLASS
                            )}
                            style={persianBlurred ? BLURRED_STUDY_CONTENT_STYLE : undefined}
                          >
                            {example.persian_meaning}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="py-8 text-center text-sm font-semibold text-gray-500">No examples for this idiom yet.</p>
                )}
              </section>

              {detailItems.length ? (
                <section className="border-t border-gray-200 py-5" aria-labelledby="details-heading">
                  <h2 id="details-heading" className="text-[11px] font-black uppercase tracking-wide text-gray-500">
                    Details
                  </h2>
                  <div className="mt-4 grid gap-5">
                    {detailItems.map((item) => (
                      <DetailRow key={item.title} title={item.title} text={item.text ?? ""} dir={item.dir} />
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center px-4 text-sm font-semibold text-gray-500">No idioms match this search.</div>
          )}
        </article>
      </section>

      <BottomStudyNav
        current={selectedIdiomPosition}
        total={visibleIdioms.length}
        onPrevious={handlePreviousIdiom}
        onNext={handleNextIdiom}
        previousDisabled={selectedIdiomIndex < 0 || (isFirstVisibleIdiom && !previousLessonPosition)}
        nextDisabled={selectedIdiomIndex < 0 || (isLastVisibleIdiom && !nextLessonPosition)}
        previousLesson={isFirstVisibleIdiom ? previousLessonPosition : null}
        nextLesson={isLastVisibleIdiom ? nextLessonPosition : null}
        previousAriaLabel={
          isFirstVisibleIdiom && previousLessonPosition
            ? `Go to ${previousLessonLevelLabel} lesson ${previousLessonPosition.lesson}`.trim()
            : "Previous idiom"
        }
        nextAriaLabel={
          isLastVisibleIdiom && nextLessonPosition
            ? `Go to ${nextLessonLevelLabel} lesson ${nextLessonPosition.lesson}`.trim()
            : "Next idiom"
        }
      />

      <StudyToolsSheet
        open={studyToolsOpen}
        onOpenChange={setStudyToolsOpen}
        activeLevel={activeLevel}
        activeLesson={activeLesson}
        query={query}
        progress={progress}
        selectedIdiomId={selectedIdiom?.id ?? ""}
        visibleIdioms={visibleIdioms}
        lessons={lessons}
        studiedCount={studiedCount}
        totalCount={totalCount}
        levelProgressPercent={levelProgressPercent}
        searchResultsCount={searchResults.length}
        hasSearchQuery={hasSearchQuery}
        onLevelChange={handleLevelChange}
        onLessonChange={handleSelectLesson}
        onQueryChange={setQuery}
        onClearSearch={clearSearch}
        onIdiomSelect={handleSelectIdiom}
      />
    </main>
  );
}

function getExampleToggleLabel(mode: StudyBlurMode, overrideActive: boolean, exampleNumber: number): string {
  if (mode === "english") {
    return overrideActive ? `Blur English example ${exampleNumber}` : `Show English example ${exampleNumber}`;
  }

  if (mode === "none") {
    return overrideActive ? `Show Persian translation for example ${exampleNumber}` : `Blur Persian translation for example ${exampleNumber}`;
  }

  return overrideActive ? `Blur Persian translation for example ${exampleNumber}` : `Show Persian translation for example ${exampleNumber}`;
}

function BottomStudyNav({
  current,
  total,
  onPrevious,
  onNext,
  previousDisabled,
  nextDisabled,
  previousLesson,
  nextLesson,
  previousAriaLabel,
  nextAriaLabel,
}: {
  current: number;
  total: number;
  onPrevious: () => void;
  onNext: () => void;
  previousDisabled: boolean;
  nextDisabled: boolean;
  previousLesson: StudyPosition | null;
  nextLesson: StudyPosition | null;
  previousAriaLabel: string;
  nextAriaLabel: string;
}): React.ReactElement {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 px-4 py-2.5 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur">
      <div className="mx-auto grid max-w-3xl grid-cols-[1fr_auto_1fr] items-center gap-2.5">
        <Button
          type="button"
          variant="outline"
          onClick={onPrevious}
          disabled={previousDisabled}
          aria-label={previousAriaLabel}
          className="min-h-10 justify-self-start px-3 text-sm max-mobile:min-h-11 max-mobile:w-full"
        >
          {previousLesson ? (
            <>
              <ArrowLeft className="size-3.5" aria-hidden="true" />
              <span className="hidden tablet:inline">Previous lesson</span>
              <span className="tablet:hidden">Lesson {previousLesson.lesson}</span>
            </>
          ) : (
            <>
              <ArrowLeft className="size-3.5" aria-hidden="true" />
              Previous
            </>
          )}
        </Button>
        <div className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-black tabular-nums text-gray-700">
          {current} / {total}
        </div>
        <Button
          type="button"
          variant="default"
          onClick={onNext}
          disabled={nextDisabled}
          aria-label={nextAriaLabel}
          className="min-h-10 justify-self-end px-3 text-sm max-mobile:min-h-11 max-mobile:w-full"
        >
          {nextLesson ? (
            <>
              <span className="hidden tablet:inline">Next lesson</span>
              <span className="tablet:hidden">Lesson {nextLesson.lesson}</span>
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </>
          ) : (
            <>
              Next
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </>
          )}
        </Button>
      </div>
    </nav>
  );
}

function StudyToolsSheet({
  open,
  onOpenChange,
  activeLevel,
  activeLesson,
  query,
  progress,
  selectedIdiomId,
  visibleIdioms,
  lessons,
  studiedCount,
  totalCount,
  levelProgressPercent,
  searchResultsCount,
  hasSearchQuery,
  onLevelChange,
  onLessonChange,
  onQueryChange,
  onClearSearch,
  onIdiomSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeLevel: LevelId;
  activeLesson: number;
  query: string;
  progress: StudyProgress;
  selectedIdiomId: string;
  visibleIdioms: IdiomEntry[];
  lessons: ReturnType<typeof getLessons>;
  studiedCount: number;
  totalCount: number;
  levelProgressPercent: number;
  searchResultsCount: number;
  hasSearchQuery: boolean;
  onLevelChange: (level: LevelId) => void;
  onLessonChange: (lessonNumber: number) => void;
  onQueryChange: (query: string) => void;
  onClearSearch: () => void;
  onIdiomSelect: (idiom: IdiomEntry) => void;
}): React.ReactElement {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[min(100vw,440px)] gap-0 bg-white p-0 sm:max-w-md">
        <SheetHeader className="border-b border-gray-100 p-4 text-left">
          <SheetTitle className="text-base font-black">Study tools</SheetTitle>
          <SheetDescription className="text-xs leading-5">Choose a level, jump to a lesson, or search all idioms.</SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 customScrollBarStyle">
          <section aria-labelledby="levels-heading">
            <h3 id="levels-heading" className="text-[11px] font-black uppercase tracking-wide text-gray-500">
              Levels
            </h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {LEVELS.map((level) => (
                <button
                  key={level.id}
                  type="button"
                  aria-pressed={activeLevel === level.id}
                  onClick={() => onLevelChange(level.id)}
                  className={cn(
                    "min-h-9 rounded-lg border px-3 text-xs font-bold transition-[background-color,border-color,box-shadow,color] duration-150 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primaryColor/25",
                    activeLevel === level.id ? level.softAccent : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  )}
                >
                  {level.label}
                </button>
              ))}
            </div>
          </section>

          <section className="mt-5 rounded-lg border border-gray-200 bg-gray-50 p-3" aria-label="Level progress">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] font-black uppercase tracking-wide text-gray-500">Progress</span>
              <span className="text-xs font-black text-gray-700">
                {studiedCount}/{totalCount}
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
              <div className="h-full rounded-full bg-primaryColor" style={{ width: `${levelProgressPercent}%` }} />
            </div>
          </section>

          <section className="mt-5" aria-labelledby="search-heading">
            <div className="flex items-center justify-between gap-2">
              <h3 id="search-heading" className="text-[11px] font-black uppercase tracking-wide text-gray-500">
                Search
              </h3>
              {hasSearchQuery ? (
                <button type="button" onClick={onClearSearch} className="inline-flex items-center gap-1 text-xs font-bold text-primaryColor">
                  <X className="size-3.5" aria-hidden="true" />
                  Clear
                </button>
              ) : null}
            </div>
            <label className="relative mt-2 block">
              <span className="sr-only">Search idioms, meanings, or lessons</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
              <Input
                type="search"
                aria-label="Search idioms, meanings, or lessons"
                name="idiom-search"
                autoComplete="off"
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
                placeholder="Search idioms, meanings, or lessons..."
                className="pl-9"
              />
            </label>
            {hasSearchQuery ? (
              <p className="mt-2 text-[11px] font-semibold text-gray-500">
                {searchResultsCount} result{searchResultsCount === 1 ? "" : "s"} across all levels
              </p>
            ) : null}
          </section>

          {!hasSearchQuery ? (
            <section className="mt-5" aria-labelledby="lessons-heading">
              <h3 id="lessons-heading" className="text-[11px] font-black uppercase tracking-wide text-gray-500">
                Lessons
              </h3>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {lessons.map((lesson) => {
                  const idioms = getIdiomsForLesson(activeLevel, lesson.lesson_number);
                  const studiedInLesson = idioms.filter((idiom) => progress.studied[idiom.id]).length;

                  return (
                    <button
                      key={lesson.lesson_number}
                      type="button"
                      aria-pressed={activeLesson === lesson.lesson_number}
                      aria-label={`Lesson ${lesson.lesson_number}, ${studiedInLesson} of ${idioms.length} studied`}
                      onClick={() => onLessonChange(lesson.lesson_number)}
                      className={cn(
                        "min-h-11 rounded-lg border px-2 text-left transition-[background-color,border-color,box-shadow,color] duration-150 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primaryColor/25",
                        activeLesson === lesson.lesson_number
                          ? "border-primaryColor bg-primaryColor/10 shadow-sm"
                          : "border-gray-200 bg-white hover:border-primaryColor/40 hover:bg-gray-50"
                      )}
                    >
                      <span className="block text-[13px] font-black leading-5">{lesson.lesson_number}</span>
                      <span className="block text-[11px] font-semibold text-gray-500">
                        {studiedInLesson}/{idioms.length}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          ) : null}

          <section className="mt-5" aria-labelledby="idioms-heading">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h3 id="idioms-heading" className="text-[11px] font-black uppercase tracking-wide text-gray-500">
                  {hasSearchQuery ? "Matching idioms" : `Lesson ${activeLesson} idioms`}
                </h3>
                <p className="mt-1 text-xs font-semibold text-gray-500">
                  {visibleIdioms.length ? `${visibleIdioms.length} item${visibleIdioms.length === 1 ? "" : "s"}` : "No items"}
                </p>
              </div>
            </div>

            {visibleIdioms.length ? (
              <div className="mt-2 grid gap-2">
                {visibleIdioms.map((idiom) => (
                  <button
                    key={idiom.id}
                    type="button"
                    aria-current={selectedIdiomId === idiom.id ? "true" : undefined}
                    onClick={() => onIdiomSelect(idiom)}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-left transition-[background-color,border-color,box-shadow,color] duration-150 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primaryColor/25",
                      selectedIdiomId === idiom.id
                        ? "border-primaryColor bg-primaryColor/10"
                        : "border-gray-200 bg-white hover:border-primaryColor/40 hover:bg-gray-50"
                    )}
                  >
                    <span className="flex items-start justify-between gap-3">
                      <span className="min-w-0 text-[13px] font-black leading-5 text-gray-950">{idiom.english_phrase}</span>
                      <StatusBadge status={getStudyStatus(idiom.id, progress)} />
                    </span>
                    <span dir="rtl" className="mt-1 block font-iranYekan text-xs leading-5 text-gray-500">
                      {idiom.persian_phrase_meaning}
                    </span>
                    {hasSearchQuery ? (
                      <span className="mt-1 block text-[11px] font-bold text-gray-400">
                        {idiom.levelLabel} / Lesson {idiom.lessonNumber}
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            ) : (
              <div className="mt-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-center text-sm font-semibold text-gray-500">
                No idioms match this search.
              </div>
            )}
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function StatusBadge({ status }: { status: StudyListStatus }): React.ReactElement {
  const styles: Record<StudyListStatus, string> = {
    new: "border-gray-200 bg-white text-gray-500",
    learning: "border-blue-200 bg-blue-50 text-blue-700",
    review: "border-amber-200 bg-amber-50 text-amber-800",
    known: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };

  return (
    <span className={`inline-flex shrink-0 items-center rounded-full border px-1.5 py-0.5 text-[10px] font-black ${styles[status]}`}>
      {STUDY_STATUS_LABELS[status]}
    </span>
  );
}

function DetailRow({ title, text, dir }: { title: string; text: string; dir: "ltr" | "rtl" }): React.ReactElement {
  return (
    <div className="grid gap-2 border-t border-gray-100 pt-4 first:border-t-0 first:pt-0 tablet:grid-cols-[160px_minmax(0,1fr)]">
      <h3 className="text-[11px] font-black uppercase tracking-wide text-gray-500">{title}</h3>
      <p
        dir={dir}
        className={cn(
          "text-[13px] text-gray-800",
          dir === "rtl" ? "font-iranYekan text-right leading-7" : "text-right leading-6"
        )}
      >
        {text}
      </p>
    </div>
  );
}
