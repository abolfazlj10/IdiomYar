import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type StudyMode = {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  cta: string;
  accent: "violet" | "sky" | "coral" | "amber";
};

type StudyModeRailProps = {
  modes: StudyMode[];
};

const accentStyles = {
  violet: {
    icon: "bg-[#F4F1FF] text-[#5B2EFF]",
    marker: "bg-[#5B2EFF]",
    hover: "hover:border-[#5B2EFF]/45 hover:bg-[#FBFAFF]",
  },
  sky: {
    icon: "bg-[#E9F8FF] text-[#0677A8]",
    marker: "bg-[#62C7FF]",
    hover: "hover:border-[#62C7FF]/70 hover:bg-[#F6FCFF]",
  },
  coral: {
    icon: "bg-[#FFF0EB] text-[#B43A1D]",
    marker: "bg-[#FF6542]",
    hover: "hover:border-[#FF6542]/45 hover:bg-[#FFF9F7]",
  },
  amber: {
    icon: "bg-[#FFF6CC] text-[#6B4F00]",
    marker: "bg-[#FFD84D]",
    hover: "hover:border-[#FFD84D]/90 hover:bg-[#FFFDF2]",
  },
};

export function StudyModeRail({ modes }: StudyModeRailProps): React.ReactElement {
  return (
    <section className="min-w-0" aria-labelledby="study-modes-heading">
      <div className="flex min-w-0 flex-col gap-3 tablet:flex-row tablet:items-end tablet:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#5B2EFF]">Study modes</p>
          <h2 id="study-modes-heading" className="mt-2 text-2xl font-black leading-tight tracking-[0] text-[#0B1020] mobile:text-3xl">
            Four ways to make each phrase usable.
          </h2>
        </div>
        <p className="max-w-xl text-sm leading-7 text-[#5C6473] mobile:text-base">
          Start with quick recall, move through lessons, turn phrases into scenes, then review only what needs another pass.
        </p>
      </div>

      <ol className="mt-5 grid min-w-0 grid-cols-1 gap-3 tablet:grid-cols-2 laptop:grid-cols-4">
        {modes.map((mode, index) => {
          const styles = accentStyles[mode.accent];
          const Icon = mode.icon;

          return (
            <li key={mode.href} className="relative min-w-0">
              <Link
                href={mode.href}
                className={`group flex min-h-[184px] min-w-0 flex-col rounded-lg border border-[#E4DDD2] bg-white p-4 shadow-sm transition-[background-color,border-color,box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#5B2EFF]/25 ${styles.hover}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className={`flex size-11 shrink-0 items-center justify-center rounded-lg ${styles.icon}`}>
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="text-sm font-black tabular-nums tracking-[0] text-[#6C7280]">0{index + 1}</span>
                </div>
                <span className={`mt-4 h-1.5 w-12 rounded-full ${styles.marker}`} aria-hidden="true" />
                <h3 className="mt-3 text-lg font-black tracking-[0] text-[#0B1020]">{mode.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#5C6473]">{mode.description}</p>
                <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-black tracking-[0] text-[#0B1020] transition-colors duration-150 group-hover:text-[#5B2EFF]">
                  {mode.cta}
                  <ArrowRight className="size-4 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
