"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, RotateCcw, Shuffle, SlidersHorizontal, Star, X } from "lucide-react";
import Appbar from "@/components/appbar";
import { Button } from "@/components/ui/button";
import { getAllIdioms, getIdiomsForLesson, getLessons, LEVELS, type IdiomEntry } from "@/lib/idioms";
import { getProgress, markCard, type StudyProgress } from "@/lib/storage";
import type { LevelId } from "@/types/types";

const DEFAULT_LEVEL: LevelId = "elementary";
const DECK_SELECTOR_SEEN_KEY = "idiomyar:v1:cards-deck-selector-seen";

export type StudySearchParams = {
  level?: string | string[];
  lesson?: string | string[];
  mode?: string | string[];
};

type CardsPageProps = {
  searchParams?: StudySearchParams;
};

type SessionStats = {
  known: number;
  review: number;
};

type DeckSelectionDialogProps = {
  activeDeckLabel: string;
  deckLength: number;
  draftLesson: number;
  draftLevel: LevelId;
  draftReviewMode: boolean;
  knownInDeck: number;
  onApply: () => void;
  onDraftLessonChange: (lesson: number) => void;
  onDraftLevelChange: (level: LevelId) => void;
  onDraftReviewModeChange: (reviewMode: boolean) => void;
  onOpenChange: (open: boolean) => void;
  onResetDeck: () => void;
  onShuffleDeck: () => void;
  open: boolean;
  reviewDeckLength: number;
  reviewInDeck: number;
  sessionStats: SessionStats;
};

const modeButton =
  "min-h-11 rounded-lg border px-3 py-2 text-sm font-black transition-colors duration-150 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/25";

const levelDialogStyles = {
  elementary: {
    active: "border-[#F5C94D] bg-[#FFF7D8] text-[#5F4600]",
    dot: "bg-[#FFD84D]",
  },
  intermediate: {
    active: "border-[#99DDFB] bg-[#E9F8FF] text-[#064B6D]",
    dot: "bg-[#62C7FF]",
  },
  advanced: {
    active: "border-[#FFC0B2] bg-[#FFF0EB] text-[#8A2D18]",
    dot: "bg-[#FF6542]",
  },
} satisfies Record<LevelId, { active: string; dot: string }>;

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

function getRequestedStudyPosition(searchParams?: StudySearchParams): { level: LevelId; lesson: number } | null {
  const level = parseLevelParam(getParam(searchParams?.level));

  if (!level) {
    return null;
  }

  return {
    level,
    lesson: parseLessonParam(level, getParam(searchParams?.lesson)) ?? getFirstLessonNumber(level),
  };
}

function rememberDeckSelectorSeen(): void {
  try {
    window.localStorage.setItem(DECK_SELECTOR_SEEN_KEY, "true");
  } catch {
    // Keep the deck selector usable even when browser storage is unavailable.
  }
}

function hasSeenDeckSelector(): boolean {
  try {
    return window.localStorage.getItem(DECK_SELECTOR_SEEN_KEY) === "true";
  } catch {
    return true;
  }
}

export default function Cards({ searchParams }: CardsPageProps): React.ReactElement {
  const requestedLevelParam = getParam(searchParams?.level);
  const requestedLessonParam = getParam(searchParams?.lesson);
  const requestedModeParam = getParam(searchParams?.mode);
  const hasExplicitStudyQuery = Boolean(requestedLevelParam || requestedLessonParam || requestedModeParam);
  const requestedPosition = useMemo(
    () => getRequestedStudyPosition({ level: requestedLevelParam ?? undefined, lesson: requestedLessonParam ?? undefined }),
    [requestedLevelParam, requestedLessonParam]
  );

  const initialLevel = requestedPosition?.level ?? DEFAULT_LEVEL;
  const initialLesson = requestedPosition?.lesson ?? getFirstLessonNumber(initialLevel);
  const [activeLevel, setActiveLevel] = useState<LevelId>(initialLevel);
  const [activeLesson, setActiveLesson] = useState<number>(initialLesson);
  const [draftLevel, setDraftLevel] = useState<LevelId>(initialLevel);
  const [draftLesson, setDraftLesson] = useState<number>(initialLesson);
  const [draftReviewMode, setDraftReviewMode] = useState(requestedModeParam === "review");
  const [progress, setProgress] = useState<StudyProgress>({ studied: {}, known: {}, review: {} });
  const [showAnswer, setShowAnswer] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [deckDialogOpen, setDeckDialogOpen] = useState(false);
  const [deckOrder, setDeckOrder] = useState<string[]>([]);
  const [reviewMode, setReviewMode] = useState(requestedModeParam === "review");
  const [stats, setStats] = useState<SessionStats>({ known: 0, review: 0 });

  const normalDeck = useMemo(() => getIdiomsForLesson(activeLevel, activeLesson), [activeLevel, activeLesson]);
  const reviewDeck = useMemo(() => getAllIdioms().filter((idiom) => progress.review[idiom.id]), [progress.review]);
  const sourceDeck = reviewMode ? reviewDeck : normalDeck;
  const deck = useMemo(() => {
    if (!deckOrder.length) {
      return sourceDeck;
    }

    const byId = new Map(sourceDeck.map((idiom) => [idiom.id, idiom]));
    return deckOrder.map((id) => byId.get(id)).filter(Boolean) as IdiomEntry[];
  }, [deckOrder, sourceDeck]);
  const current = deck[currentIndex];
  const activeLevelMeta = LEVELS.find((level) => level.id === activeLevel) ?? LEVELS[0];
  const knownInDeck = sourceDeck.filter((idiom) => progress.known[idiom.id]).length;
  const reviewInDeck = sourceDeck.filter((idiom) => progress.review[idiom.id]).length;
  const progressPercent = deck.length ? Math.round(((currentIndex + 1) / deck.length) * 100) : 0;
  const remaining = Math.max(deck.length - currentIndex - 1, 0);
  const deckTitle = reviewMode ? "Review Deck" : `Lesson ${activeLesson}`;
  const deckSubtitle = reviewMode ? `${reviewDeck.length} cards marked for review` : `${activeLevelMeta.label} - ${sourceDeck.length} cards`;
  const activeDeckLabel = reviewMode ? "Review deck" : `${activeLevelMeta.label} - Lesson ${activeLesson}`;

  const resetSession = useCallback((): void => {
    setCurrentIndex(0);
    setShowAnswer(false);
    setStats({ known: 0, review: 0 });
  }, []);

  useEffect(() => {
    setProgress(getProgress());
    setReviewMode(requestedModeParam === "review");
    setDraftReviewMode(requestedModeParam === "review");

    if (!hasExplicitStudyQuery && !hasSeenDeckSelector()) {
      setDeckDialogOpen(true);
    }
  }, [hasExplicitStudyQuery, requestedModeParam]);

  useEffect(() => {
    setReviewMode(requestedModeParam === "review");

    if (!requestedPosition) {
      return;
    }

    setActiveLevel(requestedPosition.level);
    setActiveLesson(requestedPosition.lesson);
    setDraftLevel(requestedPosition.level);
    setDraftLesson(requestedPosition.lesson);
    setDraftReviewMode(requestedModeParam === "review");
    resetSession();
  }, [requestedModeParam, requestedPosition, resetSession]);

  useEffect(() => {
    setDeckOrder(sourceDeck.map((idiom) => idiom.id));
    resetSession();
  }, [sourceDeck, resetSession]);

  const move = useCallback(
    (direction: number): void => {
      setShowAnswer(false);
      setCurrentIndex((index) => Math.min(Math.max(index + direction, 0), Math.max(deck.length - 1, 0)));
    },
    [deck.length]
  );

  const shuffleDeck = useCallback((): void => {
    setDeckOrder([...sourceDeck].sort(() => Math.random() - 0.5).map((idiom) => idiom.id));
    resetSession();
  }, [resetSession, sourceDeck]);

  const resetDeck = useCallback((): void => {
    setDeckOrder(sourceDeck.map((idiom) => idiom.id));
    resetSession();
  }, [resetSession, sourceDeck]);

  const mark = useCallback(
    (status: "known" | "review"): void => {
      if (!current) {
        return;
      }

      setProgress(markCard(current.id, status));
      setStats((value) => ({ ...value, [status]: value[status] + 1 }));
      move(1);
    },
    [current, move]
  );

  const openDeckDialog = (): void => {
    setDraftLevel(activeLevel);
    setDraftLesson(activeLesson);
    setDraftReviewMode(reviewMode);
    setDeckDialogOpen(true);
  };

  const handleDeckDialogOpenChange = (open: boolean): void => {
    setDeckDialogOpen(open);

    if (!open) {
      rememberDeckSelectorSeen();
    }
  };

  const handleDraftLevelChange = (level: LevelId): void => {
    setDraftLevel(level);
    setDraftLesson((lesson) => parseLessonParam(level, String(lesson)) ?? getFirstLessonNumber(level));
  };

  const applyDraftDeck = (): void => {
    setReviewMode(draftReviewMode);
    setActiveLevel(draftLevel);
    setActiveLesson(parseLessonParam(draftLevel, String(draftLesson)) ?? getFirstLessonNumber(draftLevel));
    resetSession();
    rememberDeckSelectorSeen();
    setDeckDialogOpen(false);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (deckDialogOpen) {
        return;
      }

      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName;

      if (tagName && ["A", "BUTTON", "INPUT", "SELECT", "SUMMARY", "TEXTAREA"].includes(tagName)) {
        return;
      }

      if (!current) {
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        move(-1);
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        move(1);
      }

      if ((event.key === " " || event.key === "Enter") && !showAnswer) {
        event.preventDefault();
        setShowAnswer(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [current, deckDialogOpen, move, showAnswer]);

  return (
    <main className="mx-auto flex min-h-[calc(100dvh-2rem)] w-full min-w-0 flex-col gap-4 pb-4 pt-2 laptop:h-[calc(100dvh-2rem)] laptop:overflow-hidden">
      <Appbar title="Flash Cards" iconSrc="/icon/Seedling.svg" rightButton={<div />} onBackClick={() => history.back()} />

      <section className="flex min-h-0 flex-1">
        <div className="relative flex min-h-0 flex-1 flex-col gap-4 rounded-lg border border-border bg-white p-4 shadow-sm mobile:p-5">
          <button
            type="button"
            onClick={openDeckDialog}
            className="absolute right-4 top-4 z-10 inline-flex size-11 items-center justify-center rounded-lg border border-border bg-white text-slate-700 shadow-sm transition-[border-color,background-color,transform] duration-150 hover:-translate-y-0.5 hover:border-primary/35 hover:bg-accent focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/25"
            aria-label="Choose deck"
          >
            <SlidersHorizontal className="size-5" aria-hidden="true" />
          </button>

          <div className="min-w-0 pr-14">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">{deckSubtitle}</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 mobile:text-3xl">{deckTitle}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {deck.length ? `Card ${currentIndex + 1} of ${deck.length} - ${remaining} remaining` : "No cards in this deck yet."}
            </p>
          </div>

          <div className="rounded-full bg-slate-100" aria-hidden="true">
            <div className="h-2 rounded-full bg-primary transition-[width] duration-300" style={{ width: `${progressPercent}%` }} />
          </div>

          {current ? (
            <>
              <article className="flex min-h-[360px] flex-1 items-center justify-center overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-5 text-center customScrollBarStyle mobile:min-h-[420px] tablet:p-8 laptop:min-h-0">
                <div className="w-full max-w-3xl">
                  <div className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                    {current.levelLabel} - Lesson {current.lessonNumber}
                  </div>
                  <h2 className="mt-4 text-3xl font-black leading-tight tracking-tight text-slate-950 mobile:text-4xl">{current.english_phrase}</h2>
                  {showAnswer ? (
                    <div className="mt-7 divide-y divide-slate-200 text-left">
                      <AnswerBlock title="Meaning" rtl text={current.persian_phrase_meaning} />
                      <AnswerBlock title="Definition" text={current.english_definition} />
                      {current.examples?.[0] ? (
                        <div className="pt-5">
                          <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Example</div>
                          <p className="mt-2 text-sm font-semibold leading-6 text-slate-900 mobile:text-base">{current.examples[0].english_text}</p>
                          <p dir="rtl" className="mt-2 font-iranYekan text-sm leading-7 text-slate-700">
                            {current.examples[0].persian_meaning}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <p className="mx-auto mt-6 max-w-md text-sm leading-7 text-slate-500">
                      Reveal the answer when you are ready, then mark the card for recall or review.
                    </p>
                  )}
                </div>
              </article>

              <div className="grid grid-cols-[0.9fr_1.2fr_0.9fr] gap-2 mobile:gap-3">
                <Button type="button" size="lg" variant="outline" onClick={() => move(-1)} disabled={currentIndex === 0} className="px-2 mobile:px-4">
                  <ArrowLeft className="size-4" />
                  <span className="hidden mobile:inline">Previous</span>
                  <span className="mobile:hidden">Prev</span>
                </Button>

                {showAnswer ? (
                  <div className="grid min-w-0 grid-cols-2 gap-2">
                    <Button type="button" size="lg" variant="review" onClick={() => mark("review")} className="px-2 mobile:px-4">
                      <Star className="size-4" />
                      <span className="hidden tablet:inline">Review Again</span>
                      <span className="tablet:hidden">Review</span>
                    </Button>
                    <Button type="button" size="lg" variant="success" onClick={() => mark("known")} className="px-2 mobile:px-4">
                      <CheckCircle2 className="size-4" />
                      <span className="hidden tablet:inline">Know It</span>
                      <span className="tablet:hidden">Know</span>
                    </Button>
                  </div>
                ) : (
                  <Button type="button" size="lg" onClick={() => setShowAnswer(true)} className="px-2 mobile:px-4">
                    <Eye className="size-4" />
                    <span className="hidden mobile:inline">Reveal answer</span>
                    <span className="mobile:hidden">Reveal</span>
                  </Button>
                )}

                <Button type="button" size="lg" onClick={() => move(1)} disabled={currentIndex >= deck.length - 1} className="px-2 mobile:px-4">
                  <span>Next</span>
                  <ArrowRight className="size-4" />
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
                <span className="rounded-lg bg-slate-100 px-3 py-1.5">Known {stats.known}</span>
                <span className="rounded-lg bg-slate-100 px-3 py-1.5">Review {stats.review}</span>
                <span className="rounded-lg bg-slate-100 px-3 py-1.5">Deck {activeDeckLabel}</span>
              </div>
            </>
          ) : (
            <div className="flex min-h-[360px] flex-1 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <div className="max-w-md">
                <p className="text-base font-black text-slate-950">
                  {reviewMode ? "No review cards yet." : "No cards found."}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {reviewMode
                    ? "Mark a few cards as Review Again to build this deck."
                    : "Choose another level or lesson from the deck selector."}
                </p>
                <Button type="button" className="mt-5" onClick={openDeckDialog}>
                  <SlidersHorizontal className="size-4" />
                  Choose deck
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      <DeckSelectionDialog
        activeDeckLabel={activeDeckLabel}
        deckLength={deck.length}
        draftLesson={draftLesson}
        draftLevel={draftLevel}
        draftReviewMode={draftReviewMode}
        knownInDeck={knownInDeck}
        onApply={applyDraftDeck}
        onDraftLessonChange={setDraftLesson}
        onDraftLevelChange={handleDraftLevelChange}
        onDraftReviewModeChange={setDraftReviewMode}
        onOpenChange={handleDeckDialogOpenChange}
        onResetDeck={resetDeck}
        onShuffleDeck={shuffleDeck}
        open={deckDialogOpen}
        reviewDeckLength={reviewDeck.length}
        reviewInDeck={reviewInDeck}
        sessionStats={stats}
      />
    </main>
  );
}

function DeckSelectionDialog({
  activeDeckLabel,
  deckLength,
  draftLesson,
  draftLevel,
  draftReviewMode,
  knownInDeck,
  onApply,
  onDraftLessonChange,
  onDraftLevelChange,
  onDraftReviewModeChange,
  onOpenChange,
  onResetDeck,
  onShuffleDeck,
  open,
  reviewDeckLength,
  reviewInDeck,
  sessionStats,
}: DeckSelectionDialogProps): React.ReactElement {
  const lessons = getLessons(draftLevel);
  const draftLevelMeta = LEVELS.find((level) => level.id === draftLevel) ?? LEVELS[0];

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-sm data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[min(760px,calc(100dvh-2rem))] w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-lg border border-border bg-white shadow-[0_24px_80px_rgba(15,23,42,0.28)] focus-visible:outline-none">
          <div className="flex min-w-0 items-start justify-between gap-4 border-b border-border p-5">
            <div className="min-w-0">
              <Dialog.Title className="text-xl font-black tracking-tight text-slate-950">Choose your deck</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm leading-6 text-slate-500">
                Pick a lesson deck or review only the cards that need another pass.
              </Dialog.Description>
            </div>
            <Dialog.Close className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-white text-slate-600 shadow-sm transition-colors duration-150 hover:bg-accent focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/25">
              <X className="size-4" aria-hidden="true" />
              <span className="sr-only">Close</span>
            </Dialog.Close>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-5 customScrollBarStyle">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                aria-pressed={!draftReviewMode}
                onClick={() => onDraftReviewModeChange(false)}
                className={`${modeButton} ${
                  !draftReviewMode ? "border-primary bg-primary/10 text-primary" : "border-border bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                Lessons
              </button>
              <button
                type="button"
                aria-pressed={draftReviewMode}
                onClick={() => onDraftReviewModeChange(true)}
                className={`${modeButton} ${
                  draftReviewMode ? "border-primary bg-primary/10 text-primary" : "border-border bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                Review ({reviewDeckLength})
              </button>
            </div>

            {!draftReviewMode ? (
              <>
                <div className="mt-5 grid grid-cols-1 gap-2 tablet:grid-cols-3">
                  {LEVELS.map((level) => {
                    const isActive = draftLevel === level.id;
                    const styles = levelDialogStyles[level.id];

                    return (
                      <button
                        key={level.id}
                        type="button"
                        aria-pressed={isActive}
                        onClick={() => onDraftLevelChange(level.id)}
                        className={`flex min-h-14 items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left text-sm font-black transition-colors duration-150 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/25 ${
                          isActive ? styles.active : "border-border bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span>{level.label}</span>
                        <span className={`size-3 rounded ${styles.dot}`} aria-hidden="true" />
                      </button>
                    );
                  })}
                </div>

                <div className="mt-5">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">{draftLevelMeta.label}</p>
                      <h3 className="mt-1 text-lg font-black tracking-tight text-slate-950">Select lesson</h3>
                    </div>
                    <p className="text-sm font-semibold text-slate-500">{lessons.length} lessons</p>
                  </div>

                  <div className="mt-3 grid max-h-72 grid-cols-2 gap-2 overflow-y-auto pr-1 customScrollBarStyle mobile:grid-cols-3 tablet:grid-cols-4">
                    {lessons.map((lesson) => {
                      const cardsCount = getIdiomsForLesson(draftLevel, lesson.lesson_number).length;
                      const isActive = draftLesson === lesson.lesson_number;

                      return (
                        <button
                          key={lesson.lesson_number}
                          type="button"
                          aria-current={isActive ? "true" : undefined}
                          onClick={() => onDraftLessonChange(lesson.lesson_number)}
                          className={`min-h-16 rounded-lg border p-3 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/25 ${
                            isActive ? "border-primary bg-primary/10 text-slate-950" : "border-border bg-white text-slate-700 hover:border-primary/35"
                          }`}
                        >
                          <div className="text-sm font-black">Lesson {lesson.lesson_number}</div>
                          <div className="mt-1 text-xs font-semibold text-slate-500">{cardsCount} cards</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="mt-5 rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-950">
                Review mode collects every idiom you marked as Review Again across the app. You currently have {reviewDeckLength} review cards.
              </div>
            )}

            <div className="mt-5 grid gap-3 tablet:grid-cols-[1fr_1fr]">
              <div className="rounded-lg border border-border bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Current deck</p>
                <p className="mt-2 text-base font-black text-slate-950">{activeDeckLabel}</p>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <Metric label="Cards" value={deckLength} />
                  <Metric label="Known" value={knownInDeck} />
                  <Metric label="Review" value={reviewInDeck} />
                </div>
              </div>

              <div className="rounded-lg border border-border bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Session tools</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button type="button" variant="outline" onClick={onShuffleDeck} disabled={!deckLength}>
                    <Shuffle className="size-4" />
                    Shuffle
                  </Button>
                  <Button type="button" variant="outline" onClick={onResetDeck} disabled={!deckLength}>
                    <RotateCcw className="size-4" />
                    Reset
                  </Button>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                  <Metric label="Known now" value={sessionStats.known} />
                  <Metric label="Review now" value={sessionStats.review} />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-border p-5 mobile:flex-row mobile:justify-end">
            <Dialog.Close asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Dialog.Close>
            <Button type="button" onClick={onApply}>
              Start selected deck
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function AnswerBlock({ title, text, rtl = false }: { title: string; text?: string | null; rtl?: boolean }): React.ReactElement {
  return (
    <div className="py-5 first:pt-0">
      <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{title}</div>
      <p dir={rtl ? "rtl" : "ltr"} className={`${rtl ? "font-iranYekan text-right text-lg leading-8" : "text-sm leading-7 mobile:text-base"} mt-2 text-slate-800`}>
        {text || "No extra note for this idiom."}
      </p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }): React.ReactElement {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
      <div className="text-lg font-black text-slate-950">{value}</div>
      <div className="text-xs font-semibold text-slate-500">{label}</div>
    </div>
  );
}
