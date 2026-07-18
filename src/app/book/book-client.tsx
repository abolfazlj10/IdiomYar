"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { toast } from "react-hot-toast";
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Check,
  ChevronDown,
  Eye,
  EyeOff,
  LoaderCircle,
  PanelRightOpen,
  Settings2,
  Sparkles,
} from "lucide-react";
import Appbar from "@/components/appbar";
import ResultStory from "@/components/story/result";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useLevelBooks } from "@/hooks/use-level-books";
import { useStoryGenerator } from "@/hooks/useStory";
import {
  findIdiomById,
  getAllIdioms,
  getIdiomsForLesson,
  getLessons,
  idiomMatchesSearch,
  LEVELS,
  type IdiomEntry,
  type LevelBooks,
  type LevelSummary,
} from "@/lib/idioms";
import {
  getFirstLessonNumber,
  getNextLessonPosition,
  getParam,
  getPreviousLessonPosition,
  parseLessonParam,
  parseLevelParam,
  type StudyPosition,
} from "@/lib/study-navigation";
import {
  addStory,
  getBookmarks,
  getProgress,
  toggleBookmark,
  type Bookmark as StoredBookmark,
  type StudyProgress,
} from "@/lib/storage";
import { cn } from "@/lib/utils";
import type { Book as BookData, LevelId } from "@/types/types";
import { BottomStudyNav, DetailRow, getExampleToggleLabel, StudyToolsSheet } from "./book-study-components";

const DEFAULT_LEVEL: LevelId = "elementary";
const STUDY_BLUR_MODE_KEY = "idioms:v1:lesson-study-blur-mode";

export type StudySearchParams = {
  level?: string | string[];
  lesson?: string | string[];
  idiom?: string | string[];
};

type BookPageProps = {
  initialBook: BookData;
  initialLevel: LevelId;
  levelSummaries: LevelSummary[];
  searchParams?: StudySearchParams;
};

type RequestedStudyPosition = {
  level: LevelId;
  lesson: number;
  idiomId?: string;
};

type StudyBlurMode = "persian" | "english" | "none";

type StudyBlurModeOption = {
  id: StudyBlurMode;
  label: string;
  description: string;
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

function findRequestedIdiom(books: LevelBooks, value: string | null): IdiomEntry | undefined {
  if (!value) {
    return undefined;
  }

  const directMatch = findIdiomById(books, value);

  if (directMatch) {
    return directMatch;
  }

  try {
    return findIdiomById(books, decodeURIComponent(value));
  } catch {
    return undefined;
  }
}

function getRequestedStudyPosition(
  books: LevelBooks,
  levelSummaries: LevelSummary[],
  searchParams?: StudySearchParams
): RequestedStudyPosition | null {
  const requestedIdiom = findRequestedIdiom(books, getParam(searchParams?.idiom));

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
    lesson:
      parseLessonParam(levelSummaries, level, getParam(searchParams?.lesson)) ??
      getFirstLessonNumber(levelSummaries, level),
  };
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

export default function Book({ initialBook, initialLevel, levelSummaries, searchParams }: BookPageProps): React.ReactElement {
  const { books, ensureLevel, ensureLevels } = useLevelBooks(initialLevel, initialBook);
  const requestedLevelParam = getParam(searchParams?.level);
  const requestedLessonParam = getParam(searchParams?.lesson);
  const requestedIdiomParam = getParam(searchParams?.idiom);
  const requestedPosition = useMemo(
    () =>
      getRequestedStudyPosition(books, levelSummaries, {
        level: requestedLevelParam ?? undefined,
        lesson: requestedLessonParam ?? undefined,
        idiom: requestedIdiomParam ?? undefined,
      }),
    [books, levelSummaries, requestedLevelParam, requestedLessonParam, requestedIdiomParam]
  );
  const [activeLevel, setActiveLevel] = useState<LevelId>(requestedPosition?.level ?? initialLevel ?? DEFAULT_LEVEL);
  const [activeLesson, setActiveLesson] = useState<number>(
    requestedPosition?.lesson ?? getFirstLessonNumber(levelSummaries, requestedPosition?.level ?? initialLevel)
  );
  const [selectedIdiomId, setSelectedIdiomId] = useState<string>(requestedPosition?.idiomId ?? "");
  const [query, setQuery] = useState("");
  const [progress, setProgress] = useState<StudyProgress>({ studied: {}, known: {}, review: {} });
  const [bookmarks, setBookmarks] = useState<StoredBookmark[]>([]);
  const [studyToolsOpen, setStudyToolsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [blurMode, setBlurMode] = useState<StudyBlurMode>("persian");
  const [exampleOverrides, setExampleOverrides] = useState<Record<string, boolean>>({});
  const [showStory, setShowStory] = useState(false);
  const [story, setStory] = useState("");
  const [storyFa, setStoryFa] = useState("");
  const [storyEn, setStoryEn] = useState("");
  const { mutate: createStory, isPending: isStoryGenerating } = useStoryGenerator();

  const hasSearchQuery = Boolean(query.trim());
  const trimmedQuery = query.trim();
  const lessons = useMemo(() => getLessons(books[activeLevel]), [activeLevel, books]);
  const lessonIdioms = useMemo(
    () => getIdiomsForLesson(books[activeLevel], activeLevel, activeLesson),
    [activeLevel, activeLesson, books]
  );
  const lessonStoryIdioms = useMemo(() => lessonIdioms.map((idiom) => idiom.english_phrase).filter(Boolean), [lessonIdioms]);
  const searchResults = useMemo(
    () => (hasSearchQuery ? getAllIdioms(books).filter((idiom) => idiomMatchesSearch(idiom, query)) : []),
    [books, hasSearchQuery, query]
  );
  const visibleIdioms = hasSearchQuery ? searchResults : lessonIdioms;
  const selectedIdiom = visibleIdioms.find((idiom) => idiom.id === selectedIdiomId) ?? visibleIdioms[0];
  const allLevelIdioms = useMemo(() => getAllIdioms(books, activeLevel), [activeLevel, books]);
  const studiedCount = allLevelIdioms.filter((idiom) => progress.studied[idiom.id]).length;
  const totalCount = allLevelIdioms.length;
  const levelProgressPercent = totalCount ? (studiedCount / totalCount) * 100 : 0;
  const selectedIdiomIndex = selectedIdiom ? visibleIdioms.findIndex((idiom) => idiom.id === selectedIdiom.id) : -1;
  const selectedIdiomPosition = selectedIdiomIndex >= 0 ? selectedIdiomIndex + 1 : 0;
  const selectedIdiomKey = selectedIdiom?.id ?? "";
  const selectedExamples = selectedIdiom?.examples ?? [];
  const activeLevelMeta = LEVELS.find((level) => level.id === activeLevel) ?? LEVELS[0];
  const previousLessonPosition = useMemo(
    () => (hasSearchQuery ? null : getPreviousLessonPosition(levelSummaries, activeLevel, activeLesson)),
    [activeLesson, activeLevel, hasSearchQuery, levelSummaries]
  );
  const nextLessonPosition = useMemo(
    () => (hasSearchQuery ? null : getNextLessonPosition(levelSummaries, activeLevel, activeLesson)),
    [activeLesson, activeLevel, hasSearchQuery, levelSummaries]
  );
  const previousLessonLevelLabel = previousLessonPosition ? LEVELS.find((level) => level.id === previousLessonPosition.level)?.label ?? "" : "";
  const nextLessonLevelLabel = nextLessonPosition ? LEVELS.find((level) => level.id === nextLessonPosition.level)?.label ?? "" : "";
  const isFirstVisibleIdiom = selectedIdiomIndex <= 0;
  const isLastVisibleIdiom = selectedIdiomIndex >= visibleIdioms.length - 1;
  const currentBlurMode = STUDY_BLUR_MODE_OPTIONS.find((mode) => mode.id === blurMode) ?? STUDY_BLUR_MODE_OPTIONS[0];
  const activeStudyLabel = hasSearchQuery ? `Search: ${trimmedQuery}` : `${activeLevelMeta.label} / Lesson ${activeLesson}`;
  const lessonStoryLabel = `${activeLevelMeta.label} lesson ${activeLesson}`;
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
    if (hasSearchQuery) {
      void ensureLevels(LEVELS.map((level) => level.id));
    }
  }, [ensureLevels, hasSearchQuery]);

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
  const handleLevelChange = async (level: LevelId): Promise<void> => {
    await ensureLevel(level);
    setActiveLevel(level);
    setActiveLesson(getFirstLessonNumber(levelSummaries, level));
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
  const goToLesson = async (position: StudyPosition, placement: "start" | "end"): Promise<void> => {
    const book = await ensureLevel(position.level);
    const idioms = getIdiomsForLesson(book, position.level, position.lesson);
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
      void goToLesson(previousLessonPosition, "end");
    }
  };
  const handleNextIdiom = (): void => {
    if (selectedIdiomIndex < visibleIdioms.length - 1) {
      setSelectedIdiomId(visibleIdioms[selectedIdiomIndex + 1].id);
      return;
    }

    if (nextLessonPosition) {
      void goToLesson(nextLessonPosition, "start");
    }
  };
  const toggleExampleOverride = (exampleKey: string): void => {
    setExampleOverrides((current) => ({ ...current, [exampleKey]: !current[exampleKey] }));
  };
  const handleGenerateLessonStory = (): void => {
    if (!lessonStoryIdioms.length) {
      toast.error("No idioms found for this lesson.");
      return;
    }

    setStory("");
    setStoryFa("");
    setStoryEn("");
    setShowStory(false);

    createStory(
      {
        idioms: lessonStoryIdioms,
        information: `Create a lesson story for ${lessonStoryLabel}.`,
      },
      {
        onSuccess: (data) => {
          if (data.status) {
            const nextStory = data.story || "";
            const nextStoryFa = data.storyFa || "";
            const nextStoryEn = data.storyEn || "";

            setStory(nextStory);
            setStoryFa(nextStoryFa);
            setStoryEn(nextStoryEn);
            setShowStory(true);
            addStory({
              idioms: lessonStoryIdioms,
              information: lessonStoryLabel,
              story: nextStory,
              storyFa: nextStoryFa,
              storyEn: nextStoryEn,
            });
            toast.success("Lesson story saved to Archive.");
            return;
          }

          toast.error(data.error || data.story || "Story creation failed. Please try again.");
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : "Story creation failed. Please try again.");
        },
      }
    );
  };
  const renderLessonStoryButton = (): React.ReactElement => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="outline"
          aria-label={`Generate story for ${lessonStoryLabel}`}
          onClick={handleGenerateLessonStory}
          disabled={isStoryGenerating || !lessonStoryIdioms.length}
          className={HEADER_ICON_BUTTON_CLASS}
        >
          {isStoryGenerating ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Sparkles className="size-4" aria-hidden="true" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent sideOffset={8}>{isStoryGenerating ? "Generating story" : `Generate story for ${lessonStoryLabel}`}</TooltipContent>
    </Tooltip>
  );

  if (showStory) {
    return (
      <main className="flex min-h-[calc(100dvh-2rem)] min-w-0 flex-col overflow-hidden pb-4 pt-2 max-mobile:min-h-dvh max-mobile:overflow-visible">
        <ResultStory
          isShow={setShowStory}
          theStory={story}
          storyPersian={storyFa}
          storyEnglish={storyEn}
          title={`${lessonStoryLabel} story`}
          iconSrc="/icon/Seedling.svg"
        />
      </main>
    );
  }

  return (
    <main className="flex min-h-[calc(100dvh-2rem)] min-w-0 flex-col overflow-hidden pb-24 pt-2 max-mobile:min-h-dvh max-mobile:overflow-visible">
      <div className="max-mobile:hidden">
        <Appbar title="Lesson Study" iconSrc="/icon/Seedling.svg" rightButton={<div />} onBackClick={() => history.back()} />
      </div>

      <section className="flex min-h-0 flex-1 flex-col">
        <header className="mx-auto w-full max-w-5xl px-4 py-2.5 max-mobile:px-0 max-mobile:pt-0">
          <div className="hidden max-mobile:block">
            <div className="grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-1">
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

              <div className="flex items-center justify-end gap-1">
                {renderLessonStoryButton()}
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
                ) : null}
              </div>
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

              {renderLessonStoryButton()}

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
        activeBook={books[activeLevel]}
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
