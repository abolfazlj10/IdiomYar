"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, RotateCcw, Shuffle, Star } from "lucide-react";
import Appbar from "@/components/appbar";
import { Button } from "@/components/ui/button";
import { getAllIdioms, getIdiomsForLesson, getLessons, LEVELS, type IdiomEntry } from "@/lib/idioms";
import { getProgress, markCard, type StudyProgress } from "@/lib/storage";
import type { LevelId } from "@/types/types";

const DEFAULT_LEVEL: LevelId = "elementary";

type SessionStats = {
  known: number;
  review: number;
};

export default function Cards(): React.ReactElement {
  const [activeLevel, setActiveLevel] = useState<LevelId>(DEFAULT_LEVEL);
  const [activeLesson, setActiveLesson] = useState<number>(getLessons(DEFAULT_LEVEL)[0]?.lesson_number ?? 1);
  const [progress, setProgress] = useState<StudyProgress>({ studied: {}, known: {}, review: {} });
  const [showAnswer, setShowAnswer] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [deckOrder, setDeckOrder] = useState<string[]>([]);
  const [reviewMode, setReviewMode] = useState(false);
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
  const knownInDeck = sourceDeck.filter((idiom) => progress.known[idiom.id]).length;
  const reviewInDeck = sourceDeck.filter((idiom) => progress.review[idiom.id]).length;

  useEffect(() => {
    setProgress(getProgress());
    setReviewMode(new URLSearchParams(window.location.search).get("mode") === "review");
  }, []);

  useEffect(() => {
    setActiveLesson(getLessons(activeLevel)[0]?.lesson_number ?? 1);
  }, [activeLevel]);

  useEffect(() => {
    setDeckOrder(sourceDeck.map((idiom) => idiom.id));
    setCurrentIndex(0);
    setShowAnswer(false);
    setStats({ known: 0, review: 0 });
  }, [sourceDeck]);

  const move = (direction: number): void => {
    setShowAnswer(false);
    setCurrentIndex((index) => Math.min(Math.max(index + direction, 0), Math.max(deck.length - 1, 0)));
  };

  const shuffleDeck = (): void => {
    setDeckOrder([...sourceDeck].sort(() => Math.random() - 0.5).map((idiom) => idiom.id));
    setCurrentIndex(0);
    setShowAnswer(false);
  };

  const mark = (status: "known" | "review"): void => {
    if (!current) {
      return;
    }

    setProgress(markCard(current.id, status));
    setStats((value) => ({ ...value, [status]: value[status] + 1 }));
    move(1);
  };

  return (
    <main className="flex h-full flex-col gap-4 overflow-hidden p-5 max-mobile:p-3">
      <Appbar title="Flash Cards" iconSrc="/icon/Seedling.svg" rightButton={<div />} onBackClick={() => history.back()} />

      <section className="grid min-h-0 flex-1 grid-cols-[300px_minmax(0,1fr)] gap-4 max-laptop:grid-cols-1">
        <aside className="flex min-h-0 flex-col gap-3 rounded-lg border bg-white/80 p-3 shadow-sm max-laptop:max-h-[360px]">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setReviewMode(false)}
              className={`rounded-lg border px-3 py-2 text-sm font-bold ${!reviewMode ? "border-primaryColor bg-primaryColor/10 text-primaryColor" : "bg-white text-gray-600"}`}
            >
              Lessons
            </button>
            <button
              type="button"
              onClick={() => setReviewMode(true)}
              className={`rounded-lg border px-3 py-2 text-sm font-bold ${reviewMode ? "border-primaryColor bg-primaryColor/10 text-primaryColor" : "bg-white text-gray-600"}`}
            >
              Review ({reviewDeck.length})
            </button>
          </div>

          {!reviewMode ? (
            <>
              <div className="grid grid-cols-3 gap-2">
                {LEVELS.map((level) => (
                  <button
                    key={level.id}
                    type="button"
                    onClick={() => setActiveLevel(level.id)}
                    className={`rounded-lg border px-2 py-2 text-xs font-bold transition ${
                      activeLevel === level.id ? level.softAccent : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {level.label}
                  </button>
                ))}
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto pr-1 customScrollBarStyle">
                <div className="grid grid-cols-2 gap-2">
                  {lessons.map((lesson) => (
                    <button
                      key={lesson.lesson_number}
                      type="button"
                      onClick={() => setActiveLesson(lesson.lesson_number)}
                      className={`rounded-lg border p-3 text-left transition ${
                        activeLesson === lesson.lesson_number ? "border-primaryColor bg-primaryColor/10" : "border-gray-200 bg-white hover:border-primaryColor/40"
                      }`}
                    >
                      <div className="text-sm font-bold">Lesson {lesson.lesson_number}</div>
                      <div className="mt-1 text-xs text-gray-500">{getIdiomsForLesson(activeLevel, lesson.lesson_number).length} cards</div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
              Review mode collects every idiom you marked as “Review again” across the app.
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 rounded-lg border bg-gray-50 p-3 text-center">
            <Metric label="Known" value={knownInDeck} />
            <Metric label="Review" value={reviewInDeck} />
          </div>
        </aside>

        <section className="flex min-h-0 flex-col gap-4 rounded-lg border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 max-mobile:flex-col max-mobile:items-stretch">
            <div>
              <h1 className="text-2xl font-black">{reviewMode ? "Review Deck" : `Lesson ${activeLesson}`}</h1>
              <p className="text-sm text-gray-500">
                {deck.length ? `Card ${currentIndex + 1} of ${deck.length}` : "No cards in this deck yet."}
              </p>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={shuffleDeck} disabled={!deck.length}>
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
              >
                <RotateCcw className="size-4" />
                Reset
              </Button>
            </div>
          </div>

          {current ? (
            <>
              <div className="flex min-h-[320px] flex-1 items-center justify-center rounded-lg border border-gray-200 bg-gradient-to-br from-white to-blue-50/70 p-8 text-center">
                <div className="max-w-3xl">
                  <div className="mb-3 text-xs font-bold uppercase tracking-wide text-primaryColor">
                    {current.levelLabel} · Lesson {current.lessonNumber}
                  </div>
                  <h2 className="text-4xl font-black max-tablet:text-3xl">{current.english_phrase}</h2>
                  {showAnswer ? (
                    <div className="mt-8 grid gap-4 text-left">
                      <div className="rounded-lg border bg-white p-4">
                        <div className="mb-1 text-xs font-bold uppercase text-gray-500">Meaning</div>
                        <p className="font-iranYekan text-lg text-gray-800" dir="rtl">
                          {current.persian_phrase_meaning}
                        </p>
                      </div>
                      <div className="rounded-lg border bg-white p-4">
                        <div className="mb-1 text-xs font-bold uppercase text-gray-500">Definition</div>
                        <p className="text-gray-800">{current.english_definition}</p>
                      </div>
                      {current.examples?.[0] ? (
                        <div className="rounded-lg border bg-white p-4">
                          <div className="mb-1 text-xs font-bold uppercase text-gray-500">Example</div>
                          <p className="font-semibold">{current.examples[0].english_text}</p>
                          <p className="mt-2 font-iranYekan text-sm text-gray-700" dir="rtl">
                            {current.examples[0].persian_meaning}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <Button type="button" className="mt-8" onClick={() => setShowAnswer(true)}>
                      <Eye className="size-4" />
                      Reveal answer
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 max-mobile:flex-col">
                <Button type="button" variant="outline" onClick={() => move(-1)} disabled={currentIndex === 0}>
                  <ArrowLeft className="size-4" />
                  Previous
                </Button>
                <div className="flex gap-2 max-mobile:w-full max-mobile:flex-col">
                  <Button type="button" variant="outline" onClick={() => mark("review")}>
                    <Star className="size-4" />
                    Review again
                  </Button>
                  <Button type="button" onClick={() => mark("known")}>
                    <CheckCircle2 className="size-4" />
                    Know it
                  </Button>
                </div>
                <Button type="button" variant="outline" onClick={() => move(1)} disabled={currentIndex >= deck.length - 1}>
                  Next
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed text-center text-sm text-gray-500">
              {reviewMode ? "No review cards yet. Mark a few cards as Review again to build this deck." : "No cards found."}
            </div>
          )}

          <div className="grid grid-cols-3 gap-3 max-mobile:grid-cols-1">
            <Metric label="Answered known" value={stats.known} />
            <Metric label="Sent to review" value={stats.review} />
            <Metric label="Remaining" value={Math.max(deck.length - currentIndex - 1, 0)} />
          </div>
        </section>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }): React.ReactElement {
  return (
    <div className="rounded-lg border bg-white px-3 py-2">
      <div className="text-lg font-black text-gray-900">{value}</div>
      <div className="text-xs font-semibold text-gray-500">{label}</div>
    </div>
  );
}
