import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Github,
  Library,
  NotebookTabs,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import QuickAccessCard from "@/components/quickAccessCard";
import { Button } from "@/components/ui/button";
import { getAllIdioms, getLessons, LEVELS } from "@/lib/idioms";

const numberFormatter = new Intl.NumberFormat("en-US");

const githubProfileUrl = "https://github.com/abolfazlj10";
const githubRepoUrl = "https://github.com/abolfazlj10/essential-idioms-in-english";
const githubAvatarUrl = `${githubProfileUrl}.png?size=96`;

const idiomCount = getAllIdioms().length;
const lessonCount = LEVELS.reduce((total, level) => total + getLessons(level.id).length, 0);

const quickAccess = [
  {
    icon: <NotebookTabs />,
    title: "Flash Cards",
    description: "A focused card session for quick recall.",
    route: "/cards",
    cta: "Start practice",
    meta: "Start here",
    tone: "blue" as const,
    featured: true,
  },
  {
    icon: <BookOpen />,
    title: "Book Study",
    description: "Read the lesson only when you need context.",
    route: "/book",
    cta: "Read lessons",
    meta: `${numberFormatter.format(lessonCount)} lessons`,
    tone: "emerald" as const,
  },
  {
    icon: <Sparkles />,
    title: "Story Creator",
    description: "Use selected idioms in a short bilingual scene.",
    route: "/story",
    cta: "Create story",
    meta: "Apply",
    tone: "amber" as const,
  },
  {
    icon: <Library />,
    title: "Archive & Review",
    description: "Return to saved items and review them later.",
    route: "/archive",
    cta: "Review saved",
    meta: "Saved",
    tone: "slate" as const,
  },
];

const metrics = [
  { value: numberFormatter.format(idiomCount), label: "Idioms" },
  { value: numberFormatter.format(lessonCount), label: "Lessons" },
  { value: numberFormatter.format(quickAccess.length), label: "Modes" },
];

const dailyLoop = [
  {
    title: "Practice",
    description: "Start with a small flash-card round.",
    icon: NotebookTabs,
  },
  {
    title: "Clarify",
    description: "Open the book for anything unclear.",
    icon: BookOpen,
  },
  {
    title: "Save",
    description: "Keep difficult idioms for another pass.",
    icon: CheckCircle2,
  },
];

export default function Home(): React.ReactElement {
  return (
    <main className="flex w-full min-w-0 flex-1 flex-col gap-10 pb-10 pt-4 mobile:gap-12 tablet:pt-8">
      <div className="flex min-w-0 justify-end">
        <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-slate-200 bg-white/90 p-1 shadow-sm backdrop-blur">
          <a
            href={githubProfileUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="Open Abolfazl's GitHub profile"
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-full transition-transform duration-150 hover:scale-105 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/35"
          >
            <img
              src={githubAvatarUrl}
              alt="Abolfazl GitHub profile"
              className="size-11 rounded-full border border-slate-200 object-cover ring-2 ring-white"
            />
          </a>
          <Button
            asChild
            size="sm"
            className="rounded-full bg-slate-950 px-4 text-white shadow-none hover:bg-slate-800 focus-visible:ring-slate-400/40"
          >
            <a href={githubRepoUrl} target="_blank" rel="noreferrer" aria-label="Open the project repository on GitHub">
              <Github className="size-4" aria-hidden="true" />
              GitHub
              <ExternalLink className="size-3.5" aria-hidden="true" />
            </a>
          </Button>
        </div>
      </div>

      <section className="grid min-w-0 gap-8 laptop:grid-cols-[minmax(0,1fr)_340px] laptop:items-center">
        <div className="min-w-0 py-2 tablet:py-6">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Essential Idioms</p>
          <h1 className="mt-4 max-w-3xl text-balance text-4xl font-black leading-[1.08] tracking-tight text-slate-950 mobile:text-5xl tablet:text-6xl">
            A quieter way to remember idioms.
          </h1>
          <p className="mt-5 max-w-2xl text-pretty text-base leading-8 text-slate-600 mobile:text-lg">
            Practice a small set, read only when you need context, and keep the hard ones for later.
          </p>

          <div className="mt-7 flex flex-col gap-3 mobile:flex-row">
            <Button asChild size="lg" className="mobile:w-auto">
              <Link href="/cards">
                Start with cards
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="mobile:w-auto">
              <Link href="/book">Browse lessons</Link>
            </Button>
          </div>

          <dl className="mt-9 grid max-w-xl grid-cols-3 gap-6 border-y border-slate-200 py-5">
            {metrics.map((item) => (
              <Stat key={item.label} value={item.value} label={item.label} />
            ))}
          </dl>
        </div>

        <aside className="min-w-0 rounded-lg border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="daily-loop-heading">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Today</p>
              <h2 id="daily-loop-heading" className="mt-1 text-xl font-black tracking-tight text-slate-950">
                Simple study loop
              </h2>
            </div>
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-primary">
              <Clock3 className="size-5" aria-hidden="true" />
            </span>
          </div>

          <div className="mt-6 space-y-5">
            {dailyLoop.map((item) => (
              <LoopItem key={item.title} {...item} />
            ))}
          </div>
        </aside>
      </section>

      <section className="flex min-w-0 flex-col gap-5" aria-labelledby="study-modes-heading">
        <div className="flex flex-col gap-2 mobile:flex-row mobile:items-end mobile:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Study modes</p>
            <h2 id="study-modes-heading" className="mt-2 text-2xl font-black tracking-tight text-slate-950 mobile:text-3xl">
              Choose one path.
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
              Start with recall, add context when needed, then review anything worth keeping.
            </p>
          </div>
          <Button asChild variant="ghost" size="sm" className="w-fit text-primary hover:text-primary">
            <Link href="/cards">
              Resume practice
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
        <div className="grid min-w-0 grid-cols-1 gap-4 tablet:grid-cols-2 laptop:grid-cols-4">
          {quickAccess.map((item) => (
            <QuickAccessCard
              key={item.route}
              route={item.route}
              icon={item.icon}
              title={item.title}
              description={item.description}
              cta={item.cta}
              meta={item.meta}
              featured={item.featured}
              tone={item.tone}
            />
          ))}
        </div>
      </section>
    </main>
  );
}

function Stat({ value, label }: { value: string; label: string }): React.ReactElement {
  return (
    <div className="min-w-0">
      <dt className="text-sm font-semibold text-slate-500">{label}</dt>
      <dd className="mt-1 text-2xl font-black tabular-nums tracking-tight text-slate-950">{value}</dd>
    </div>
  );
}

function LoopItem({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
}): React.ReactElement {
  return (
    <div className="flex min-w-0 gap-3">
      <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <h3 className="text-sm font-black tracking-tight text-slate-950">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
      </div>
    </div>
  );
}
