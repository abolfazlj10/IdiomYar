"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Bookmark, Clock, Eye, EyeOff, FileText, Languages, MessageSquareText, Search, Sparkles, Trash2 } from "lucide-react";
import Appbar from "@/components/appbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLevelBooks } from "@/hooks/use-level-books";
import { findIdiomById, getAllIdioms, idiomMatchesSearch, isLevelId, type IdiomEntry } from "@/lib/idioms";
import { cn } from "@/lib/utils";
import {
  getBookmarks,
  getProgress,
  getStories,
  removeBookmark,
  removeStory,
  type Bookmark as StoredBookmark,
  type SavedStory,
  type StudyProgress,
} from "@/lib/storage";

type ArchiveTab = "stories" | "bookmarks" | "review";

export default function Archive(): React.ReactElement {
  const { books, ensureLevels } = useLevelBooks();
  const [tab, setTab] = useState<ArchiveTab>("stories");
  const [query, setQuery] = useState("");
  const [stories, setStories] = useState<SavedStory[]>([]);
  const [bookmarks, setBookmarks] = useState<StoredBookmark[]>([]);
  const [progress, setProgress] = useState<StudyProgress>({ studied: {}, known: {}, review: {} });
  const [openStoryId, setOpenStoryId] = useState<string>("");
  const [openIdiomId, setOpenIdiomId] = useState<string>("");
  const [mobileReviewIndex, setMobileReviewIndex] = useState(0);
  const [showMobileReviewAnswer, setShowMobileReviewAnswer] = useState(false);

  const reviewIdioms = useMemo(
    () => getAllIdioms(books).filter((idiom) => progress.review[idiom.id]),
    [books, progress.review]
  );
  const bookmarkedIdioms = useMemo(
    () => bookmarks.map((bookmark) => findIdiomById(books, bookmark.id)).filter(Boolean) as IdiomEntry[],
    [bookmarks, books]
  );
  const filteredStories = stories.filter((story) =>
    [story.information, story.storyFa, story.storyEn, story.idioms.join(" ")]
      .join(" ")
      .toLowerCase()
      .includes(query.trim().toLowerCase())
  );
  const filteredBookmarks = bookmarkedIdioms.filter((idiom) => idiomMatchesSearch(idiom, query));
  const filteredReview = reviewIdioms.filter((idiom) => idiomMatchesSearch(idiom, query));
  const openStory = stories.find((story) => story.id === openStoryId) ?? filteredStories[0];
  const visibleIdioms = tab === "bookmarks" ? filteredBookmarks : filteredReview;
  const activeIdiom = visibleIdioms.find((idiom) => idiom.id === openIdiomId) ?? visibleIdioms[0];

  useEffect(() => {
    const storedStories = getStories();
    const storedBookmarks = getBookmarks();
    const storedProgress = getProgress();

    setStories(storedStories);
    setBookmarks(storedBookmarks);
    setProgress(storedProgress);

    const requiredLevels = [
      ...storedBookmarks.map((bookmark) => bookmark.level),
      ...Object.keys(storedProgress.review).map((id) => id.split(":", 1)[0]).filter(isLevelId),
    ];
    void ensureLevels(requiredLevels);

    if (window.matchMedia("(max-width: 1023px)").matches && Object.keys(storedProgress.review).length > 0) {
      setTab("review");
    }
  }, [ensureLevels]);

  useEffect(() => {
    setMobileReviewIndex((index) => Math.min(index, Math.max(reviewIdioms.length - 1, 0)));
    setShowMobileReviewAnswer(false);
  }, [reviewIdioms.length, tab]);

  return (
    <main className="flex min-h-[calc(100dvh-2rem)] min-w-0 flex-col gap-4 overflow-hidden pb-4 pt-2 max-laptop:gap-3 max-laptop:overflow-x-hidden max-mobile:min-h-dvh max-mobile:overflow-visible">
      <div className="max-laptop:hidden">
        <Appbar title="Archive & Review" iconSrc="/icon/Direct Hit.svg" rightButton={<div />} onBackClick={() => history.back()} />
      </div>

      <MobileArchiveHeader bookmarksCount={bookmarks.length} reviewCount={reviewIdioms.length} storiesCount={stories.length} tab={tab} />

      <section
        className={cn(
          "grid min-h-0 flex-1 grid-cols-[320px_minmax(0,1fr)] gap-4 max-laptop:grid-cols-1",
          tab === "review" && "max-laptop:flex max-laptop:flex-col"
        )}
      >
        <aside
          className={cn(
            "flex min-h-0 flex-col gap-3 rounded-lg border border-border bg-white p-3 shadow-sm max-laptop:max-h-[420px]",
            tab === "review" && "max-laptop:max-h-none max-laptop:border-0 max-laptop:bg-transparent max-laptop:p-0 max-laptop:shadow-none"
          )}
        >
          <div className="grid grid-cols-3 gap-2 max-laptop:gap-1 max-laptop:rounded-lg max-laptop:border max-laptop:border-slate-200 max-laptop:bg-slate-100 max-laptop:p-1">
            <TabButton active={tab === "stories"} count={stories.length} label="Stories" onClick={() => setTab("stories")} />
            <TabButton active={tab === "bookmarks"} count={bookmarks.length} label="Saved" onClick={() => setTab("bookmarks")} />
            <TabButton active={tab === "review"} count={reviewIdioms.length} label="Review" onClick={() => setTab("review")} />
          </div>

          <label className={cn("relative block", tab === "review" && "max-laptop:hidden")}>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <Input
              autoComplete="off"
              className="pl-9"
              name="archive-search"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search archive…"
              value={query}
            />
          </label>

          <div className={cn("min-h-0 flex-1 overflow-y-auto pr-1 customScrollBarStyle", tab === "review" && "max-laptop:hidden")}>
            {tab === "stories" ? (
              <ListPanel empty="No saved stories yet. Create a story to save it here.">
                {filteredStories.map((story) => (
                  <button
                    key={story.id}
                    type="button"
                    onClick={() => setOpenStoryId(story.id)}
                    className={`w-full rounded-lg border p-3 text-left transition ${
                      openStory?.id === story.id ? "border-primaryColor bg-primaryColor/10" : "border-gray-200 bg-white hover:border-primaryColor/40"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <MessageSquareText className="mt-0.5 size-4 shrink-0 text-primaryColor" />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-bold">{story.idioms.join(", ")}</div>
                        <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="size-3" />
                          {new Date(story.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </ListPanel>
            ) : null}

            {tab === "bookmarks" ? (
              <ListPanel empty="No saved idioms yet. Save idioms from Book Study.">
                {filteredBookmarks.map((idiom) => (
                  <IdiomRow key={idiom.id} idiom={idiom} active={activeIdiom?.id === idiom.id} onClick={() => setOpenIdiomId(idiom.id)} />
                ))}
              </ListPanel>
            ) : null}

            {tab === "review" ? (
              <ListPanel empty="No review cards yet. Mark flash cards as Review again.">
                {filteredReview.map((idiom) => (
                  <IdiomRow key={idiom.id} idiom={idiom} active={activeIdiom?.id === idiom.id} onClick={() => setOpenIdiomId(idiom.id)} />
                ))}
              </ListPanel>
            ) : null}
          </div>

          <Button asChild variant="outline" className={cn("w-full", tab === "review" && "max-laptop:hidden")}>
            <Link href="/cards?mode=review">Restart review deck</Link>
          </Button>
        </aside>

        {tab === "review" ? (
          <MobileReviewDeck
            currentIndex={mobileReviewIndex}
            idioms={reviewIdioms}
            onAnswerVisibilityChange={setShowMobileReviewAnswer}
            onIndexChange={setMobileReviewIndex}
            showAnswer={showMobileReviewAnswer}
          />
        ) : null}

        <section className={cn("min-h-0 overflow-y-auto rounded-lg border border-border bg-white p-5 shadow-sm customScrollBarStyle", tab === "review" && "max-laptop:hidden")}>
          {tab === "stories" ? (
            openStory ? (
              <StoryDetail
                story={openStory}
                onDelete={() => {
                  const next = removeStory(openStory.id);
                  setStories(next);
                  setOpenStoryId(next[0]?.id ?? "");
                }}
              />
            ) : (
              <EmptyState title="No stories saved" body="Generated stories will appear here automatically after you create one from a lesson." />
            )
          ) : activeIdiom ? (
            <IdiomDetail
              idiom={activeIdiom}
              canRemoveBookmark={tab === "bookmarks"}
              onRemoveBookmark={() => setBookmarks(removeBookmark(activeIdiom.id))}
            />
          ) : (
            <EmptyState title="Nothing to review yet" body="Save idioms or send flash cards to review, then come back here." />
          )}
        </section>
      </section>
    </main>
  );
}

function MobileArchiveHeader({
  bookmarksCount,
  reviewCount,
  storiesCount,
  tab,
}: {
  bookmarksCount: number;
  reviewCount: number;
  storiesCount: number;
  tab: ArchiveTab;
}): React.ReactElement {
  const meta = {
    stories: { count: storiesCount, countLabel: "Stories", eyebrow: "Archive", title: "Stories" },
    bookmarks: { count: bookmarksCount, countLabel: "Saved", eyebrow: "Archive", title: "Saved" },
    review: { count: reviewCount, countLabel: "Cards", eyebrow: "Practice", title: "Review" },
  }[tab];

  return (
    <header className="hidden min-w-0 items-center gap-3 pt-1 max-laptop:flex">
      <button
        type="button"
        className="inline-flex size-10 shrink-0 touch-manipulation items-center justify-center rounded-full text-slate-700 transition-colors duration-150 hover:bg-white focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primaryColor/25"
        onClick={() => history.back()}
        aria-label="Go back"
      >
        <ArrowLeft className="size-5" aria-hidden="true" />
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
          <Sparkles className="size-3.5 shrink-0 text-teal-600" aria-hidden="true" />
          <span className="truncate">{meta.eyebrow}</span>
        </div>
        <h1 className="truncate text-xl font-black leading-tight text-slate-950">{meta.title}</h1>
      </div>

      <div className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
        <span className="text-sm font-black tabular-nums leading-none text-slate-950">{meta.count}</span>
        <span className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500">{meta.countLabel}</span>
      </div>
    </header>
  );
}

function TabButton({ active, count, label, onClick }: { active: boolean; count: number; label: string; onClick: () => void }): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex min-w-0 touch-manipulation items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-bold transition-[background-color,border-color,color,box-shadow] duration-150",
        "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primaryColor/25",
        "max-laptop:min-h-9 max-laptop:rounded-md max-laptop:border-0 max-laptop:px-1.5 max-laptop:py-1.5",
        active
          ? "border-primaryColor bg-primaryColor/10 text-primaryColor max-laptop:bg-white max-laptop:text-slate-950 max-laptop:shadow-sm"
          : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 max-laptop:bg-transparent max-laptop:text-slate-500 max-laptop:hover:bg-white/70"
      )}
    >
      <span className="truncate">{label}</span>
      <span
        className={cn(
          "rounded-full px-1.5 py-0.5 text-[10px] font-black tabular-nums leading-none",
          active ? "bg-primaryColor/10 text-primaryColor max-laptop:bg-slate-100 max-laptop:text-slate-700" : "bg-slate-100 text-slate-500"
        )}
      >
        {count}
      </span>
    </button>
  );
}

function ListPanel({ children, empty }: { children: React.ReactNode; empty: string }): React.ReactElement {
  return <div className="flex flex-col gap-2">{Array.isArray(children) && children.length === 0 ? <div className="rounded-lg border border-dashed p-4 text-sm text-gray-500">{empty}</div> : children}</div>;
}

function IdiomRow({ idiom, active, onClick }: { idiom: IdiomEntry; active: boolean; onClick: () => void }): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-lg border p-3 text-left transition ${
        active ? "border-primaryColor bg-primaryColor/10" : "border-gray-200 bg-white hover:border-primaryColor/40"
      }`}
    >
      <div className="flex items-start gap-2">
        <Bookmark className="mt-0.5 size-4 shrink-0 text-primaryColor" />
        <div>
          <div className="text-sm font-bold">{idiom.english_phrase}</div>
        </div>
      </div>
    </button>
  );
}

function MobileReviewDeck({
  currentIndex,
  idioms,
  onAnswerVisibilityChange,
  onIndexChange,
  showAnswer,
}: {
  currentIndex: number;
  idioms: IdiomEntry[];
  onAnswerVisibilityChange: (showAnswer: boolean) => void;
  onIndexChange: (index: number) => void;
  showAnswer: boolean;
}): React.ReactElement {
  const current = idioms[currentIndex];
  const progressPercent = idioms.length ? Math.round(((currentIndex + 1) / idioms.length) * 100) : 0;

  const goToCard = (index: number): void => {
    const nextIndex = Math.min(Math.max(index, 0), Math.max(idioms.length - 1, 0));
    onIndexChange(nextIndex);
    onAnswerVisibilityChange(false);
  };

  if (!current) {
    return (
      <section className="laptop:hidden">
        <div className="flex min-h-[320px] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center shadow-sm">
          <div>
            <h2 className="text-lg font-black text-slate-950">No review cards</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Cards saved for review will appear here.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="laptop:hidden">
      <article className="flex min-h-[410px] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_18px_44px_rgba(15,23,42,0.10)]">
        <div
          className="h-1.5 overflow-hidden bg-slate-100"
          role="progressbar"
          aria-label="Review progress"
          aria-valuemin={0}
          aria-valuemax={idioms.length}
          aria-valuenow={currentIndex + 1}
        >
          <div className="h-full rounded-r-full bg-primary transition-[width] duration-300" style={{ width: `${progressPercent}%` }} />
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
          <div className="min-w-0">
            <div className="truncate text-[10px] font-black uppercase tracking-[0.13em] text-slate-500">
              {current.levelLabel} / Lesson {current.lessonNumber}
            </div>
            <div className="mt-0.5 text-xs font-bold tabular-nums text-slate-400">
              {currentIndex + 1} of {idioms.length}
            </div>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.1em]",
              showAnswer ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
            )}
          >
            {showAnswer ? "Answer" : "Prompt"}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onAnswerVisibilityChange(!showAnswer)}
          className="flex min-h-0 flex-1 touch-manipulation flex-col justify-center p-5 text-center outline-none transition-colors focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-primary/25"
          aria-label={showAnswer ? "Hide answer" : `Reveal answer for ${current.english_phrase}`}
          aria-pressed={showAnswer}
        >
          {showAnswer ? (
            <div className="mx-auto w-full max-w-sm text-left">
              <h2 className="break-words text-2xl font-black leading-tight text-slate-950 text-balance">{current.english_phrase}</h2>
              <p dir="rtl" className="mt-5 font-iranYekan text-xl leading-9 text-slate-900">
                {current.persian_phrase_meaning || "معنی فارسی ثبت نشده است."}
              </p>

              <div className="mt-6 border-t border-slate-200 pt-4">
                <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                  <FileText className="size-4" />
                  Definition
                </div>
                <p className="text-sm leading-7 text-slate-700">{current.english_definition || "No definition for this idiom yet."}</p>
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-sm">
              <h2 className="break-words text-3xl font-black leading-tight tracking-tight text-slate-950 text-balance">{current.english_phrase}</h2>
              <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-600">
                <Eye className="size-4" />
                Reveal
              </div>
            </div>
          )}
        </button>
      </article>

      <div className="mt-3 grid grid-cols-[1fr_auto_1fr] gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => goToCard(currentIndex - 1)}
          disabled={currentIndex <= 0}
          aria-label="Previous review card"
          className="min-w-0 px-3"
        >
          <ArrowLeft className="size-4" />
          <span>Prev</span>
        </Button>

        <Button
          type="button"
          size="icon"
          variant={showAnswer ? "outline" : "default"}
          onClick={() => onAnswerVisibilityChange(!showAnswer)}
          aria-label={showAnswer ? "Hide answer" : "Reveal answer"}
          aria-pressed={showAnswer}
          className="justify-self-center"
        >
          {showAnswer ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
        </Button>

        <Button
          type="button"
          onClick={() => goToCard(currentIndex + 1)}
          disabled={currentIndex >= idioms.length - 1}
          aria-label="Next review card"
          className="min-w-0 px-3"
        >
          <span>Next</span>
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </section>
  );
}

function StoryDetail({ story, onDelete }: { story: SavedStory; onDelete: () => void }): React.ReactElement {
  return (
    <article className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 text-xs font-bold uppercase tracking-wide text-primaryColor">Saved Story</div>
          <h1 className="text-2xl font-black">{story.idioms.join(", ")}</h1>
          <p className="mt-1 text-sm text-gray-500">{new Date(story.createdAt).toLocaleString()}</p>
          {story.information ? <p className="mt-3 rounded-lg border bg-gray-50 p-3 text-sm text-gray-700">{story.information}</p> : null}
        </div>
        <Button type="button" variant="outline" onClick={onDelete}>
          <Trash2 className="size-4" />
          Delete
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 max-tablet:grid-cols-1">
        <div className="rounded-lg border bg-gray-50 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-blue-700">
            <Languages className="size-4" />
            English
          </div>
          <p className="whitespace-pre-line leading-7 text-gray-900">{story.storyEn}</p>
        </div>
        <div className="rounded-lg border bg-gray-50 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-green-700">
            <Languages className="size-4" />
            Persian
          </div>
          <p dir="rtl" className="whitespace-pre-line font-iranYekan leading-8 text-gray-900">
            {story.storyFa}
          </p>
        </div>
      </div>
    </article>
  );
}

function IdiomDetail({
  idiom,
  canRemoveBookmark,
  onRemoveBookmark,
}: {
  idiom: IdiomEntry;
  canRemoveBookmark: boolean;
  onRemoveBookmark: () => void;
}): React.ReactElement {
  return (
    <article className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black max-tablet:text-2xl">{idiom.english_phrase}</h1>
          <p dir="rtl" className="mt-2 font-iranYekan text-lg text-gray-700">
            {idiom.persian_phrase_meaning}
          </p>
        </div>
        {canRemoveBookmark ? (
          <Button type="button" variant="outline" onClick={onRemoveBookmark}>
            <Trash2 className="size-4" />
            Remove
          </Button>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3 max-tablet:grid-cols-1">
        <ArchiveBlock title="Definition" text={idiom.english_definition} />
        <ArchiveBlock title="تعریف فارسی" text={idiom.persian_definition_meaning} rtl />
        <ArchiveBlock title="Usage Note" text={idiom.english_explanation} />
        <ArchiveBlock title="یادداشت کاربردی" text={idiom.persian_explanation_meaning} rtl />
      </div>
    </article>
  );
}

function ArchiveBlock({ title, text, rtl = false }: { title: string; text?: string | null; rtl?: boolean }): React.ReactElement {
  return (
    <div className="rounded-lg border bg-gray-50 p-4">
      <div className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">{title}</div>
      <p dir={rtl ? "rtl" : "ltr"} className={`${rtl ? "font-iranYekan text-right leading-7" : "leading-6"} text-sm text-gray-800`}>
        {text || "No extra note for this idiom."}
      </p>
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }): React.ReactElement {
  return (
    <div className="flex h-full min-h-[320px] items-center justify-center rounded-lg border border-dashed p-8 text-center">
      <div>
        <h2 className="text-xl font-black">{title}</h2>
        <p className="mt-2 max-w-md text-sm text-gray-500">{body}</p>
      </div>
    </div>
  );
}
