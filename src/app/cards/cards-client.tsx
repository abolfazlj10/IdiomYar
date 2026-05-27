"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronDown, Eye, RotateCcw, Shuffle, Star } from "lucide-react";
import Appbar from "@/components/appbar";
import { Button } from "@/components/ui/button";
import { getAllIdioms, getIdiomsForLesson, getLessons, LEVELS, type IdiomEntry } from "@/lib/idioms";
import { getProgress, markCard, type StudyProgress } from "@/lib/storage";
import type { Lesson, LevelId } from "@/types/types";

const DEFAULT_LEVEL: LevelId = "elementary";

export type StudySearchParams = {
  level?: string | string[];
  lesson?: string | string[];
  mode?: string | string[];
};

type CardsPageProps = {
  searchParams?: StudySearchParams;
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

type SessionStats = {
  known: number;
  review: number;
};

type DeckSelectorProps = {
  activeLevel: LevelId;
  activeLesson: number;
  knownInDeck: number;
  lessons: Lesson[];
  reviewDeckLength: number;
  reviewInDeck: number;
  reviewMode: boolean;
  onLessonChange: (lesson: number) => void;
  onLevelChange: (level: LevelId) => void;
  onReviewModeChange: (reviewMode: boolean) => void;
};

const selectorButton =
  "min-h-11 rounded-lg border px-3 py-2 text-sm font-bold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/25 max-mobile:min-h-12";

export default function Cards({ searchParams }: CardsPageProps): React.ReactElement {
  const requestedLevelParam = getParam(searchParams?.level);
  const requestedLessonParam = getParam(searchParams?.lesson);
  const requestedModeParam = getParam(searchParams?.mode);
  const requestedPosition = useMemo(
    () => getRequestedStudyPosition({ level: requestedLevelParam ?? undefined, lesson: requestedLessonParam ?? undefined }),
    [requestedLevelParam, requestedLessonParam]
  );
  const [activeLevel, setActiveLevel] = useState<LevelId>(requestedPosition?.level ?? DEFAULT_LEVEL);
  const [activeLesson, setActiveLesson] = useState<number>(
    requestedPosition?.lesson ?? getFirstLessonNumber(requestedPosition?.level ?? DEFAULT_LEVEL)
  );
  const [progress, setProgress] = useState<StudyProgress>({ studied: {}, known: {}, review: {} });
  const [showAnswer, setShowAnswer] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
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
  const lessons = getLessons(activeLevel);
  const activeLevelMeta = LEVELS.find((level) => level.id === activeLevel) ?? LEVELS[0];
  const knownInDeck = sourceDeck.filter((idiom) => progress.known[idiom.id]).length;
  const reviewInDeck = sourceDeck.filter((idiom) => progress.review[idiom.id]).length;
  const progressPercent = deck.length ? Math.round(((currentIndex + 1) / deck.length) * 100) : 0;
  const remaining = Math.max(deck.length - currentIndex - 1, 0);
  const deckTitle = reviewMode ? "Review Deck" : `Lesson ${activeLesson}`;
  const deckSubtitle = reviewMode ? `${reviewDeck.length} cards marked for review` : `${activeLevelMeta.label} - ${sourceDeck.length} cards`;

  useEffect(() => {
    setProgress(getProgress());
    setReviewMode(requestedModeParam === "review");
  }, []);

  useEffect(() => {
    setActiveLesson(requestedPosition?.level === activeLevel ? requestedPosition.lesson : getFirstLessonNumber(activeLevel));
  }, [activeLevel]);

  useEffect(() => {
    setReviewMode(requestedModeParam === "review");

    if (!requestedPosition) {
      return;
    }

    setActiveLevel(requestedPosition.level);
    setActiveLesson(requestedPosition.lesson);
    setCurrentIndex(0);
    setShowAnswer(false);
  }, [requestedModeParam, requestedPosition]);

  useEffect(() => {
    setDeckOrder(sourceDeck.map((idiom) => idiom.id));
    setCurrentIndex(0);
    setShowAnswer(false);
    setStats({ known: 0, review: 0 });
  }, [sourceDeck]);

  const move = useCallback(
    (direction: number): void => {
      setShowAnswer(false);
      setCurrentIndex((index) => Math.min(Math.max(index + direction, 0), Math.max(deck.length - 1, 0)));
    },
    [deck.length]
  );

  const shuffleDeck = (): void => {
    setDeckOrder([...sourceDeck].sort(() => Math.random() - 0.5).map((idiom) => idiom.id));
    setCurrentIndex(0);
    setShowAnswer(false);
  };

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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
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
  }, [current, move, showAnswer]);

  return (
    <main className="mx-auto flex min-h-[calc(100dvh-2rem)] w-full min-w-0 flex-col gap-4 pb-32 pt-2 laptop:h-[calc(100dvh-2rem)] laptop:overflow-hidden laptop:pb-0">
      <Appbar title="Flash Cards" iconSrc="/icon/Seedling.svg" rightButton={<div />} onBackClick={() => history.back()} />

      <section className="grid min-h-0 flex-1 gap-4 laptop:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="hidden min-h-0 flex-col gap-3 rounded-lg border border-border bg-white p-3 shadow-sm laptop:flex">
          <DeckSelector
            activeLevel={activeLevel}
            activeLesson={activeLesson}
            knownInDeck={knownInDeck}
            lessons={lessons}
            reviewDeckLength={reviewDeck.length}
            reviewInDeck={reviewInDeck}
            reviewMode={reviewMode}
            onLessonChange={setActiveLesson}
            onLevelChange={setActiveLevel}
            onReviewModeChange={setReviewMode}
          />
        </aside>

        <section className="flex min-h-0 flex-col gap-4">
          <details className="group rounded-lg border border-border bg-white shadow-sm laptop:hidden">
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-left [&::-webkit-details-marker]:hidden">
              <div className="min-w-0">
                <div className="text-xs font-bold uppercase tracking-[0.12em] text-primary">Deck</div>
                <div className="truncate text-sm font-black text-slate-950">
                  {reviewMode ? "Review Deck" : `${activeLevelMeta.label} - Lesson ${activeLesson}`}
                </div>
              </div>
              <ChevronDown className="size-5 shrink-0 text-slate-500 transition-transform group-open:rotate-180" />
            </summary>
            <div className="border-t border-border p-3">
              <DeckSelector
                activeLevel={activeLevel}
                activeLesson={activeLesson}
                knownInDeck={knownInDeck}
                lessons={lessons}
                reviewDeckLength={reviewDeck.length}
                reviewInDeck={reviewInDeck}
                reviewMode={reviewMode}
                onLessonChange={setActiveLesson}
                onLevelChange={setActiveLevel}
                onReviewModeChange={setReviewMode}
              />
            </div>
          </details>

          <div className="flex min-h-0 flex-1 flex-col gap-4 rounded-lg border border-border bg-white p-4 shadow-sm mobile:p-5">
            <div className="flex flex-col gap-4 tablet:flex-row tablet:items-start tablet:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">{deckSubtitle}</p>
                <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 mobile:text-3xl">{deckTitle}</h1>
                <p className="mt-1 text-sm text-slate-500">
                  {deck.length ? `Card ${currentIndex + 1} of ${deck.length}` : "No cards in this deck yet."}
                </p>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={shuffleDeck} disabled={!deck.length} className="flex-1 tablet:flex-none">
                  <Shuffle className="size-4" />
                  Shuffle
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCurrentIndex(0);
                    setShowAnswer(false);
                    setStats({ known: 0, review: 0 });
                  }}
                  disabled={!deck.length}
                  className="flex-1 tablet:flex-none"
                >
                  <RotateCcw className="size-4" />
                  Reset
                </Button>
              </div>
            </div>

            <div className="rounded-full bg-slate-100" aria-hidden="true">
              <div className="h-2 rounded-full bg-primary transition-[width] duration-300" style={{ width: `${progressPercent}%` }} />
            </div>

            {current ? (
              <>
                <article className="flex min-h-[390px] flex-1 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-5 text-center mobile:min-h-[430px] tablet:p-8">
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
                      <Button type="button" size="lg" className="mt-8" onClick={() => setShowAnswer(true)}>
                        <Eye className="size-4" />
                        Reveal answer
                      </Button>
                    )}
                  </div>
                </article>

                <div className="hidden grid-cols-[1fr_1.2fr_1.2fr_1fr] gap-3 laptop:grid">
                  <Button type="button" size="lg" variant="outline" onClick={() => move(-1)} disabled={currentIndex === 0}>
                    <ArrowLeft className="size-4" />
                    Previous
                  </Button>
                  <Button type="button" size="lg" variant="review" onClick={() => mark("review")}>
                    <Star className="size-4" />
                    Review Again
                  </Button>
                  <Button type="button" size="lg" variant="success" onClick={() => mark("known")}>
                    <CheckCircle2 className="size-4" />
                    Know It
                  </Button>
                  <Button type="button" size="lg" onClick={() => move(1)} disabled={currentIndex >= deck.length - 1}>
                    Next
                    <ArrowRight className="size-4" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex min-h-[320px] flex-1 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
                {reviewMode ? "No review cards yet. Mark a few cards as Review Again to build this deck." : "No cards found."}
              </div>
            )}

            <div className="grid grid-cols-3 gap-2">
              <Metric label="Known" value={stats.known} />
              <Metric label="Review" value={stats.review} />
              <Metric label="Remaining" value={remaining} />
            </div>
          </div>
        </section>
      </section>

      {current ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-10px_30px_rgba(15,23,42,0.10)] backdrop-blur laptop:hidden">
          <div className="mx-auto grid max-w-2xl gap-2">
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant="outline" onClick={() => move(-1)} disabled={currentIndex === 0}>
                <ArrowLeft className="size-4" />
                Previous
              </Button>
              <Button type="button" onClick={() => move(1)} disabled={currentIndex >= deck.length - 1}>
                Next
                <ArrowRight className="size-4" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant="review" onClick={() => mark("review")}>
                <Star className="size-4" />
                Review Again
              </Button>
              <Button type="button" variant="success" onClick={() => mark("known")}>
                <CheckCircle2 className="size-4" />
                Know It
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function DeckSelector({
  activeLevel,
  activeLesson,
  knownInDeck,
  lessons,
  reviewDeckLength,
  reviewInDeck,
  reviewMode,
  onLessonChange,
  onLevelChange,
  onReviewModeChange,
}: DeckSelectorProps): React.ReactElement {
  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          aria-pressed={!reviewMode}
          onClick={() => onReviewModeChange(false)}
          className={`${selectorButton} ${
            !reviewMode ? "border-primary bg-primary/10 text-primary" : "border-border bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          Lessons
        </button>
        <button
          type="button"
          aria-pressed={reviewMode}
          onClick={() => onReviewModeChange(true)}
          className={`${selectorButton} ${
            reviewMode ? "border-primary bg-primary/10 text-primary" : "border-border bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          Review ({reviewDeckLength})
        </button>
      </div>

      {!reviewMode ? (
        <>
          <div className="grid grid-cols-3 gap-2">
            {LEVELS.map((level) => (
              <button
                key={level.id}
                type="button"
                aria-pressed={activeLevel === level.id}
                onClick={() => onLevelChange(level.id)}
                className={`${selectorButton} px-2 text-xs ${
                  activeLevel === level.id ? level.softAccent : "border-border bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {level.label}
              </button>
            ))}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto pr-1 customScrollBarStyle max-laptop:max-h-72">
            <div className="grid grid-cols-2 gap-2">
              {lessons.map((lesson) => {
                const cardsCount = getIdiomsForLesson(activeLevel, lesson.lesson_number).length;
                const isActive = activeLesson === lesson.lesson_number;

                return (
                  <button
                    key={lesson.lesson_number}
                    type="button"
                    aria-current={isActive ? "true" : undefined}
                    onClick={() => onLessonChange(lesson.lesson_number)}
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
        <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-950">
          Review mode collects every idiom you marked as Review Again across the app.
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 rounded-lg border border-border bg-slate-50 p-3 text-center">
        <Metric label="Known" value={knownInDeck} />
        <Metric label="Review" value={reviewInDeck} />
      </div>
    </>
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
