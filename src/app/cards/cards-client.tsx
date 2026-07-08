"use client";

import { AnimatePresence, motion, useReducedMotion, type PanInfo, type Variants } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent, type WheelEvent as ReactWheelEvent } from "react";
import { ArrowLeft, ArrowRight, Eye, EyeOff, SlidersHorizontal, Star } from "lucide-react";
import Appbar from "@/components/appbar";
import { LessonPickerModal, type LessonPickerSelection } from "@/components/FlashCards/LessonPickerModal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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

type StudyPosition = {
  level: LevelId;
  lesson: number;
};

type DeckPlacement = "start" | "end";
type NextPressState = "idle" | "holding";
type ReviewSaveCue = {
  id: number;
};

type DesktopPreviewCardProps = {
  card?: IdiomEntry;
  className?: string;
  deckLength: number;
  offset: number;
  onSelect: (offset: number) => void;
  targetIndex: number;
};

const flashCardVariants: Variants = {
  enter: (direction: number) => ({
    opacity: 0,
    rotateZ: direction > 0 ? 2.5 : direction < 0 ? -2.5 : 0,
    scale: 0.96,
    x: direction > 0 ? 88 : direction < 0 ? -88 : 0,
  }),
  center: {
    opacity: 1,
    rotateZ: 0,
    scale: 1,
    x: 0,
    transition: { duration: 0.34, ease: [0.22, 1, 0.36, 1] },
  },
  exit: (direction: number) => ({
    opacity: 0,
    rotateZ: direction > 0 ? -2.5 : direction < 0 ? 2.5 : 0,
    scale: 0.96,
    x: direction > 0 ? -88 : direction < 0 ? 88 : 0,
    transition: { duration: 0.24, ease: [0.4, 0, 1, 1] },
  }),
};

const reducedFlashCardVariants: Variants = {
  enter: { opacity: 0 },
  center: { opacity: 1, transition: { duration: 0.12 } },
  exit: { opacity: 0, transition: { duration: 0.08 } },
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

function findLessonPosition(value: string | null): StudyPosition | null {
  const lessonNumber = Number(value);

  if (!Number.isInteger(lessonNumber)) {
    return null;
  }

  for (const level of LEVELS) {
    if (getLessons(level.id).some((lesson) => lesson.lesson_number === lessonNumber)) {
      return {
        level: level.id,
        lesson: lessonNumber,
      };
    }
  }

  return null;
}

function getRequestedStudyPosition(searchParams?: StudySearchParams): { level: LevelId; lesson: number } | null {
  const level = parseLevelParam(getParam(searchParams?.level));
  const lessonParam = getParam(searchParams?.lesson);

  if (level) {
    return {
      level,
      lesson: parseLessonParam(level, lessonParam) ?? getFirstLessonNumber(level),
    };
  }

  return findLessonPosition(lessonParam);
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
  const prefersReducedMotion = useReducedMotion();
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
  const [progress, setProgress] = useState<StudyProgress>({ studied: {}, known: {}, review: {} });
  const [showAnswer, setShowAnswer] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [deckDialogOpen, setDeckDialogOpen] = useState(false);
  const [deckOrder, setDeckOrder] = useState<string[]>([]);
  const [reviewMode, setReviewMode] = useState(requestedModeParam === "review");
  const [transitionDirection, setTransitionDirection] = useState(0);
  const [nextPressState, setNextPressState] = useState<NextPressState>("idle");
  const [reviewSaveCue, setReviewSaveCue] = useState<ReviewSaveCue | null>(null);
  const nextDeckPlacementRef = useRef<DeckPlacement>("start");
  const suppressRevealClickRef = useRef(false);
  const suppressRevealResetRef = useRef<number | null>(null);
  const nextDeckDirectionRef = useRef(0);
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
  const progressPercent = deck.length ? Math.round(((currentIndex + 1) / deck.length) * 100) : 0;

  const resetSession = useCallback((options: { direction?: number; index?: number } = {}): void => {
    setTransitionDirection(options.direction ?? 0);
    setCurrentIndex(options.index ?? 0);
    setShowAnswer(false);
  }, []);

  useEffect(() => {
    setProgress(getProgress());
    setReviewMode(requestedModeParam === "review");

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
    resetSession();
  }, [requestedModeParam, requestedPosition, resetSession]);

  useEffect(() => {
    const nextDeckOrder = sourceDeck.map((idiom) => idiom.id);
    const shouldStartAtEnd = nextDeckPlacementRef.current === "end";
    const direction = nextDeckDirectionRef.current;

    setDeckOrder(nextDeckOrder);
    resetSession({
      direction,
      index: shouldStartAtEnd ? Math.max(nextDeckOrder.length - 1, 0) : 0,
    });
    nextDeckPlacementRef.current = "start";
    nextDeckDirectionRef.current = 0;
  }, [sourceDeck, resetSession]);

  const isFirstCard = deck.length > 0 && currentIndex <= 0;
  const isLastCard = deck.length > 0 && currentIndex >= deck.length - 1;
  const previousLessonPosition = useMemo(
    () => (reviewMode ? null : getPreviousLessonPosition(activeLevel, activeLesson)),
    [activeLesson, activeLevel, reviewMode]
  );
  const nextLessonPosition = useMemo(
    () => (reviewMode ? null : getNextLessonPosition(activeLevel, activeLesson)),
    [activeLesson, activeLevel, reviewMode]
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

      setTransitionDirection(direction > 0 ? 1 : -1);
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
    (position: StudyPosition, direction: number, placement: DeckPlacement): void => {
      nextDeckPlacementRef.current = placement;
      nextDeckDirectionRef.current = direction;
      setTransitionDirection(direction);
      setReviewMode(false);
      setActiveLevel(position.level);
      setActiveLesson(position.lesson);
      setDraftLevel(position.level);
      setDraftLesson(position.lesson);
    },
    []
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
      goToLesson(nextLessonPosition, 1, "start");
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
      goToLesson(previousLessonPosition, -1, "end");
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
        goToLesson(nextLessonPosition, 1, "start");
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
    setDraftLesson(parseLessonParam(level, String(lesson)) ?? getFirstLessonNumber(level));
  };

  const applyDraftDeck = (): void => {
    setReviewMode(false);
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

                <div className="relative z-10 grid min-h-0 w-full grid-cols-1 items-stretch gap-3 [perspective:1400px] laptop:grid-cols-[minmax(126px,0.42fr)_minmax(420px,1.4fr)_minmax(126px,0.42fr)] laptop:gap-4 desktop:grid-cols-[minmax(96px,0.32fr)_minmax(154px,0.5fr)_minmax(460px,1.28fr)_minmax(154px,0.5fr)_minmax(96px,0.32fr)] desktop:gap-5">
                  <DesktopPreviewCard
                    card={deck[currentIndex - 2]}
                    className="hidden desktop:flex"
                    deckLength={deck.length}
                    offset={-2}
                    onSelect={move}
                    targetIndex={currentIndex - 2}
                  />

                  <DesktopPreviewCard
                    card={deck[currentIndex - 1]}
                    className="hidden laptop:flex"
                    deckLength={deck.length}
                    offset={-1}
                    onSelect={move}
                    targetIndex={currentIndex - 1}
                  />

                  <div className="relative z-20 flex min-h-0 w-full [perspective:1200px]">
                    <AnimatePresence mode="wait" custom={transitionDirection} initial={false}>
                      <motion.article
                        key={current.id}
                        custom={transitionDirection}
                        variants={prefersReducedMotion ? reducedFlashCardVariants : flashCardVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        drag={prefersReducedMotion ? false : "x"}
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.18}
                        dragSnapToOrigin
                        onDragStart={() => queueRevealClickSuppression()}
                        onDragEnd={(_, info) => handleDragEnd(info)}
                        onPointerDownCapture={handleCardPointerDown}
                        onPointerMoveCapture={handleCardPointerMove}
                        onPointerUpCapture={handleCardPointerUp}
                        onPointerCancelCapture={handleCardPointerUp}
                        onWheel={handleCardWheel}
                        whileDrag={prefersReducedMotion ? undefined : { cursor: "grabbing", scale: 0.985 }}
                        data-card-state={showAnswer ? "answer" : "prompt"}
                        className="flex min-h-[366px] w-full cursor-grab flex-col overflow-hidden rounded-lg border border-slate-200 bg-white text-center shadow-[0_22px_60px_rgba(15,23,42,0.18)] mobile:min-h-[420px] laptop:min-h-0"
                        style={{ transformStyle: "preserve-3d" }}
                      >
                        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-dashed border-slate-200 bg-slate-50/80 px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-slate-500 mobile:px-5">
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="truncate">
                              {current.levelLabel} / Lesson {current.lessonNumber}
                            </span>
                            <span className={`shrink-0 rounded-md px-2 py-1 text-[10px] tracking-[0.1em] ${showAnswer ? "bg-emerald-50 text-emerald-700" : "bg-slate-200/80 text-slate-600"}`}>
                              {showAnswer ? "Answer" : "Prompt"}
                            </span>
                          </div>
                          <span className="shrink-0 text-slate-700">
                            {currentIndex + 1}/{deck.length}
                          </span>
                        </div>

                        <motion.div
                          className="relative min-h-0 flex-1 [transform-style:preserve-3d]"
                          animate={{ rotateY: showAnswer ? 180 : 0 }}
                          transition={
                            prefersReducedMotion
                              ? { duration: 0.12 }
                              : { duration: 0.42, ease: [0.22, 1, 0.36, 1] }
                          }
                        >
                          <div
                            role={showAnswer ? undefined : "button"}
                            onClick={toggleCurrentCardAnswer}
                            aria-label={`Reveal answer for ${current.english_phrase}`}
                            aria-hidden={showAnswer}
                            tabIndex={showAnswer ? -1 : 0}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                toggleCurrentCardAnswer();
                              }
                            }}
                            className={`absolute inset-0 flex cursor-pointer items-center justify-center p-5 text-center focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-primary/25 tablet:p-8 [backface-visibility:hidden] ${
                              showAnswer ? "pointer-events-none" : ""
                            }`}
                          >
                            <h2 className="max-w-3xl text-3xl font-black leading-tight tracking-tight text-slate-950 mobile:text-4xl">
                              {current.english_phrase}
                            </h2>
                          </div>

                          <div
                            onClick={toggleCurrentCardAnswer}
                            aria-hidden={!showAnswer}
                            className={`absolute inset-0 overflow-y-auto p-5 text-left customScrollBarStyle tablet:p-8 [backface-visibility:hidden] [transform:rotateY(180deg)] ${
                              showAnswer ? "cursor-pointer" : "pointer-events-none"
                            }`}
                          >
                            <div className="mx-auto w-full max-w-3xl">
                              <h2 className="text-3xl font-black leading-tight tracking-tight text-slate-950 mobile:text-4xl">
                                {current.english_phrase}
                              </h2>

                              <div className="mt-7 divide-y divide-slate-200">
                                <AnswerBlock title="Meaning" rtl text={current.persian_phrase_meaning} />
                                <AnswerBlock title="Definition" text={current.english_definition} />
                                {current.examples?.[0] ? (
                                  <div className="pt-5">
                                    <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Example</div>
                                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-900 mobile:text-base">
                                      {current.examples[0].english_text}
                                    </p>
                                    <p dir="rtl" className="mt-2 font-iranYekan text-sm leading-7 text-slate-700">
                                      {current.examples[0].persian_meaning}
                                    </p>
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      </motion.article>
                    </AnimatePresence>
                  </div>

                  <DesktopPreviewCard
                    card={deck[currentIndex + 1]}
                    className="hidden laptop:flex"
                    deckLength={deck.length}
                    offset={1}
                    onSelect={move}
                    targetIndex={currentIndex + 1}
                  />

                  <DesktopPreviewCard
                    card={deck[currentIndex + 2]}
                    className="hidden desktop:flex"
                    deckLength={deck.length}
                    offset={2}
                    onSelect={move}
                    targetIndex={currentIndex + 2}
                  />
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
      />
    </main>
  );
}

function DesktopPreviewCard({
  card,
  className,
  deckLength,
  offset,
  onSelect,
  targetIndex,
}: DesktopPreviewCardProps): React.ReactElement {
  const isNear = Math.abs(offset) === 1;
  const isBefore = offset < 0;
  const previewProgress = deckLength ? Math.min(100, Math.max(0, Math.round(((targetIndex + 1) / deckLength) * 100))) : 0;
  const positionLabel = isBefore ? (isNear ? "Previous" : "Earlier") : isNear ? "Next" : "Later";

  if (!card) {
    return <div aria-hidden="true" className={cn("pointer-events-none min-h-[320px] rounded-lg opacity-0", className)} />;
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(offset)}
      aria-label={`Go to ${positionLabel.toLowerCase()} card ${targetIndex + 1}: ${card.english_phrase}`}
      className={cn(
        "group relative min-h-[320px] min-w-0 flex-col overflow-hidden rounded-lg border border-white/75 bg-white/70 p-4 text-left shadow-[0_18px_48px_rgba(15,23,42,0.12)] outline-none transition-[opacity,transform,border-color,background-color,box-shadow] duration-200 focus-visible:border-primary/40 focus-visible:ring-3 focus-visible:ring-primary/25",
        "hover:-translate-y-1 hover:border-primary/25 hover:bg-white/90 hover:shadow-[0_22px_54px_rgba(15,23,42,0.16)]",
        isNear ? "opacity-75" : "scale-[0.94] opacity-45",
        isBefore ? "-rotate-1" : "rotate-1",
        className
      )}
    >
      <span
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,rgba(255,255,255,0.92),rgba(248,250,252,0.72)_48%,rgba(236,253,245,0.46)_100%)]"
        aria-hidden="true"
      />
      <span className="pointer-events-none absolute inset-x-3 top-12 border-t border-dashed border-slate-300/80" aria-hidden="true" />

      <span className="relative z-10 flex h-full min-h-[288px] flex-col">
        <span className="flex min-w-0 items-center justify-between gap-2 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
          <span className="truncate">{positionLabel}</span>
          <span className="shrink-0 tabular-nums">
            {targetIndex + 1}/{deckLength}
          </span>
        </span>

        <span
          className={cn(
            "mt-9 block select-none text-xl font-black leading-tight text-slate-900 transition-[filter,opacity] duration-200 group-hover:opacity-90",
            isNear ? "blur-[1px] opacity-70" : "blur-[2px] opacity-55"
          )}
        >
          {card.english_phrase}
        </span>

        <span className="mt-auto block pt-6">
          <span className="block h-1.5 overflow-hidden rounded-full bg-slate-200/75">
            <span
              className={cn("block h-full rounded-full", isBefore ? "bg-slate-400" : "bg-gradient-to-r from-blue-500 to-teal-400")}
              style={{ width: `${previewProgress}%` }}
              aria-hidden="true"
            />
          </span>
        </span>
      </span>
    </button>
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
