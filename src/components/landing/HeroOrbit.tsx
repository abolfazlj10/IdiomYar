import Link from "next/link";
import { ArrowRight, CheckCircle2, Eye, Languages, MessageCircle, Sparkles } from "lucide-react";
import type { IdiomEntry } from "@/lib/idioms";

type HeroOrbitProps = {
  featuredIdiom: IdiomEntry;
  idiomCount: number;
  lessonCount: number;
};

export function HeroOrbit({ featuredIdiom, idiomCount, lessonCount }: HeroOrbitProps): React.ReactElement {
  const persianMeaning = featuredIdiom.persian_phrase_meaning ?? featuredIdiom.persian_definition_meaning ?? "معنی فارسی آماده است.";
  const englishDefinition = featuredIdiom.english_definition ?? featuredIdiom.english_explanation ?? "A phrase ready for focused recall.";

  return (
    <aside
      className="min-w-0 rounded-lg border border-[#DCD5C9] bg-white p-3 shadow-[0_22px_54px_rgba(11,16,32,0.10)] mobile:p-4"
      aria-label="Flash card study preview"
    >
      <div className="flex min-w-0 items-center justify-between gap-3 border-b border-[#EEE8DE] pb-3">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#5B2EFF]">Active practice</p>
          <p className="mt-1 truncate text-sm font-bold text-[#6C7280]">
            {featuredIdiom.levelLabel} - Lesson {featuredIdiom.lessonNumber}
          </p>
        </div>
        <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-[#0B1020] text-white">
          <Languages className="size-5" aria-hidden="true" />
        </span>
      </div>

      <div className="mt-3 rounded-lg border border-[#E7E0D5] bg-[#FBFAF7] p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-lg bg-[#F4F1FF] px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-[#5B2EFF]">
            <Sparkles className="size-3.5" aria-hidden="true" />
            Today&apos;s phrase
          </span>
          <span className="rounded-lg bg-white px-3 py-1 text-xs font-black text-[#6C7280] shadow-sm">Card 1 of 12</span>
        </div>

        <p className="mt-5 text-xs font-black uppercase tracking-[0.14em] text-[#6C7280]">English idiom</p>
        <h2 className="mt-2 text-3xl font-black leading-tight tracking-[0] text-[#0B1020]">{featuredIdiom.english_phrase}</h2>
        <p className="mt-3 text-sm leading-7 text-[#4E5668]">{englishDefinition}</p>

        <div className="mt-4 rounded-lg border border-[#E4DDD2] bg-white p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-[#B43A1D]">
              <MessageCircle className="size-3.5" aria-hidden="true" />
              Persian meaning
            </p>
            <CheckCircle2 className="size-4 text-[#0677A8]" aria-hidden="true" />
          </div>
          <p className="mt-2 text-right font-iranYekan text-base leading-8 text-[#0B1020]" dir="rtl">
            {persianMeaning}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-[#6C7280]">
        <span>{idiomCount} idioms</span>
        <span>{lessonCount} lessons</span>
        <span>72% recall</span>
      </div>

      <div className="mt-2 rounded-full bg-[#ECE7DD]" aria-hidden="true">
        <span className="block h-2 w-[72%] rounded-full bg-[#5B2EFF]" />
      </div>

      <div className="mt-4 grid grid-cols-[1fr_auto] gap-3">
        <Link
          href="/cards"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#0B1020] px-4 py-2.5 text-sm font-black text-white shadow-sm transition-[background-color,transform] duration-150 hover:-translate-y-0.5 hover:bg-[#1C2442] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#5B2EFF]/30"
        >
          Start cards
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
        <Link
          href={`/book?level=${featuredIdiom.level}&lesson=${featuredIdiom.lessonNumber}`}
          className="inline-flex size-11 items-center justify-center rounded-lg border border-[#D8D1C6] bg-white text-[#0B1020] shadow-sm transition-[border-color,background-color,transform] duration-150 hover:-translate-y-0.5 hover:border-[#5B2EFF]/40 hover:bg-[#F4F1FF] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#5B2EFF]/20"
          aria-label="Open the featured lesson"
        >
          <Eye className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </aside>
  );
}
