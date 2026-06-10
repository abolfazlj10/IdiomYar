import Link from "next/link";
import { ArrowRight, Languages, MessageCircle, Quote } from "lucide-react";
import type { IdiomEntry } from "@/lib/idioms";

type IdiomShowcaseProps = {
  featuredIdiom: IdiomEntry;
  sampleIdioms: IdiomEntry[];
};

export function IdiomShowcase({ featuredIdiom, sampleIdioms }: IdiomShowcaseProps): React.ReactElement {
  const relatedIdioms = sampleIdioms.filter((idiom) => idiom.id !== featuredIdiom.id).slice(0, 2);
  const featuredExample = featuredIdiom.examples?.[0];

  return (
    <section className="min-w-0" aria-labelledby="idiom-preview-heading">
      <div className="flex min-w-0 flex-col gap-3 tablet:flex-row tablet:items-end tablet:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#B43A1D]">Live idiom preview</p>
          <h2 id="idiom-preview-heading" className="mt-2 text-2xl font-black leading-tight tracking-[0] text-[#0B1020] mobile:text-3xl">
            English context and Persian meaning in one glance.
          </h2>
        </div>
        <Link
          href={`/book?level=${featuredIdiom.level}&lesson=${featuredIdiom.lessonNumber}`}
          className="inline-flex w-fit items-center gap-2 rounded-lg border border-[#D8D1C6] bg-white px-4 py-2.5 text-sm font-black text-[#0B1020] shadow-sm transition-[border-color,background-color,transform] duration-150 hover:-translate-y-0.5 hover:border-[#FF6542]/50 hover:bg-[#FFF7F3] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#FF6542]/20"
        >
          Open this lesson
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>

      <div className="mt-6 grid min-w-0 gap-4 laptop:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
        <article className="min-w-0 overflow-hidden rounded-lg border border-[#E4DDD2] bg-white p-5 shadow-sm mobile:p-6 tablet:p-7">
          <div className="grid min-w-0 gap-5 tablet:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] tablet:items-start">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-lg bg-[#F4F1FF] px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-[#5B2EFF]">
                  <Languages className="size-3.5" aria-hidden="true" />
                  {featuredIdiom.levelLabel}
                </span>
                <span className="rounded-lg bg-[#F7F5F2] px-3 py-1 text-xs font-black tracking-[0] text-[#6C7280]">
                  Lesson {featuredIdiom.lessonNumber}
                </span>
              </div>
              <h3 className="mt-5 text-3xl font-black leading-tight tracking-[0] text-[#0B1020] mobile:text-4xl">{featuredIdiom.english_phrase}</h3>
              <p className="mt-4 text-base leading-8 text-[#4E5668]">{featuredIdiom.english_definition ?? featuredIdiom.english_explanation}</p>
            </div>

            <div className="min-w-0 space-y-3">
              <div className="rounded-lg border border-[#E4DDD2] bg-[#FBFAF7] p-4">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-[#B43A1D]">Persian meaning</p>
                <p className="mt-2 text-right font-iranYekan text-base leading-8 text-[#0B1020]" dir="rtl">
                  {featuredIdiom.persian_phrase_meaning ?? featuredIdiom.persian_definition_meaning}
                </p>
              </div>

              {featuredExample ? (
                <div className="rounded-lg border border-[#E4DDD2] bg-white p-4">
                  <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-[#0677A8]">
                    <Quote className="size-3.5" aria-hidden="true" />
                    Example
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[#0B1020]">{featuredExample.english_text}</p>
                  <p className="mt-3 text-right font-iranYekan text-sm leading-7 text-[#4E5668]" dir="rtl">
                    {featuredExample.persian_meaning}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </article>

        <div className="grid min-w-0 gap-3">
          {relatedIdioms.map((idiom) => (
            <article key={idiom.id} className="min-w-0 rounded-lg border border-[#E4DDD2] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#FFF0EB] text-[#B43A1D]">
                  <MessageCircle className="size-5" aria-hidden="true" />
                </span>
                <span className="text-xs font-black tracking-[0] text-[#6C7280]">Lesson {idiom.lessonNumber}</span>
              </div>
              <h3 className="mt-4 text-xl font-black leading-tight tracking-[0] text-[#0B1020]">{idiom.english_phrase}</h3>
              <p className="mt-3 text-sm leading-6 text-[#5C6473]">{idiom.english_definition ?? idiom.english_explanation}</p>
              <p className="mt-4 rounded-lg bg-[#F7F5F2] p-3 text-right font-iranYekan text-sm leading-7 text-[#0B1020]" dir="rtl">
                {idiom.persian_phrase_meaning ?? idiom.persian_definition_meaning}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
