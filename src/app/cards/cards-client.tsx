"use client";

import { AnimatePresence, motion, useReducedMotion, type PanInfo } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent, type WheelEvent as ReactWheelEvent } from "react";
import { ArrowLeft, ArrowRight, Eye, EyeOff, SlidersHorizontal, Star } from "lucide-react";
import Appbar from "@/components/appbar";
import { LessonPickerModal, type LessonPickerSelection } from "@/components/FlashCards/LessonPickerModal";
import { Button } from "@/components/ui/button";
import { useLevelBooks } from "@/hooks/use-level-books";
import { cn } from "@/lib/utils";
import { getAllIdioms, getIdiomsForLesson, isLevelId, LEVELS, type IdiomEntry, type LevelSummary } from "@/lib/idioms";
import {
  findLessonPosition,
  getFirstLessonNumber,
  getNextLessonPosition,
  getParam,
  getPreviousLessonPosition,
  parseLessonParam,
  parseLevelParam,
  type StudyPosition,
} from "@/lib/study-navigation";
import { getProgress, markCard, type StudyProgress } from "@/lib/storage";
import type { Book, LevelId } from "@/types/types";
import { getStackCardPlacement, getStackCardZIndex, STACK_CARD_CLASS, STACK_VISIBLE_OFFSET } from "./cards-stack";
import { StackedCardFace } from "./stacked-card-face";

const DEFAULT_LEVEL: LevelId = "elementary";
const DECK_SELECTOR_SEEN_KEY = "idiomyar:v1:cards-deck-selector-seen";

export type StudySearchParams = {
  level?: string | string[];
  lesson?: string | string[];
  mode?: string | string[];
};

type CardsPageProps = {
  initialBook: Book;
  initialLevel: LevelId;
  levelSummaries: LevelSummary[];
  searchParams?: StudySearchParams;
};

type DeckPlacement = "start" | "end";
type NextPressState = "idle" | "holding";
type ReviewSaveCue = {
  id: number;
};

const SWIPE_DISTANCE = 90;
const SWIPE_VELOCITY = 520;
const DRAG_CLICK_SUPPRESSION_MS = 700;
const POINTER_DRAG_TOLERANCE = 8;
const LONG_PRESS_REVIEW_MS = 1500;
const WHEEL_NAVIGATION_THRESHOLD = 24;
const WHEEL_NAVIGATION_COOLDOWN_MS = 240;
const WHEEL_GESTURE_RESET_MS = 100;
const WHEEL_HORIZONTAL_INTENT_MIN = 4;
const WHEEL_HORIZONTAL_DOMINANCE = 0.65;
function getRequestedStudyPosition(
  levelSummaries: LevelSummary[],
  searchParams?: StudySearchParams
): { level: LevelId; lesson: number } | null {
  const level = parseLevelParam(getParam(searchParams?.level));
  const lessonParam = getParam(searchParams?.lesson);

  if (level) {
    return {
      level,
      lesson:
        parseLessonParam(levelSummaries, level, lessonParam) ??
        getFirstLessonNumber(levelSummaries, level),
    };
  }

  return findLessonPosition(levelSummaries, lessonParam);
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

export default function Cards({ initialBook, initialLevel, levelSummaries, searchParams }: CardsPageProps): React.ReactElement {
  const { books, ensureLevel, ensureLevels } = useLevelBooks(initialLevel, initialBook);
  const prefersReducedMotion = useReducedMotion();
  const requestedLevelParam = getParam(searchParams?.level);
  const requestedLessonParam = getParam(searchParams?.lesson);
  const requestedModeParam = getParam(searchParams?.mode);
  const hasExplicitStudyQuery = Boolean(requestedLevelParam || requestedLessonParam || requestedModeParam);
  const requestedPosition = useMemo(
    () => getRequestedStudyPosition(levelSummaries, { level: requestedLevelParam ?? undefined, lesson: requestedLessonParam ?? undefined }),
    [levelSummaries, requestedLevelParam, requestedLessonParam]
  );

  const startingLevel = requestedPosition?.level ?? initialLevel ?? DEFAULT_LEVEL;
  const initialLesson = requestedPosition?.lesson ?? getFirstLessonNumber(levelSummaries, startingLevel);
  const [activeLevel, setActiveLevel] = useState<LevelId>(startingLevel);
  const [activeLesson, setActiveLesson] = useState<number>(initialLesson);
  const [draftLevel, setDraftLevel] = useState<LevelId>(startingLevel);
  const [draftLesson, setDraftLesson] = useState<number>(initialLesson);
  const [progress, setProgress] = useState<StudyProgress>({ studied: {}, known: {}, review: {} });
  const [showAnswer, setShowAnswer] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [deckDialogOpen, setDeckDialogOpen] = useState(false);
  const [deckOrder, setDeckOrder] = useState<string[]>([]);
  const [reviewMode, setReviewMode] = useState(requestedModeParam === "review");
  const [nextPressState, setNextPressState] = useState<NextPressState>("idle");
  const [reviewSaveCue, setReviewSaveCue] = useState<ReviewSaveCue | null>(null);
  const nextDeckPlacementRef = useRef<DeckPlacement>("start");
  const suppressRevealClickRef = useRef(false);
  const suppressRevealResetRef = useRef<number | null>(null);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const pointerMovedRef = useRef(false);
  const wheelIntentRef = useRef(0);
  const wheelGestureResetRef = useRef<number | null>(null);
  const wheelNavigationCooldownRef = useRef<number | null>(null);
  const nextPressTimerRef = useRef<number | null>(null);
  const nextPressActiveRef = useRef(false);
  const nextPressCompletedRef = useRef(false);
  const nextClickHandledRef = useRef(false);
  const nextClickHandledResetRef = useRef<number | null>(null);
  const reviewSaveCueTimerRef = useRef<number | null>(null);

  const normalDeck = useMemo(
    () => getIdiomsForLesson(books[activeLevel], activeLevel, activeLesson),
    [activeLevel, activeLesson, books]
  );
  const reviewDeck = useMemo(
    () => getAllIdioms(books).filter((idiom) => progress.review[idiom.id]),
    [books, progress.review]
  );
  const sourceDeck = reviewMode ? reviewDeck : normalDeck;
  const deck = useMemo(() => {
    if (!deckOrder.length) {
      return sourceDeck;
    }

    const byId = new Map(sourceDeck.map((idiom) => [idiom.id, idiom]));
    return deckOrder.map((id) => byId.get(id)).filter(Boolean) as IdiomEntry[];
  }, [deckOrder, sourceDeck]);
  const current = deck[currentIndex];
  const progressPercent = deck.length ? Math.round(((currentIndex + 1) / deck.length) * 100) : 0;

  const resetSession = useCallback((options: { index?: number } = {}): void => {
    setCurrentIndex(options.index ?? 0);
    setShowAnswer(false);
  }, []);

  useEffect(() => {
    const storedProgress = getProgress();
    const reviewLevels = Object.keys(storedProgress.review)
      .map((id) => id.split(":", 1)[0])
      .filter(isLevelId);

    setProgress(storedProgress);
    void ensureLevels(reviewLevels);
    setReviewMode(requestedModeParam === "review");

    if (!hasExplicitStudyQuery && !hasSeenDeckSelector()) {
      setDeckDialogOpen(true);
    }
  }, [ensureLevels, hasExplicitStudyQuery, requestedModeParam]);

  useEffect(() => {
    setReviewMode(requestedModeParam === "review");

    if (!requestedPosition) {
      return;
    }

    setActiveLevel(requestedPosition.level);
    setActiveLesson(requestedPosition.lesson);
    setDraftLevel(requestedPosition.level);
    setDraftLesson(requestedPosition.lesson);
    resetSession();
  }, [requestedModeParam, requestedPosition, resetSession]);

  useEffect(() => {
    const nextDeckOrder = sourceDeck.map((idiom) => idiom.id);
    const shouldStartAtEnd = nextDeckPlacementRef.current === "end";
    setDeckOrder(nextDeckOrder);
    resetSession({
      index: shouldStartAtEnd ? Math.max(nextDeckOrder.length - 1, 0) : 0,
    });
    nextDeckPlacementRef.current = "start";
  }, [sourceDeck, resetSession]);

  const isFirstCard = deck.length > 0 && currentIndex <= 0;
  const isLastCard = deck.length > 0 && currentIndex >= deck.length - 1;
  const previousLessonPosition = useMemo(
    () => (reviewMode ? null : getPreviousLessonPosition(levelSummaries, activeLevel, activeLesson)),
    [activeLesson, activeLevel, levelSummaries, reviewMode]
  );
  const nextLessonPosition = useMemo(
    () => (reviewMode ? null : getNextLessonPosition(levelSummaries, activeLevel, activeLesson)),
    [activeLesson, activeLevel, levelSummaries, reviewMode]
  );
  const previousLessonLevelLabel = previousLessonPosition ? LEVELS.find((level) => level.id === previousLessonPosition.level)?.label ?? "" : "";
  const previousLessonAriaLabel = previousLessonPosition
    ? `Go to ${previousLessonLevelLabel} lesson ${previousLessonPosition.lesson}`.trim()
    : reviewMode
      ? "Finish review and choose another deck"
      : "Choose another deck";
  const nextLessonLevelLabel = nextLessonPosition ? LEVELS.find((level) => level.id === nextLessonPosition.level)?.label ?? "" : "";
  const nextLessonAriaLabel = nextLessonPosition
    ? `Go to ${nextLessonLevelLabel} lesson ${nextLessonPosition.lesson}`.trim()
    : reviewMode
      ? "Finish review and choose another deck"
      : "Choose another deck";

  const move = useCallback(
    (direction: number): void => {
      const nextIndex = Math.min(Math.max(currentIndex + direction, 0), Math.max(deck.length - 1, 0));

      if (nextIndex === currentIndex) {
        return;
      }

      setShowAnswer(false);
      setCurrentIndex(nextIndex);
    },
    [currentIndex, deck.length]
  );

  const queueRevealClickSuppression = useCallback((duration = DRAG_CLICK_SUPPRESSION_MS): void => {
    suppressRevealClickRef.current = true;

    if (suppressRevealResetRef.current !== null) {
      window.clearTimeout(suppressRevealResetRef.current);
    }

    suppressRevealResetRef.current = window.setTimeout(() => {
      suppressRevealClickRef.current = false;
      suppressRevealResetRef.current = null;
    }, duration);
  }, []);

  const toggleCurrentCardAnswer = useCallback((): void => {
    if (suppressRevealClickRef.current) {
      return;
    }

    setShowAnswer((isShowing) => !isShowing);
  }, []);

  const revealCurrentCard = useCallback((): void => {
    if (suppressRevealClickRef.current) {
      return;
    }

    setShowAnswer(true);
  }, []);

  const hideCurrentCardAnswer = useCallback((): void => {
    setShowAnswer(false);
  }, []);

  const handleCardPointerDown = useCallback((event: PointerEvent<HTMLElement>): void => {
    pointerStartRef.current = {
      x: event.clientX,
      y: event.clientY,
    };
    pointerMovedRef.current = false;
  }, []);

  const handleCardPointerMove = useCallback(
    (event: PointerEvent<HTMLElement>): void => {
      const start = pointerStartRef.current;

      if (!start) {
        return;
      }

      const distance = Math.hypot(event.clientX - start.x, event.clientY - start.y);

      if (distance > POINTER_DRAG_TOLERANCE) {
        pointerMovedRef.current = true;
        queueRevealClickSuppression();
      }
    },
    [queueRevealClickSuppression]
  );

  const handleCardPointerUp = useCallback((): void => {
    if (pointerMovedRef.current) {
      queueRevealClickSuppression();
    }

    pointerStartRef.current = null;
    pointerMovedRef.current = false;
  }, [queueRevealClickSuppression]);

  const clearWheelGestureReset = useCallback((): void => {
    if (wheelGestureResetRef.current !== null) {
      window.clearTimeout(wheelGestureResetRef.current);
      wheelGestureResetRef.current = null;
    }
  }, []);

  const clearWheelNavigationCooldown = useCallback((): void => {
    if (wheelNavigationCooldownRef.current !== null) {
      window.clearTimeout(wheelNavigationCooldownRef.current);
      wheelNavigationCooldownRef.current = null;
    }
  }, []);

  const resetWheelGesture = useCallback((): void => {
    wheelIntentRef.current = 0;
    clearWheelGestureReset();
  }, [clearWheelGestureReset]);

  const startWheelNavigationCooldown = useCallback((): void => {
    clearWheelNavigationCooldown();
    wheelNavigationCooldownRef.current = window.setTimeout(() => {
      wheelNavigationCooldownRef.current = null;
    }, WHEEL_NAVIGATION_COOLDOWN_MS);
  }, [clearWheelNavigationCooldown]);

  useEffect(() => {
    return () => {
      if (suppressRevealResetRef.current !== null) {
        window.clearTimeout(suppressRevealResetRef.current);
      }

      clearWheelGestureReset();
      clearWheelNavigationCooldown();

      if (nextPressTimerRef.current !== null) {
        window.clearTimeout(nextPressTimerRef.current);
      }

      if (nextClickHandledResetRef.current !== null) {
        window.clearTimeout(nextClickHandledResetRef.current);
      }

      if (reviewSaveCueTimerRef.current !== null) {
        window.clearTimeout(reviewSaveCueTimerRef.current);
      }
    };
  }, [clearWheelGestureReset, clearWheelNavigationCooldown]);

  const goToLesson = useCallback(
    async (position: StudyPosition, placement: DeckPlacement): Promise<void> => {
      await ensureLevel(position.level);
      nextDeckPlacementRef.current = placement;
      setReviewMode(false);
      setActiveLevel(position.level);
      setActiveLesson(position.lesson);
      setDraftLevel(position.level);
      setDraftLesson(position.lesson);
    },
    [ensureLevel]
  );

  const openDeckDialog = useCallback((): void => {
    setDraftLevel(activeLevel);
    setDraftLesson(activeLesson);
    setDeckDialogOpen(true);
  }, [activeLesson, activeLevel]);

  const advance = useCallback((): void => {
    if (currentIndex < deck.length - 1) {
      move(1);
      return;
    }

    if (nextLessonPosition) {
      void goToLesson(nextLessonPosition, "start");
      return;
    }

    openDeckDialog();
  }, [currentIndex, deck.length, goToLesson, move, nextLessonPosition, openDeckDialog]);

  const retreat = useCallback((): void => {
    if (currentIndex > 0) {
      move(-1);
      return;
    }

    if (previousLessonPosition) {
      void goToLesson(previousLessonPosition, "end");
      return;
    }

    openDeckDialog();
  }, [currentIndex, goToLesson, move, openDeckDialog, previousLessonPosition]);

  const handleCardWheel = useCallback(
    (event: ReactWheelEvent<HTMLElement>): void => {
      if (!current || event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }

      const horizontalIntent = Math.abs(event.deltaX);
      const verticalIntent = Math.abs(event.deltaY);
      const hasHorizontalIntent =
        horizontalIntent >= WHEEL_HORIZONTAL_INTENT_MIN && horizontalIntent >= verticalIntent * WHEEL_HORIZONTAL_DOMINANCE;
      const horizontalDelta = hasHorizontalIntent ? event.deltaX : event.shiftKey ? event.deltaY : 0;

      if (horizontalDelta === 0) {
        return;
      }

      event.preventDefault();

      if (wheelNavigationCooldownRef.current !== null) {
        return;
      }

      clearWheelGestureReset();
      wheelIntentRef.current += horizontalDelta;
      wheelGestureResetRef.current = window.setTimeout(resetWheelGesture, WHEEL_GESTURE_RESET_MS);

      if (Math.abs(wheelIntentRef.current) < WHEEL_NAVIGATION_THRESHOLD) {
        return;
      }

      const direction = wheelIntentRef.current > 0 ? 1 : -1;
      resetWheelGesture();
      startWheelNavigationCooldown();
      queueRevealClickSuppression(250);

      if (direction > 0) {
        advance();
        return;
      }

      retreat();
    },
    [advance, clearWheelGestureReset, current, queueRevealClickSuppression, resetWheelGesture, retreat, startWheelNavigationCooldown]
  );

  const handleDragEnd = useCallback(
    (info: PanInfo): void => {
      queueRevealClickSuppression();

      if (info.offset.x <= -SWIPE_DISTANCE || info.velocity.x <= -SWIPE_VELOCITY) {
        advance();
        return;
      }

      if (info.offset.x >= SWIPE_DISTANCE || info.velocity.x >= SWIPE_VELOCITY) {
        retreat();
      }
    },
    [advance, queueRevealClickSuppression, retreat]
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

      if (currentIndex < deck.length - 1) {
        move(1);
        return;
      }

      if (nextLessonPosition) {
        void goToLesson(nextLessonPosition, "start");
        return;
      }

      openDeckDialog();
    },
    [current, currentIndex, deck.length, goToLesson, move, nextLessonPosition, openDeckDialog]
  );

  const clearNextPressTimer = useCallback((): void => {
    if (nextPressTimerRef.current !== null) {
      window.clearTimeout(nextPressTimerRef.current);
      nextPressTimerRef.current = null;
    }
  }, []);

  const clearNextClickSuppression = useCallback((): void => {
    if (nextClickHandledResetRef.current !== null) {
      window.clearTimeout(nextClickHandledResetRef.current);
      nextClickHandledResetRef.current = null;
    }
  }, []);

  const suppressNextClick = useCallback(
    (duration = DRAG_CLICK_SUPPRESSION_MS): void => {
      clearNextClickSuppression();
      nextClickHandledRef.current = true;
      nextClickHandledResetRef.current = window.setTimeout(() => {
        nextClickHandledRef.current = false;
        nextClickHandledResetRef.current = null;
      }, duration);
    },
    [clearNextClickSuppression]
  );

  const showReviewSaveCue = useCallback((): void => {
    if (reviewSaveCueTimerRef.current !== null) {
      window.clearTimeout(reviewSaveCueTimerRef.current);
    }

    setReviewSaveCue({
      id: Date.now(),
    });

    reviewSaveCueTimerRef.current = window.setTimeout(() => {
      setReviewSaveCue(null);
      reviewSaveCueTimerRef.current = null;
    }, 2200);
  }, []);

  const resetNextPress = useCallback(
    (cancelClick = false): void => {
      const wasActive = nextPressActiveRef.current;

      clearNextPressTimer();
      nextPressActiveRef.current = false;
      nextPressCompletedRef.current = false;

      if (cancelClick && wasActive) {
        suppressNextClick();
      }

      setNextPressState("idle");
    },
    [clearNextPressTimer, suppressNextClick]
  );

  const startNextPress = useCallback((): void => {
    if (!current || nextPressActiveRef.current) {
      return;
    }

    clearNextPressTimer();
    nextPressActiveRef.current = true;
    nextPressCompletedRef.current = false;
    setNextPressState("holding");

    nextPressTimerRef.current = window.setTimeout(() => {
      nextPressTimerRef.current = null;
      nextPressActiveRef.current = false;
      nextPressCompletedRef.current = true;
      suppressNextClick(1200);
      setNextPressState("idle");
      showReviewSaveCue();
      mark("review");
    }, LONG_PRESS_REVIEW_MS);
  }, [clearNextPressTimer, current, mark, showReviewSaveCue, suppressNextClick]);

  const finishNextPressAsKnown = useCallback((): void => {
    if (nextPressCompletedRef.current) {
      nextPressCompletedRef.current = false;
      return;
    }

    if (!nextPressActiveRef.current) {
      return;
    }

    clearNextPressTimer();
    nextPressActiveRef.current = false;
    suppressNextClick();
    setNextPressState("idle");
    mark("known");
  }, [clearNextPressTimer, mark, suppressNextClick]);

  const handleNextClick = useCallback((): void => {
    if (nextClickHandledRef.current) {
      clearNextClickSuppression();
      nextClickHandledRef.current = false;
      return;
    }

    mark("known");
  }, [clearNextClickSuppression, mark]);

  const handleNextPointerDown = useCallback(
    (event: PointerEvent<HTMLButtonElement>): void => {
      if (event.button !== 0) {
        return;
      }

      startNextPress();
    },
    [startNextPress]
  );

  const handleNextKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLButtonElement>): void => {
      if ((event.key === " " || event.key === "Enter") && !event.repeat) {
        event.preventDefault();
        startNextPress();
      }
    },
    [startNextPress]
  );

  const handleNextKeyUp = useCallback(
    (event: ReactKeyboardEvent<HTMLButtonElement>): void => {
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        finishNextPressAsKnown();
      }
    },
    [finishNextPressAsKnown]
  );

  useEffect(() => {
    resetNextPress();
  }, [current?.id, resetNextPress]);

  const handleDeckDialogOpenChange = (open: boolean): void => {
    setDeckDialogOpen(open);

    if (!open) {
      rememberDeckSelectorSeen();
    }
  };

  const handleDraftLessonSelect = ({ level, lesson }: LessonPickerSelection): void => {
    setDraftLevel(level);
    setDraftLesson(
      parseLessonParam(levelSummaries, level, String(lesson)) ??
      getFirstLessonNumber(levelSummaries, level)
    );
  };

  const applyDraftDeck = async (): Promise<void> => {
    await ensureLevel(draftLevel);
    setReviewMode(false);
    setActiveLevel(draftLevel);
    setActiveLesson(
      parseLessonParam(levelSummaries, draftLevel, String(draftLesson)) ??
      getFirstLessonNumber(levelSummaries, draftLevel)
    );
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
        retreat();
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        mark("known");
      }

      if ((event.key === " " || event.key === "Enter") && !showAnswer) {
        event.preventDefault();
        revealCurrentCard();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [current, deckDialogOpen, mark, retreat, revealCurrentCard, showAnswer]);

  const isNextPressHolding = nextPressState === "holding";

  return (
    <main className="mx-auto flex min-h-[calc(100dvh-2rem)] w-full min-w-0 flex-col gap-4 pb-4 pt-2 laptop:h-[calc(100dvh-2rem)] laptop:overflow-hidden">
      <Appbar
        title="Flash Cards"
        iconSrc="/icon/Seedling.svg"
        rightButton={
          <button
            type="button"
            onClick={openDeckDialog}
            className="inline-flex size-10 items-center justify-center rounded-full text-slate-700 transition-colors duration-150 hover:bg-white focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/25"
            aria-label="Choose deck"
          >
            <SlidersHorizontal className="size-5" aria-hidden="true" />
          </button>
        }
        onBackClick={() => history.back()}
      />

      <section className="flex min-h-0 flex-1">
        <div className="relative flex min-h-0 flex-1 flex-col gap-4">
          <div className="rounded-full bg-slate-200/70" aria-hidden="true">
            <div className="h-2 rounded-full bg-primary transition-[width] duration-300" style={{ width: `${progressPercent}%` }} />
          </div>

          {current ? (
            <>
              <div className="relative flex min-h-[390px] flex-1 overflow-hidden rounded-lg border border-slate-200/80 bg-[linear-gradient(135deg,#F8FAFC_0%,#EEF8F1_52%,#FFF7E3_100%)] p-3 shadow-sm mobile:min-h-[460px] tablet:p-5 laptop:min-h-0 laptop:p-5 desktop:p-6">
                <div
                  className="pointer-events-none absolute inset-x-8 bottom-5 top-9 -rotate-1 rounded-lg border border-slate-200 bg-white/65 shadow-sm laptop:hidden"
                  aria-hidden="true"
                />
                <div
                  className="pointer-events-none absolute inset-x-5 bottom-8 top-5 rotate-1 rounded-lg border border-slate-200 bg-white/80 shadow-md laptop:hidden"
                  aria-hidden="true"
                />

                <div className="relative z-10 flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden [perspective:1400px]">
                  {deck.map((card, index) => {
                    const offset = index - currentIndex;
                    const isCurrent = offset === 0;
                    const isVisibleInStack = Math.abs(offset) <= STACK_VISIBLE_OFFSET;
                    const isSelectablePreview = !isCurrent && isVisibleInStack;

                    return (
                      <div
                        key={card.id}
                        className="absolute inset-0 flex items-center justify-center mobile:px-2 laptop:px-6"
                        style={{
                          pointerEvents: isVisibleInStack ? "auto" : "none",
                          zIndex: getStackCardZIndex(offset),
                        }}
                      >
                        <motion.article
                          initial={false}
                          animate={getStackCardPlacement(offset, Boolean(prefersReducedMotion))}
                          drag={isCurrent && !prefersReducedMotion ? "x" : false}
                          dragConstraints={{ left: 0, right: 0 }}
                          dragElastic={0.18}
                          dragSnapToOrigin
                          onDragStart={isCurrent ? () => queueRevealClickSuppression() : undefined}
                          onDragEnd={isCurrent ? (_, info) => handleDragEnd(info) : undefined}
                          onPointerDownCapture={isCurrent ? handleCardPointerDown : undefined}
                          onPointerMoveCapture={isCurrent ? handleCardPointerMove : undefined}
                          onPointerUpCapture={isCurrent ? handleCardPointerUp : undefined}
                          onPointerCancelCapture={isCurrent ? handleCardPointerUp : undefined}
                          onWheel={isCurrent ? handleCardWheel : undefined}
                          whileDrag={isCurrent && !prefersReducedMotion ? { cursor: "grabbing", zIndex: 120 } : undefined}
                          role={isSelectablePreview ? "button" : undefined}
                          tabIndex={isSelectablePreview ? 0 : undefined}
                          aria-label={
                            isSelectablePreview
                              ? `Go to ${offset < 0 ? "previous" : "next"} card ${index + 1}: ${card.english_phrase}`
                              : undefined
                          }
                          aria-hidden={isVisibleInStack ? undefined : true}
                          onClick={isSelectablePreview ? () => move(offset) : undefined}
                          onKeyDown={
                            isSelectablePreview
                              ? (event) => {
                                  if (event.key === "Enter" || event.key === " ") {
                                    event.preventDefault();
                                    move(offset);
                                  }
                                }
                              : undefined
                          }
                          data-card-state={isCurrent ? (showAnswer ? "answer" : "prompt") : "preview"}
                          className={cn(
                            STACK_CARD_CLASS,
                            isCurrent
                              ? "cursor-grab"
                              : "cursor-pointer text-left shadow-[0_18px_48px_rgba(15,23,42,0.12)] outline-none transition-[border-color,background-color,box-shadow] duration-200 hover:border-primary/25 hover:bg-white/95 hover:shadow-[0_24px_60px_rgba(15,23,42,0.16)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/25",
                            !isVisibleInStack && "pointer-events-none"
                          )}
                          style={{ transformStyle: "preserve-3d" }}
                        >
                          <StackedCardFace
                            card={card}
                            deckLength={deck.length}
                            isCurrent={isCurrent}
                            offset={offset}
                            onToggleAnswer={toggleCurrentCardAnswer}
                            showAnswer={isCurrent && showAnswer}
                            targetIndex={index}
                          />
                        </motion.article>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="relative">
                <AnimatePresence initial={false}>
                  {reviewSaveCue ? (
                    <motion.div
                      key={reviewSaveCue.id}
                      role="status"
                      aria-live="polite"
                      initial={{ opacity: 0, scale: 0.96, y: 8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98, y: 6 }}
                      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                      className="pointer-events-none absolute bottom-full right-0 z-30 mb-2 rounded-full bg-slate-950 px-3 py-1.5 text-xs font-bold text-white shadow-sm"
                    >
                      Saved for review
                    </motion.div>
                  ) : null}
                </AnimatePresence>

                <div className="grid grid-cols-[1fr_auto_1fr] gap-2 mobile:gap-3">
                  <Button type="button" size="lg" variant="outline" onClick={retreat} className="min-w-0 px-2 mobile:px-4" aria-label={isFirstCard ? previousLessonAriaLabel : "Previous card"}>
                    {isFirstCard ? (
                      previousLessonPosition ? (
                        <>
                          <ArrowLeft className="size-4" />
                          <span className="hidden tablet:inline">Previous lesson</span>
                          <span className="tablet:hidden">Lesson {previousLessonPosition.lesson}</span>
                        </>
                      ) : (
                        <>
                          <SlidersHorizontal className="size-4" />
                          <span className="hidden tablet:inline">Choose deck</span>
                          <span className="tablet:hidden">Decks</span>
                        </>
                      )
                    ) : (
                      <>
                        <ArrowLeft className="size-4" />
                        <span className="hidden mobile:inline">Previous</span>
                        <span className="mobile:hidden">Prev</span>
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    size="icon"
                    variant={showAnswer ? "outline" : "default"}
                    onClick={showAnswer ? hideCurrentCardAnswer : revealCurrentCard}
                    className="size-12 justify-self-center"
                    aria-label={showAnswer ? "Hide answer" : "Reveal answer"}
                    title={showAnswer ? "Hide answer" : "Reveal answer"}
                    aria-pressed={showAnswer}
                  >
                    {showAnswer ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                  </Button>

                  <Button
                    type="button"
                    size="lg"
                    onClick={handleNextClick}
                    onPointerDown={handleNextPointerDown}
                    onPointerUp={finishNextPressAsKnown}
                    onPointerLeave={() => resetNextPress(true)}
                    onPointerCancel={() => resetNextPress(true)}
                    onKeyDown={handleNextKeyDown}
                    onKeyUp={handleNextKeyUp}
                    onBlur={() => resetNextPress(true)}
                    onContextMenu={(event) => event.preventDefault()}
                    className={`relative min-w-0 overflow-hidden px-2 mobile:px-4 ${
                      isNextPressHolding
                        ? "border border-amber-300 bg-amber-50 text-amber-900 shadow-[0_0_0_3px_rgba(245,158,11,0.16)] hover:bg-amber-50"
                        : ""
                    }`}
                    aria-label={`${isLastCard ? nextLessonAriaLabel : "Next card"}. Press to mark known. Hold briefly to save for review.`}
                  >
                    <span
                      aria-hidden="true"
                      className={`absolute inset-y-0 left-0 z-0 bg-amber-300/35 transition-[width] ease-linear ${
                        isNextPressHolding ? "w-full duration-[1500ms]" : "w-0 duration-150"
                      }`}
                    />
                    <span className="relative z-10 inline-flex min-w-0 items-center justify-center gap-2">
                      {isNextPressHolding ? (
                        <>
                          <Star className="size-4" />
                          <span className="hidden mobile:inline">Save for review</span>
                          <span className="mobile:hidden">Save</span>
                        </>
                      ) : (
                        <>
                          {isLastCard ? (
                            nextLessonPosition ? (
                              <>
                                <span className="hidden tablet:inline">Next lesson</span>
                                <span className="tablet:hidden">Lesson {nextLessonPosition.lesson}</span>
                              </>
                            ) : (
                              <>
                                <span className="hidden tablet:inline">Choose deck</span>
                                <span className="tablet:hidden">Decks</span>
                              </>
                            )
                          ) : (
                            <span>Next</span>
                          )}
                          <ArrowRight className="size-4" />
                        </>
                      )}
                    </span>
                  </Button>
                </div>
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
                    ? "No cards saved for another pass yet."
                    : "Choose another lesson from the deck selector."}
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

      <LessonPickerModal
        deckLength={deck.length}
        onApply={applyDraftDeck}
        onLessonSelect={handleDraftLessonSelect}
        onOpenChange={handleDeckDialogOpenChange}
        onResetDeck={resetDeck}
        onShuffleDeck={shuffleDeck}
        open={deckDialogOpen}
        selectedLesson={draftLesson}
        selectedLevel={draftLevel}
        levelSummaries={levelSummaries}
      />
    </main>
  );
}
