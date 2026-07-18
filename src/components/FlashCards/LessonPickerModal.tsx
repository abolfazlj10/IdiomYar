"use client";

import * as Collapsible from "@radix-ui/react-collapsible";
import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useState } from "react";
import { ArrowRight, Check, ChevronDown, RotateCcw, Shuffle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LEVELS, type LevelSummary } from "@/lib/idioms";
import type { LevelId } from "@/types/types";

export type LessonPickerSelection = {
  level: LevelId;
  lesson: number;
};

type LessonPickerModalProps = {
  deckLength?: number;
  mode?: "deck" | "lesson";
  onApply: () => void;
  onLessonSelect: (selection: LessonPickerSelection) => void;
  onOpenChange: (open: boolean) => void;
  onResetDeck?: () => void;
  onShuffleDeck?: () => void;
  open: boolean;
  selectedLesson: number;
  selectedLevel: LevelId;
  levelSummaries: LevelSummary[];
};

const levelSectionStyles = {
  elementary: {
    accent: "bg-emerald-500",
    panel: "border-emerald-200 bg-emerald-50/70",
    selected: "border-emerald-300 bg-emerald-50 text-emerald-950 shadow-[0_12px_30px_rgba(16,185,129,0.18)]",
  },
  intermediate: {
    accent: "bg-sky-500",
    panel: "border-sky-200 bg-sky-50/70",
    selected: "border-sky-300 bg-sky-50 text-sky-950 shadow-[0_12px_30px_rgba(14,165,233,0.18)]",
  },
  advanced: {
    accent: "bg-rose-500",
    panel: "border-rose-200 bg-rose-50/70",
    selected: "border-rose-300 bg-rose-50 text-rose-950 shadow-[0_12px_30px_rgba(244,63,94,0.16)]",
  },
} satisfies Record<LevelId, { accent: string; panel: string; selected: string }>;

function getDefaultOpenLevels(selectedLevel: LevelId): Record<LevelId, boolean> {
  return LEVELS.reduce(
    (openLevels, level) => ({
      ...openLevels,
      [level.id]: level.id === selectedLevel,
    }),
    {} as Record<LevelId, boolean>
  );
}

export function LessonPickerModal({
  deckLength = 0,
  mode = "deck",
  onApply,
  onLessonSelect,
  onOpenChange,
  onResetDeck,
  onShuffleDeck,
  open,
  selectedLesson,
  selectedLevel,
  levelSummaries,
}: LessonPickerModalProps): React.ReactElement {
  const isLessonMode = mode === "lesson";
  const itemLabel = isLessonMode ? "idioms" : "cards";
  const [openLevels, setOpenLevels] = useState<Record<LevelId, boolean>>(() => getDefaultOpenLevels(selectedLevel));
  const selectedCardsCount =
    levelSummaries
      .find((summary) => summary.id === selectedLevel)
      ?.lessons.find((lesson) => lesson.lesson_number === selectedLesson)?.idiomCount ?? 0;

  useEffect(() => {
    if (open) {
      setOpenLevels(getDefaultOpenLevels(selectedLevel));
    }
  }, [open, selectedLevel]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-sm data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed left-1/2 top-1/2 z-50 flex max-h-[min(780px,calc(100dvh-1.5rem))] w-[calc(100%-1.5rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.28)] focus-visible:outline-none"
        >
          <div className="flex min-w-0 items-center justify-between gap-4 border-b border-slate-200 bg-slate-50/80 px-4 py-3 mobile:px-5">
            <div className="flex min-w-0 items-center gap-3">
              <span className={cn("h-10 w-1.5 shrink-0 rounded-full", levelSectionStyles[selectedLevel].accent)} aria-hidden="true" />
              <div className="min-w-0">
                <Dialog.Title className="truncate text-lg font-black tracking-tight text-slate-950 mobile:text-xl">
                  {isLessonMode ? "Choose lesson" : "Choose lesson deck"}
                </Dialog.Title>
                <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs font-bold text-slate-500">
                  <span className="truncate">{LEVELS.find((level) => level.id === selectedLevel)?.label}</span>
                  <span aria-hidden="true">/</span>
                  <span className="tabular-nums">Lesson {selectedLesson}</span>
                  <span aria-hidden="true">/</span>
                  <span className="tabular-nums">{selectedCardsCount} {itemLabel}</span>
                </div>
              </div>
            </div>
            <Dialog.Close
              aria-label="Close deck picker"
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors duration-150 hover:border-primary/30 hover:bg-white hover:text-slate-950 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/25"
            >
              <X className="size-4" aria-hidden="true" />
            </Dialog.Close>
          </div>

          <div className="min-h-0 flex-1 overscroll-contain overflow-y-auto bg-white p-3 customScrollBarStyle mobile:p-5">
            <div className="space-y-3">
              {LEVELS.map((level) => {
                const lessons = levelSummaries.find((summary) => summary.id === level.id)?.lessons ?? [];
                const lessonItems = lessons.map((lesson) => ({
                  ...lesson,
                  cardsCount: lesson.idiomCount,
                }));
                const totalCards = lessonItems.reduce((count, lesson) => count + lesson.cardsCount, 0);
                const styles = levelSectionStyles[level.id];
                const isLevelOpen = openLevels[level.id];
                const selectedInLevel = selectedLevel === level.id;
                const firstLesson = lessonItems[0]?.lesson_number;
                const lastLesson = lessonItems.at(-1)?.lesson_number;

                return (
                  <Collapsible.Root
                    key={level.id}
                    open={isLevelOpen}
                    onOpenChange={(nextOpen) =>
                      setOpenLevels((currentOpenLevels) => ({
                        ...currentOpenLevels,
                        [level.id]: nextOpen,
                      }))
                    }
                  >
                    <section
                      aria-labelledby={`${level.id}-lesson-group`}
                      className={cn(
                        "overflow-hidden rounded-lg border bg-white transition-[border-color,background-color,box-shadow] duration-150",
                        selectedInLevel ? styles.panel : "border-slate-200"
                      )}
                    >
                      <Collapsible.Trigger asChild>
                        <button
                          type="button"
                          className="group flex min-h-16 w-full items-center justify-between gap-3 px-3 py-3 text-left transition-colors duration-150 hover:bg-white/80 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-primary/25 mobile:px-4"
                        >
                          <span className="flex min-w-0 items-center gap-3">
                            <span className={cn("h-10 w-1.5 shrink-0 rounded-full", styles.accent)} aria-hidden="true" />
                            <span className="min-w-0">
                              <span className="flex min-w-0 items-center gap-2">
                                <span id={`${level.id}-lesson-group`} className="truncate text-sm font-black text-slate-950 mobile:text-base">
                                  {level.label}
                                </span>
                                {selectedInLevel ? (
                                  <span className="shrink-0 rounded-full border border-white/80 bg-white px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.08em] text-slate-600 shadow-sm">
                                    Current
                                  </span>
                                ) : null}
                              </span>
                              <span className="mt-1 block truncate text-xs font-semibold text-slate-500">
                                Lessons {firstLesson}-{lastLesson} / {totalCards} {itemLabel}
                              </span>
                            </span>
                          </span>
                          <span className="flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-black text-slate-600 shadow-sm">
                            <span className="tabular-nums">{lessonItems.length} lessons</span>
                            <ChevronDown
                              className={cn("size-4 transition-transform duration-150", isLevelOpen ? "rotate-180 text-slate-950" : "text-slate-500")}
                              aria-hidden="true"
                            />
                          </span>
                        </button>
                      </Collapsible.Trigger>

                      <Collapsible.Content role="region" aria-labelledby={`${level.id}-lesson-group`}>
                        <div className="grid grid-cols-2 gap-2 border-t border-slate-200 bg-white/85 p-3 mobile:grid-cols-3 mobile:p-4 tablet:grid-cols-4 desktop:grid-cols-5">
                          {lessonItems.map((lesson) => {
                            const isActive = selectedLevel === level.id && selectedLesson === lesson.lesson_number;

                            return (
                              <button
                                key={lesson.lesson_number}
                                type="button"
                                aria-label={`Choose ${level.label} lesson ${lesson.lesson_number}, ${lesson.cardsCount} ${itemLabel}`}
                                aria-pressed={isActive}
                                onClick={() => onLessonSelect({ level: level.id, lesson: lesson.lesson_number })}
                                className={cn(
                                  "group relative flex min-h-[84px] min-w-0 flex-col overflow-hidden rounded-lg border p-3 text-left transition-[border-color,background-color,box-shadow,transform] duration-150 [touch-action:manipulation] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/25",
                                  isActive
                                    ? styles.selected
                                    : "border-slate-200 bg-white text-slate-700 hover:-translate-y-0.5 hover:border-primary/35 hover:bg-slate-50 hover:shadow-sm"
                                )}
                              >
                                {isActive ? (
                                  <span className="absolute right-2 top-2 inline-flex size-5 items-center justify-center rounded-full bg-white text-current shadow-sm">
                                    <Check className="size-3.5" aria-hidden="true" />
                                  </span>
                                ) : null}
                                <span className="block pr-5 text-[11px] font-black uppercase tracking-[0.12em] opacity-65">
                                  Lesson
                                </span>
                                <span className="mt-1 block text-2xl font-black leading-none tabular-nums">
                                  {lesson.lesson_number}
                                </span>
                                <span className="mt-auto pt-2 text-[11px] font-black uppercase tracking-[0.08em] opacity-65 tabular-nums">
                                  {lesson.cardsCount} {itemLabel}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </Collapsible.Content>
                    </section>
                  </Collapsible.Root>
                );
              })}
            </div>

            {!isLessonMode ? (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-slate-200 pt-4">
                <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Deck order</span>
                <div className="grid grid-cols-2 gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={onShuffleDeck} disabled={!deckLength}>
                    <Shuffle className="size-4" />
                    Shuffle
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={onResetDeck} disabled={!deckLength}>
                    <RotateCcw className="size-4" />
                    Reset
                  </Button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex flex-row items-center justify-end gap-2 border-t border-slate-200 bg-slate-50/80 px-4 py-3 mobile:px-5">
            <Dialog.Close asChild>
              <Button type="button" variant="outline" className="shrink-0">
                Cancel
              </Button>
            </Dialog.Close>
            <Button type="button" onClick={onApply} className="shrink-0">
              {isLessonMode ? "Open lesson" : "Start lesson"}
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
