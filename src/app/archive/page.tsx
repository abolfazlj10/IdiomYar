"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BookOpen, Bookmark, Clock, Library, Search, Trash2 } from "lucide-react";
import Appbar from "@/components/appbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { findIdiomById, getAllIdioms, getLevelMeta, idiomMatchesSearch, type IdiomEntry } from "@/lib/idioms";
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
  const [tab, setTab] = useState<ArchiveTab>("stories");
  const [query, setQuery] = useState("");
  const [stories, setStories] = useState<SavedStory[]>([]);
  const [bookmarks, setBookmarks] = useState<StoredBookmark[]>([]);
  const [progress, setProgress] = useState<StudyProgress>({ studied: {}, known: {}, review: {} });
  const [openStoryId, setOpenStoryId] = useState<string>("");
  const [openIdiomId, setOpenIdiomId] = useState<string>("");

  const reviewIdioms = useMemo(() => getAllIdioms().filter((idiom) => progress.review[idiom.id]), [progress.review]);
  const bookmarkedIdioms = useMemo(
    () => bookmarks.map((bookmark) => findIdiomById(bookmark.id)).filter(Boolean) as IdiomEntry[],
    [bookmarks]
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
  const activeIdiom = [...filteredBookmarks, ...filteredReview].find((idiom) => idiom.id === openIdiomId) ?? filteredBookmarks[0] ?? filteredReview[0];

  useEffect(() => {
    setStories(getStories());
    setBookmarks(getBookmarks());
    setProgress(getProgress());
  }, []);

  return (
    <main className="flex min-h-[calc(100dvh-2rem)] min-w-0 flex-col gap-4 overflow-hidden pb-4 pt-2 max-mobile:min-h-dvh max-mobile:overflow-visible">
      <Appbar title="Archive & Review" iconSrc="/icon/Open Book.svg" rightButton={<div />} onBackClick={() => history.back()} />

      <section className="grid min-h-0 flex-1 grid-cols-[320px_minmax(0,1fr)] gap-4 max-laptop:grid-cols-1">
        <aside className="flex min-h-0 flex-col gap-3 rounded-lg border border-border bg-white p-3 shadow-sm max-laptop:max-h-[420px]">
          <div className="grid grid-cols-3 gap-2">
            <TabButton active={tab === "stories"} label={`Stories ${stories.length}`} onClick={() => setTab("stories")} />
            <TabButton active={tab === "bookmarks"} label={`Saved ${bookmarks.length}`} onClick={() => setTab("bookmarks")} />
            <TabButton active={tab === "review"} label={`Review ${reviewIdioms.length}`} onClick={() => setTab("review")} />
          </div>

          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search archive" className="pl-9" />
          </label>

          <div className="min-h-0 flex-1 overflow-y-auto pr-1 customScrollBarStyle">
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
                      <Library className="mt-0.5 size-4 shrink-0 text-primaryColor" />
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

          <Button asChild variant="outline" className="w-full">
            <Link href="/cards?mode=review">Restart review deck</Link>
          </Button>
        </aside>

        <section className="min-h-0 overflow-y-auto rounded-lg border border-border bg-white p-5 shadow-sm customScrollBarStyle">
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
              <EmptyState title="No stories saved" body="Generated stories will appear here automatically after a successful Story Creator run." />
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

function TabButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-2 py-2 text-xs font-bold transition ${
        active ? "border-primaryColor bg-primaryColor/10 text-primaryColor" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
      }`}
    >
      {label}
    </button>
  );
}

function ListPanel({ children, empty }: { children: React.ReactNode; empty: string }): React.ReactElement {
  return <div className="flex flex-col gap-2">{Array.isArray(children) && children.length === 0 ? <div className="rounded-lg border border-dashed p-4 text-sm text-gray-500">{empty}</div> : children}</div>;
}

function IdiomRow({ idiom, active, onClick }: { idiom: IdiomEntry; active: boolean; onClick: () => void }): React.ReactElement {
  const level = getLevelMeta(idiom.level);
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
          <div className="mt-1 text-xs text-gray-500">
            {level.label} · Lesson {idiom.lessonNumber}
          </div>
        </div>
      </div>
    </button>
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
            <BookOpen className="size-4" />
            English
          </div>
          <p className="whitespace-pre-line leading-7 text-gray-900">{story.storyEn}</p>
        </div>
        <div className="rounded-lg border bg-gray-50 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-green-700">
            <BookOpen className="size-4" />
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
          <div className="mb-2 text-xs font-bold uppercase tracking-wide text-primaryColor">
            {idiom.levelLabel} · Lesson {idiom.lessonNumber}
          </div>
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
