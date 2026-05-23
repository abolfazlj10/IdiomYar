"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Bookmark,
  Brain,
  CheckCircle2,
  Layers3,
  Library,
  NotebookTabs,
  Play,
  RotateCcw,
  Search,
  Sparkles,
  Star,
  Target,
  Trophy,
} from "lucide-react";
import { getAllIdioms, getIdiomsForLesson, getLessons, LEVELS, type IdiomEntry } from "@/lib/idioms";
import { getBookmarks, getProgress, getStories, type StudyProgress } from "@/lib/storage";
import { useScrollFade } from "@/hooks/useScrollFade";
import type { LevelId } from "@/types/types";

type ModeCard = {
  title: string;
  description: string;
  href: string;
  cta: string;
  icon: React.ReactNode;
  accent: string;
};

type LevelSummary = {
  id: LevelId;
  label: string;
  shortLabel: string;
  description: string;
  icon: string;
  lessonCount: number;
  idiomCount: number;
  studiedCount: number;
  knownCount: number;
  percent: number;
};

const EMPTY_PROGRESS: StudyProgress = {
  studied: {},
  known: {},
  review: {},
};

const MODE_CARDS: ModeCard[] = [
  {
    title: "Book Study",
    description: "Move lesson by lesson with meanings, examples, Persian support, bookmarks, and studied marks.",
    href: "/book",
    cta: "Open lessons",
    icon: <BookOpen />,
    accent: "from-emerald-500 to-teal-600",
  },
  {
    title: "Flash Cards",
    description: "Reveal, decide, and push weak idioms into a review queue so practice stays active.",
    href: "/cards",
    cta: "Start recall",
    icon: <NotebookTabs />,
    accent: "from-sky-500 to-blue-600",
  },
  {
    title: "Story Creator",
    description: "Turn selected idioms into a bilingual story so phrases become usable in context.",
    href: "/story",
    cta: "Create story",
    icon: <Sparkles />,
    accent: "from-violet-500 to-fuchsia-600",
  },
  {
    title: "Archive",
    description: "Return to saved stories, bookmarks, and review cards without hunting through lessons.",
    href: "/archive",
    cta: "Review archive",
    icon: <Library />,
    accent: "from-amber-500 to-orange-600",
  },
];

const STUDY_LOOP = [
  {
    title: "Learn",
    body: "Read a small lesson, compare English and Persian meaning, and mark what you touched.",
    icon: <BookOpen />,
  },
  {
    title: "Recall",
    body: "Use flash cards to test memory before the answer appears.",
    icon: <Brain />,
  },
  {
    title: "Use",
    body: "Generate a short story and see the idioms inside a real situation.",
    icon: <Sparkles />,
  },
  {
    title: "Review",
    body: "Come back to saved and weak idioms until they feel natural.",
    icon: <RotateCcw />,
  },
];

const LEVEL_ACCENTS: Record<LevelId, string> = {
  elementary: "border-emerald-200 bg-emerald-50 text-emerald-700",
  intermediate: "border-sky-200 bg-sky-50 text-sky-700",
  advanced: "border-rose-200 bg-rose-50 text-rose-700",
};

export default function Home(): React.ReactElement {
  const scrollRef = useScrollFade();
  const [progress, setProgress] = useState<StudyProgress>(EMPTY_PROGRESS);
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [storyCount, setStoryCount] = useState(0);

  const allIdioms = useMemo(() => getAllIdioms(), []);
  const totalLessons = useMemo(() => LEVELS.reduce((sum, level) => sum + getLessons(level.id).length, 0), []);

  useEffect(() => {
    setProgress(getProgress());
    setBookmarkCount(getBookmarks().length);
    setStoryCount(getStories().length);
  }, []);

  const reviewedIdioms = allIdioms.filter((idiom) => progress.review[idiom.id]);
  const studiedCount = allIdioms.filter((idiom) => progress.studied[idiom.id]).length;
  const knownCount = allIdioms.filter((idiom) => progress.known[idiom.id]).length;
  const completion = toPercent(studiedCount, allIdioms.length);
  const mastery = toPercent(knownCount, allIdioms.length);

  const levelSummaries = LEVELS.map((level): LevelSummary => {
    const idioms = getAllIdioms(level.id);
    const lessons = getLessons(level.id);

    const studiedInLevel = idioms.filter((idiom) => progress.studied[idiom.id]).length;
    const knownInLevel = idioms.filter((idiom) => progress.known[idiom.id]).length;

    return {
      id: level.id,
      label: level.label,
      shortLabel: level.shortLabel,
      description: level.description,
      icon: level.icon,
      lessonCount: lessons.length,
      idiomCount: idioms.length,
      studiedCount: studiedInLevel,
      knownCount: knownInLevel,
      percent: toPercent(studiedInLevel, idioms.length),
    };
  });

  const focusLevel = levelSummaries.find((level) => level.studiedCount < level.idiomCount) ?? levelSummaries[0];
  const focusLesson =
    getLessons(focusLevel.id).find((lesson) =>
      getIdiomsForLesson(focusLevel.id, lesson.lesson_number).some((idiom) => !progress.studied[idiom.id])
    ) ?? getLessons(focusLevel.id)[0];
  const focusBookHref = `/book?level=${focusLevel.id}&lesson=${focusLesson?.lesson_number ?? 1}`;
  const focusLessonIdioms = focusLesson ? getIdiomsForLesson(focusLevel.id, focusLesson.lesson_number) : [];
  const focusLessonStudied = focusLessonIdioms.filter((idiom) => progress.studied[idiom.id]).length;
  const focusLessonPercent = toPercent(focusLessonStudied, focusLessonIdioms.length);
  const featuredIdiom =
    reviewedIdioms[0] ?? allIdioms.find((idiom) => !progress.studied[idiom.id]) ?? allIdioms[0];

  return (
    <main ref={scrollRef} className="h-full w-full overflow-x-hidden overflow-y-auto bg-[#f7f8fb] customScrollBarStyle">
      <div className="mx-auto flex min-h-full w-full max-w-[1540px] flex-col gap-6 p-6 max-tablet:p-4 max-mobile:p-3">
        <header className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <Link href="/" aria-label="Essential Idioms study dashboard" className="flex min-w-0 items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-gray-200 bg-[#f8fafc]">
              <img src="/icon/Direct Hit.svg" alt="" className="size-6" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-black text-gray-950">Essential Idioms</span>
              <span className="block truncate text-xs font-semibold text-gray-500">Study dashboard</span>
            </span>
          </Link>

          <nav className="flex items-center gap-2 max-tablet:hidden">
            <TopLink href="/book" label="Book" />
            <TopLink href="/cards" label="Cards" />
            <TopLink href="/story" label="Story" />
            <TopLink href="/archive" label="Archive" />
          </nav>

          <Link
            href={reviewedIdioms.length ? "/cards?mode=review" : "/book"}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-gray-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-primaryColor"
          >
            <Play className="size-4" />
            Study now
          </Link>
        </header>

        <section className="grid grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)] gap-5 max-desktop:grid-cols-1">
          <div className="grid min-h-[430px] grid-cols-[minmax(0,1fr)_250px] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm max-tablet:grid-cols-1">
            <div className="flex flex-col justify-between gap-8 p-7 max-tablet:p-5">
              <div className="flex flex-col gap-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black uppercase text-emerald-700">
                    <Target className="size-3.5" />
                    Personal study path
                  </span>
                  <span className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-bold text-gray-600">
                    {allIdioms.length} idioms across {totalLessons} lessons
                  </span>
                </div>

                <div className="max-w-3xl">
                  <h1 className="text-4xl font-black leading-tight text-gray-950 max-tablet:text-3xl max-mobile:text-2xl">
                    Build idioms you can actually use.
                  </h1>
                  <p className="mt-4 max-w-2xl text-base leading-8 text-gray-600 max-mobile:text-sm max-mobile:leading-7">
                    Start with a focused lesson, test yourself with recall, then lock the idioms into context with bilingual stories.
                    Each session has a clear next step, so study feels calm, steady, and measurable.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    href={focusBookHref}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-primaryColor px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-gray-950"
                  >
                    <BookOpen className="size-4" />
                    Continue lesson {focusLesson?.lesson_number ?? 1}
                  </Link>
                  <Link
                    href="/cards?mode=review"
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-black text-gray-900 shadow-sm transition hover:border-primaryColor hover:text-primaryColor"
                  >
                    <RotateCcw className="size-4" />
                    Review {reviewedIdioms.length} due
                  </Link>
                  <Link
                    href="/story"
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-black text-gray-900 shadow-sm transition hover:border-violet-300 hover:text-violet-700"
                  >
                    <Sparkles className="size-4" />
                    Make a story
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3 max-laptop:grid-cols-2 max-mobile:grid-cols-1">
                <MetricCard icon={<CheckCircle2 />} label="Studied" value={`${studiedCount}/${allIdioms.length}`} tone="text-emerald-700" />
                <MetricCard icon={<Trophy />} label="Known" value={knownCount} tone="text-amber-700" />
                <MetricCard icon={<Star />} label="Review queue" value={reviewedIdioms.length} tone="text-rose-700" />
                <MetricCard icon={<Bookmark />} label="Saved" value={bookmarkCount + storyCount} tone="text-sky-700" />
              </div>
            </div>

            <div className="relative min-h-[320px] border-l border-gray-200 bg-[#101827] p-5 text-white max-tablet:hidden">
              <div className="absolute inset-0 bg-[linear-gradient(150deg,rgba(92,107,236,0.28),rgba(16,24,39,0)_48%)]" />
              <div className="relative flex h-full flex-col justify-between gap-5">
                <div>
                  <div className="text-xs font-black uppercase tracking-wide text-sky-200">Book source</div>
                  <img
                    src="/book-cover.png"
                    alt="Essential Idioms in English book cover"
                    className="mt-4 h-[230px] w-full rounded-lg border border-white/15 object-cover object-top shadow-xl"
                  />
                </div>
                <div className="rounded-lg border border-white/15 bg-white/10 p-4 backdrop-blur">
                  <div className="text-sm font-black">Phrasal verbs and collocations</div>
                  <div className="mt-1 text-xs leading-5 text-white/70">Structured into three levels with bilingual practice tools.</div>
                </div>
              </div>
            </div>
          </div>

          <aside className="flex min-h-[430px] flex-col justify-between gap-5 rounded-lg border border-gray-200 bg-gray-950 p-5 text-white shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-sm font-black text-sky-200">
                  <Target className="size-4" />
                  Today&apos;s focus
                </div>
                <h2 className="mt-3 text-3xl font-black leading-tight max-mobile:text-2xl">
                  {focusLevel.label} · Lesson {focusLesson?.lesson_number ?? 1}
                </h2>
                <p className="mt-2 text-sm leading-6 text-white/65">{focusLevel.description}</p>
              </div>
              <ProgressDial value={completion} label="total" />
            </div>

            <div className="grid gap-3">
              <FocusStep
                active
                title={`Study ${focusLessonIdioms.length || 12} idioms`}
                body={`${focusLessonStudied}/${focusLessonIdioms.length || 12} already marked in this lesson`}
              />
              <FocusStep title="Test memory" body={reviewedIdioms.length ? `${reviewedIdioms.length} cards waiting in review` : "Use cards after the lesson"} />
              <FocusStep title="Use in context" body={storyCount ? `${storyCount} saved stories in archive` : "Create your first bilingual story"} />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between text-xs font-bold text-white/70">
                <span>Lesson progress</span>
                <span>{focusLessonPercent}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-lg bg-white/10">
                <div className="h-full rounded-lg bg-emerald-400" style={{ width: `${focusLessonPercent}%` }} />
              </div>
              <Link
                href={focusBookHref}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-black text-gray-950 transition hover:bg-sky-100"
              >
                Open today&apos;s lesson
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </aside>
        </section>

        <section className="grid grid-cols-4 gap-4 max-desktop:grid-cols-2 max-mobile:grid-cols-1">
          {MODE_CARDS.map((mode) => (
            <StudyModeCard key={mode.href} mode={mode} />
          ))}
        </section>

        <section className="grid grid-cols-[minmax(0,0.9fr)_minmax(360px,1.1fr)] gap-5 max-desktop:grid-cols-1">
          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-gray-950">Level Progress</h2>
                <p className="mt-1 text-sm text-gray-500">Each level stays visible so the next milestone is obvious.</p>
              </div>
              <Layers3 className="size-5 text-primaryColor" />
            </div>

            <div className="mt-5 grid gap-3">
              {levelSummaries.map((level) => (
                <LevelProgress key={level.id} level={level} />
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-gray-950">Memory Loop</h2>
                <p className="mt-1 text-sm text-gray-500">A repeatable rhythm for moving from recognition to confident use.</p>
              </div>
              <Brain className="size-5 text-primaryColor" />
            </div>

            <div className="mt-5 grid grid-cols-4 gap-3 max-laptop:grid-cols-2 max-mobile:grid-cols-1">
              {STUDY_LOOP.map((item, index) => (
                <StudyLoopStep key={item.title} index={index + 1} icon={item.icon} title={item.title} body={item.body} />
              ))}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-[minmax(0,1fr)_340px] gap-5 max-desktop:grid-cols-1">
          <FeaturedIdiom idiom={featuredIdiom} />

          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-black text-gray-950">
              <Search className="size-4 text-primaryColor" />
              Fast routes
            </div>
            <div className="mt-4 grid gap-3">
              <FastRoute href="/book" title="Search idioms" body="Find phrases, meanings, examples, and lessons." />
              <FastRoute href="/archive" title="Saved work" body={`${bookmarkCount} bookmarks and ${storyCount} stories saved.`} />
              <FastRoute href="/cards?mode=review" title="Weak cards" body={`${reviewedIdioms.length} idioms waiting for another pass.`} />
            </div>
            <div className="mt-5 rounded-lg border border-sky-100 bg-sky-50 p-4">
              <div className="text-sm font-black text-sky-900">{completion ? `${completion}% studied` : "Ready when you are"}</div>
              <p className="mt-1 text-sm leading-6 text-sky-800">
                {mastery ? `${mastery}% of all idioms are marked known.` : "Mark known cards after recall practice to build a clear mastery score."}
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function TopLink({ href, label }: { href: string; label: string }): React.ReactElement {
  return (
    <Link href={href} className="rounded-lg px-3 py-2 text-sm font-bold text-gray-600 transition hover:bg-gray-100 hover:text-gray-950">
      {label}
    </Link>
  );
}

function MetricCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  tone: string;
}): React.ReactElement {
  return (
    <div className="rounded-lg border border-gray-200 bg-[#fbfcfe] p-3">
      <div className={`mb-2 [&_svg]:size-4 ${tone}`}>{icon}</div>
      <div className="text-xl font-black text-gray-950">{value}</div>
      <div className="text-xs font-bold text-gray-500">{label}</div>
    </div>
  );
}

function ProgressDial({ value, label }: { value: number; label: string }): React.ReactElement {
  return (
    <div className="grid size-20 shrink-0 place-items-center rounded-lg border border-white/15 bg-white/10">
      <div
        className="grid size-14 place-items-center rounded-full"
        style={{ background: `conic-gradient(#34d399 ${value * 3.6}deg, rgba(255,255,255,0.16) 0deg)` }}
      >
        <div className="grid size-10 place-items-center rounded-full bg-gray-950 text-center">
          <span className="text-sm font-black leading-none">{value}%</span>
          <span className="text-[9px] font-bold uppercase leading-none text-white/50">{label}</span>
        </div>
      </div>
    </div>
  );
}

function FocusStep({ active = false, title, body }: { active?: boolean; title: string; body: string }): React.ReactElement {
  return (
    <div className={`rounded-lg border p-4 ${active ? "border-emerald-300 bg-emerald-400/10" : "border-white/10 bg-white/[0.06]"}`}>
      <div className="flex items-center gap-2 text-sm font-black">
        <span className={`size-2 rounded-full ${active ? "bg-emerald-300" : "bg-white/30"}`} />
        {title}
      </div>
      <p className="mt-1 text-sm leading-6 text-white/65">{body}</p>
    </div>
  );
}

function StudyModeCard({ mode }: { mode: ModeCard }): React.ReactElement {
  return (
    <Link
      href={mode.href}
      className="group flex min-h-[220px] flex-col justify-between rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primaryColor/50 hover:shadow-lg"
    >
      <div>
        <div className={`grid size-11 place-items-center rounded-lg bg-gradient-to-br ${mode.accent} text-white shadow-sm [&_svg]:size-5`}>
          {mode.icon}
        </div>
        <h2 className="mt-4 text-lg font-black text-gray-950">{mode.title}</h2>
        <p className="mt-2 text-sm leading-6 text-gray-600">{mode.description}</p>
      </div>
      <span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-primaryColor">
        {mode.cta}
        <ArrowRight className="size-4 transition group-hover:translate-x-1" />
      </span>
    </Link>
  );
}

function LevelProgress({ level }: { level: LevelSummary }): React.ReactElement {
  return (
    <div className="rounded-lg border border-gray-200 bg-[#fbfcfe] p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className={`grid size-10 shrink-0 place-items-center rounded-lg border ${LEVEL_ACCENTS[level.id]}`}>
            <img src={`/icon/${level.icon}`} alt="" className="size-6" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-black text-gray-950">{level.label}</h3>
              <span className="rounded-lg border border-gray-200 bg-white px-2 py-0.5 text-xs font-bold text-gray-500">{level.shortLabel}</span>
            </div>
            <p className="mt-1 text-sm leading-6 text-gray-600">{level.description}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-black text-gray-950">{level.percent}%</div>
          <div className="text-xs font-bold text-gray-500">studied</div>
        </div>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-lg bg-gray-200">
        <div className="h-full rounded-lg bg-primaryColor" style={{ width: `${level.percent}%` }} />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs font-bold text-gray-500">
        <span>{level.lessonCount} lessons</span>
        <span>{level.idiomCount} idioms</span>
        <span>{level.knownCount} known</span>
      </div>
    </div>
  );
}

function StudyLoopStep({
  index,
  icon,
  title,
  body,
}: {
  index: number;
  icon: React.ReactNode;
  title: string;
  body: string;
}): React.ReactElement {
  return (
    <div className="rounded-lg border border-gray-200 bg-[#fbfcfe] p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="grid size-10 place-items-center rounded-lg bg-white text-primaryColor shadow-sm [&_svg]:size-5">{icon}</div>
        <span className="text-xs font-black text-gray-400">0{index}</span>
      </div>
      <h3 className="mt-4 text-base font-black text-gray-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-gray-600">{body}</p>
    </div>
  );
}

function FeaturedIdiom({ idiom }: { idiom?: IdiomEntry }): React.ReactElement {
  if (!idiom) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-sm font-semibold text-gray-500">
        No idioms are available yet.
      </div>
    );
  }

  const example = idiom.examples?.[0];
  const bookHref = `/book?level=${idiom.level}&lesson=${idiom.lessonNumber}`;
  const cardsHref = `/cards?level=${idiom.level}&lesson=${idiom.lessonNumber}`;

  return (
    <article className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-sm font-black uppercase tracking-wide text-primaryColor">Try one now</div>
          <h2 className="mt-2 text-3xl font-black text-gray-950 max-mobile:text-2xl">{idiom.english_phrase}</h2>
          <p dir="rtl" className="mt-2 font-iranYekan text-lg text-gray-700">
            {idiom.persian_phrase_meaning}
          </p>
        </div>
        <span className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-black text-gray-600">
          {idiom.levelLabel} · Lesson {idiom.lessonNumber}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 max-tablet:grid-cols-1">
        <div className="rounded-lg border border-gray-200 bg-[#fbfcfe] p-4">
          <div className="text-xs font-black uppercase text-gray-500">Definition</div>
          <p className="mt-2 text-sm leading-7 text-gray-800">{idiom.english_definition}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-[#fbfcfe] p-4">
          <div className="text-xs font-black uppercase text-gray-500">Example</div>
          <p className="mt-2 text-sm font-semibold leading-7 text-gray-900">{example?.english_text ?? "Open the lesson to see examples."}</p>
          {example?.persian_meaning ? (
            <p dir="rtl" className="mt-2 font-iranYekan text-sm leading-7 text-gray-700">
              {example.persian_meaning}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href={bookHref}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-950 px-4 py-2 text-sm font-black text-white transition hover:bg-primaryColor"
        >
          <BookOpen className="size-4" />
          Study in book
        </Link>
        <Link
          href={cardsHref}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-black text-gray-900 transition hover:border-primaryColor hover:text-primaryColor"
        >
          <NotebookTabs className="size-4" />
          Practice card
        </Link>
      </div>
    </article>
  );
}

function FastRoute({ href, title, body }: { href: string; title: string; body: string }): React.ReactElement {
  return (
    <Link href={href} className="group rounded-lg border border-gray-200 bg-[#fbfcfe] p-4 transition hover:border-primaryColor/50 hover:bg-white">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-black text-gray-950">{title}</h3>
        <ArrowRight className="size-4 text-gray-400 transition group-hover:translate-x-1 group-hover:text-primaryColor" />
      </div>
      <p className="mt-1 text-sm leading-6 text-gray-600">{body}</p>
    </Link>
  );
}

function toPercent(value: number, total: number): number {
  if (!total) {
    return 0;
  }

  return Math.min(100, Math.round((value / total) * 100));
}
