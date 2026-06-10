import Link from "next/link";
import {
  ArrowRight,
  Brain,
  Compass,
  Layers3,
  PenLine,
  RefreshCcw,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { HeroOrbit } from "@/components/landing/HeroOrbit";
import { HomeIdiomSearch, type HomeIdiomSearchItem } from "@/components/landing/HomeIdiomSearch";
import { IdiomShowcase } from "@/components/landing/IdiomShowcase";
import { LessonMap } from "@/components/landing/LessonMap";
import { StudyModeRail } from "@/components/landing/StudyModeRail";
import { getAllIdioms, getIdiomsForLesson, getLessons, LEVELS } from "@/lib/idioms";
import type { LevelId } from "@/types/types";

const numberFormatter = new Intl.NumberFormat("en-US");

const githubProfileUrl = "https://github.com/abolfazlj10";
const githubRepoUrl = "https://github.com/abolfazlj10/essential-idioms-in-english";
const githubAvatarUrl = `${githubProfileUrl}.png?size=96`;

const allIdioms = getAllIdioms();
const idiomCount = allIdioms.length;
const lessonCount = LEVELS.reduce((total, level) => total + getLessons(level.id).length, 0);
const homeSearchItems = allIdioms.map((idiom) => ({
  id: idiom.id,
  englishPhrase: idiom.english_phrase,
  persianPhrase: idiom.persian_phrase_meaning ?? null,
  level: idiom.level,
  levelLabel: idiom.levelLabel,
  lessonNumber: idiom.lessonNumber,
  href: `/book?level=${idiom.level}&lesson=${idiom.lessonNumber}&idiom=${encodeURIComponent(idiom.id)}`,
  searchText: [
    idiom.english_phrase,
    idiom.persian_phrase_meaning,
    idiom.english_definition,
    idiom.persian_definition_meaning,
    idiom.english_explanation,
    idiom.persian_explanation_meaning,
    idiom.levelLabel,
    `lesson ${idiom.lessonNumber}`,
    String(idiom.lessonNumber),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase(),
})) satisfies HomeIdiomSearchItem[];

const featuredIdiom =
  getIdiomsForLesson("intermediate", 14).find((idiom) => idiom.english_phrase === "cut and dried") ?? allIdioms[0]!;

const sampleIdioms = [
  featuredIdiom,
  getIdiomsForLesson("elementary", 1)[0] ?? allIdioms[0]!,
  getIdiomsForLesson("advanced", 28)[0] ?? allIdioms[0]!,
];

const navItems = [
  { href: "/cards", label: "Cards" },
  { href: "/book", label: "Lessons" },
  { href: "/story", label: "Stories" },
  { href: "/archive", label: "Review" },
];

const studyModes = [
  {
    icon: Layers3,
    title: "Flash Cards",
    description: "Fast recall sessions for the phrases that need another pass.",
    href: "/cards",
    cta: "Practice now",
    accent: "violet",
  },
  {
    icon: Compass,
    title: "Lessons",
    description: "A guided path through definitions, examples, and Persian meaning.",
    href: "/book",
    cta: "Open map",
    accent: "sky",
  },
  {
    icon: PenLine,
    title: "Story Builder",
    description: "Turn selected idioms into a short scene you can actually remember.",
    href: "/story",
    cta: "Build a story",
    accent: "coral",
  },
  {
    icon: RefreshCcw,
    title: "Review",
    description: "Return to saved phrases and keep your next session focused.",
    href: "/archive",
    cta: "Review saved",
    accent: "amber",
  },
] satisfies Array<{
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  cta: string;
  accent: "violet" | "sky" | "coral" | "amber";
}>;

const levelVisuals = {
  elementary: {
    icon: Target,
    accent: "amber",
    marker: "bg-[#FFD84D]",
    soft: "bg-[#FFF6CC] text-[#5F4600] border-[#F5D871]",
  },
  intermediate: {
    icon: Brain,
    accent: "sky",
    marker: "bg-[#62C7FF]",
    soft: "bg-[#E9F8FF] text-[#064B6D] border-[#B7E7FF]",
  },
  advanced: {
    icon: Zap,
    accent: "coral",
    marker: "bg-[#FF6542]",
    soft: "bg-[#FFF0EB] text-[#8A2D18] border-[#FFC7B8]",
  },
} satisfies Record<
  LevelId,
  {
    icon: LucideIcon;
    accent: "amber" | "sky" | "coral";
    marker: string;
    soft: string;
  }
>;

const levelSummaries = LEVELS.map((level, index) => ({
  id: level.id,
  label: level.label,
  shortLabel: level.shortLabel,
  description: level.description,
  idioms: getAllIdioms(level.id).length,
  lessons: getLessons(level.id).length,
  order: index + 1,
  ...levelVisuals[level.id],
}));

export default function Home(): React.ReactElement {
  return (
    <>
      <LandingHeader
        navItems={navItems}
        githubRepoUrl={githubRepoUrl}
        githubProfileUrl={githubProfileUrl}
        githubAvatarUrl={githubAvatarUrl}
        searchSlot={<HomeIdiomSearch items={homeSearchItems} variant="navbar" />}
      />

      <main className="flex min-w-0 flex-1 flex-col gap-10 pb-12 pt-4 tablet:gap-12 tablet:pt-5 laptop:gap-11">
        <section
          className="grid min-w-0 gap-7 overflow-hidden rounded-lg border border-[#E4DDD2] bg-[#FBFAF7] px-4 py-6 shadow-[0_18px_56px_rgba(11,16,32,0.07)] mobile:px-6 tablet:px-8 laptop:min-h-[460px] laptop:grid-cols-[minmax(0,0.92fr)_minmax(420px,1fr)] laptop:items-center laptop:px-10 laptop:py-8"
          aria-labelledby="hero-heading"
        >
          <div className="min-w-0">
            <p className="inline-flex w-fit items-center gap-2 rounded-lg border border-[#DFD8CC] bg-white/80 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-[#5B2EFF] shadow-sm">
              <Sparkles className="size-3.5" aria-hidden="true" />
              Bilingual idiom practice
            </p>
            <h1
              id="hero-heading"
              className="mt-5 max-w-3xl text-balance text-4xl font-black leading-[1.04] tracking-[0] text-[#0B1020] mobile:text-5xl tablet:text-6xl"
            >
              Practice idioms until they click.
            </h1>
            <p className="mt-5 max-w-2xl text-pretty text-base leading-8 text-[#4E5668] mobile:text-lg">
              Practice with flash cards, understand each phrase in Persian, and turn hard idioms into stories you remember.
            </p>

            <div className="mt-7 flex flex-col gap-3 mobile:flex-row">
              <Link
                href="/cards"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#0B1020] px-5 py-3 text-sm font-black text-white shadow-[0_16px_34px_rgba(11,16,32,0.2)] transition-[background-color,transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:bg-[#1C2442] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#5B2EFF]/30"
              >
                Start practicing
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link
                href="/book"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-[#D8D1C6] bg-white px-5 py-3 text-sm font-black text-[#0B1020] shadow-sm transition-[border-color,background-color,transform] duration-150 hover:-translate-y-0.5 hover:border-[#5B2EFF]/40 hover:bg-[#F4F1FF] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#5B2EFF]/20"
              >
                Explore lessons
              </Link>
            </div>

            <dl className="mt-8 grid max-w-2xl grid-cols-3 gap-2 mobile:gap-3">
              <HeroMetric value={numberFormatter.format(idiomCount)} label="Idioms" tone="text-[#5B2EFF]" />
              <HeroMetric value={numberFormatter.format(lessonCount)} label="Lessons" tone="text-[#0677A8]" />
              <HeroMetric value={numberFormatter.format(studyModes.length)} label="Modes" tone="text-[#B43A1D]" />
            </dl>
          </div>

          <HeroOrbit featuredIdiom={featuredIdiom} idiomCount={idiomCount} lessonCount={lessonCount} />
        </section>

        <StudyModeRail modes={studyModes} />
        <LessonMap levels={levelSummaries} numberFormatter={numberFormatter} />
        <IdiomShowcase featuredIdiom={featuredIdiom} sampleIdioms={sampleIdioms} />
      </main>
    </>
  );
}

function HeroMetric({ value, label, tone }: { value: string; label: string; tone: string }): React.ReactElement {
  return (
    <div className="min-w-0 rounded-lg border border-[#E2DCD2] bg-white/80 p-3 shadow-sm backdrop-blur mobile:p-4">
      <dt className="text-xs font-bold tracking-[0] text-[#6C7280] mobile:text-sm">{label}</dt>
      <dd className={`mt-2 text-2xl font-black tabular-nums tracking-[0] mobile:text-3xl ${tone}`}>{value}</dd>
    </div>
  );
}
