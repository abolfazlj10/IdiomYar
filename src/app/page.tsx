"use client";

import { BookOpen, Library, NotebookTabs, Sparkles } from "lucide-react";
import QuickAccessCard from "@/components/quickAccessCard";
import { useScrollFade } from "@/hooks/useScrollFade";

const quickAccess = [
  {
    icon: <Sparkles />,
    title: "Story Creator",
    description: "Choose idioms and generate a bilingual story for contextual practice.",
    route: "/story",
  },
  {
    icon: <NotebookTabs />,
    title: "Flash Cards",
    description: "Reveal meanings, mark known cards, and build a focused review deck.",
    route: "/cards",
  },
  {
    icon: <BookOpen />,
    title: "Book Study",
    description: "Study lessons with definitions, Persian meanings, examples, and bookmarks.",
    route: "/book",
  },
  {
    icon: <Library />,
    title: "Archive & Review",
    description: "Return to saved stories, bookmarked idioms, and cards that need review.",
    route: "/archive",
  },
];

export default function Home(): React.ReactElement {
  return (
    <main ref={useScrollFade()} className="flex h-full w-full min-w-0 flex-col gap-8 overflow-x-hidden overflow-y-auto p-7 max-mobile:p-4 customScrollBarStyle">
      <section className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(320px,520px)] items-center gap-8 max-[1400px]:grid-cols-1">
        <div className="flex flex-col gap-5">
          <h1 className="max-w-4xl text-5xl font-black leading-tight max-tablet:text-3xl">
            Learn essential idioms with <span className="bg-gradient-to-r from-[#4e5996] to-primaryColor bg-clip-text text-transparent">AI</span>
          </h1>
          <p className="max-w-3xl text-base leading-8 text-gray-700 max-tablet:text-sm">
            A focused study workspace for mastering English idioms through structured lessons, flash-card practice, AI story generation,
            and a personal archive for everything you want to revisit.
          </p>
          <div className="grid max-w-2xl grid-cols-3 gap-3 max-mobile:grid-cols-1">
            <Metric value="465" label="Idioms" />
            <Metric value="39" label="Lessons" />
            <Metric value="4" label="Study modes" />
          </div>
        </div>

        <div className="relative min-h-[260px] overflow-hidden rounded-lg border-2 border-primaryColor bg-bgColor/40 shadow-xl max-[1400px]:hidden">
          <img
            className="h-full min-h-[320px] w-full object-cover"
            src="/Screenshot 2025-06-16 103128.png"
            alt="Essential Idioms app preview"
          />
          <div className="absolute bottom-4 left-4 rounded-lg bg-white/90 px-4 py-3 shadow">
            <div className="text-sm font-black text-gray-900">Study, practice, review</div>
            <div className="text-xs text-gray-500">One flow for every lesson</div>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-black">Quick Access</h2>
          <p className="text-sm text-gray-500">Open one of the four complete study modes.</p>
        </div>
        <div className="grid min-w-0 grid-cols-[repeat(4,minmax(0,1fr))] gap-4 max-laptop:grid-cols-2 max-mobile:grid-cols-1">
          {quickAccess.map((item) => (
            <QuickAccessCard key={item.route} route={item.route} icon={item.icon} title={item.title} description={item.description} />
          ))}
        </div>
      </section>
    </main>
  );
}

function Metric({ value, label }: { value: string; label: string }): React.ReactElement {
  return (
    <div className="rounded-lg border bg-white p-3 shadow-sm">
      <div className="text-2xl font-black text-primaryColor">{value}</div>
      <div className="text-xs font-semibold text-gray-500">{label}</div>
    </div>
  );
}
