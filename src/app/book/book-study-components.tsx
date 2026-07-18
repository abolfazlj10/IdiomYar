"use client";

import type * as React from "react";
import { ArrowLeft, ArrowRight, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { getIdiomsForLesson, getLessons, LEVELS, type IdiomEntry } from "@/lib/idioms";
import type { StudyPosition } from "@/lib/study-navigation";
import type { RecallStatus, StudyProgress } from "@/lib/storage";
import { cn } from "@/lib/utils";
import type { Book as BookData, LevelId } from "@/types/types";

type StudyListStatus = RecallStatus | "new";
type StudyBlurMode = "persian" | "english" | "none";

const STUDY_STATUS_LABELS: Record<StudyListStatus, string> = {
  new: "New",
  learning: "Learning",
  review: "Review",
  known: "Known",
};

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

export function getExampleToggleLabel(mode: StudyBlurMode, overrideActive: boolean, exampleNumber: number): string {
  if (mode === "english") {
    return overrideActive ? `Blur English example ${exampleNumber}` : `Show English example ${exampleNumber}`;
  }

  if (mode === "none") {
    return overrideActive ? `Show Persian translation for example ${exampleNumber}` : `Blur Persian translation for example ${exampleNumber}`;
  }

  return overrideActive ? `Blur Persian translation for example ${exampleNumber}` : `Show Persian translation for example ${exampleNumber}`;
}

export function BottomStudyNav({
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

export function StudyToolsSheet({
  open,
  onOpenChange,
  activeLevel,
  activeBook,
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
  activeBook?: BookData;
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
                  const idioms = getIdiomsForLesson(activeBook, activeLevel, lesson.lesson_number);
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

export function DetailRow({ title, text, dir }: { title: string; text: string; dir: "ltr" | "rtl" }): React.ReactElement {
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

