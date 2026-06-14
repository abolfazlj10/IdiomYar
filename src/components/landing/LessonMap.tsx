import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { LevelId } from "@/types/types";

type LessonLevel = {
  id: LevelId;
  label: string;
  shortLabel: string;
  description: string;
  idioms: number;
  lessons: number;
  order: number;
  icon: LucideIcon;
  accent: "amber" | "sky" | "coral";
  marker: string;
  soft: string;
};

type LessonMapProps = {
  levels: LessonLevel[];
  numberFormatter: Intl.NumberFormat;
};

export function LessonMap({ levels, numberFormatter }: LessonMapProps): React.ReactElement {
  const totalIdioms = levels.reduce((total, level) => total + level.idioms, 0);
  const totalLessons = levels.reduce((total, level) => total + level.lessons, 0);

  return (
    <section
      className="grid min-w-0 gap-6 rounded-lg bg-[#0B1020] px-4 py-6 text-white shadow-[0_18px_52px_rgba(11,16,32,0.16)] mobile:px-6 tablet:px-8 laptop:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)] laptop:items-center laptop:p-8"
      aria-labelledby="lesson-map-heading"
    >
      <div className="min-w-0">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-[#62C7FF]">Lesson map</p>
        <h2 id="lesson-map-heading" className="mt-3 max-w-2xl text-3xl font-black leading-tight tracking-[0] mobile:text-4xl">
          A clear route from first recall to fluent nuance.
        </h2>
        <p className="mt-4 max-w-xl text-sm leading-7 text-white/72">
          The levels are pulled from the same lesson data as the study screens, so the home page always reflects the real path.
        </p>

        <div className="mt-6 grid max-w-xl grid-cols-2 gap-3">
          <div className="rounded-lg border border-white/12 bg-white/8 p-4">
            <dt className="text-xs font-black uppercase tracking-[0.12em] text-white/55">Phrases</dt>
            <dd className="mt-2 text-3xl font-black tabular-nums tracking-[0] text-[#FFD84D]">{numberFormatter.format(totalIdioms)}</dd>
          </div>
          <div className="rounded-lg border border-white/12 bg-white/8 p-4">
            <dt className="text-xs font-black uppercase tracking-[0.12em] text-white/55">Lessons</dt>
            <dd className="mt-2 text-3xl font-black tabular-nums tracking-[0] text-[#62C7FF]">{numberFormatter.format(totalLessons)}</dd>
          </div>
        </div>
      </div>

      <div className="relative min-w-0">
        <div className="grid min-w-0 gap-3 tablet:grid-cols-3">
          {levels.map((level) => {
            const Icon = level.icon;

            return (
              <Link
                key={level.id}
                href={`/book?level=${level.id}`}
                className="group min-w-0 rounded-lg border border-white/12 bg-white/[0.06] p-4 shadow-sm transition-[background-color,border-color,transform] duration-150 hover:-translate-y-0.5 hover:border-white/26 hover:bg-white/[0.1] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#62C7FF]/30"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className={`flex size-12 shrink-0 items-center justify-center rounded-lg border ${level.soft}`}>
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="text-sm font-black tabular-nums tracking-[0] text-white/55">0{level.order}</span>
                </div>
                <h3 className="mt-5 text-xl font-black tracking-[0]">{level.label}</h3>
                <p className="mt-2 min-h-[60px] text-sm leading-6 text-white/68">{level.description}</p>
                <div className="mt-5 flex items-center gap-2" aria-hidden="true">
                  <span className={`size-3 rounded ${level.marker}`} />
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/12">
                    <span className={`block h-full rounded-full ${level.marker}`} style={{ width: `${58 + level.order * 11}%` }} />
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3 text-sm font-black tracking-[0] text-white/86">
                  <span>{numberFormatter.format(level.idioms)} idioms</span>
                  <span>{numberFormatter.format(level.lessons)} lessons</span>
                </div>
                <span className="mt-5 inline-flex items-center gap-1 text-sm font-black text-white transition-colors duration-150 group-hover:text-[#FFD84D]">
                  Open lessons
                  <ArrowRight className="size-4 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
