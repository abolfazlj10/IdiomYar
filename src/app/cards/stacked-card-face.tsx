"use client";

import type * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { IdiomEntry } from "@/lib/idioms";

export type StackedCardFaceProps = {
  card: IdiomEntry;
  deckLength: number;
  isCurrent: boolean;
  offset: number;
  onToggleAnswer: () => void;
  showAnswer: boolean;
  targetIndex: number;
};

export function StackedCardFace({
  card,
  deckLength,
  isCurrent,
  offset,
  onToggleAnswer,
  showAnswer,
  targetIndex,
}: StackedCardFaceProps): React.ReactElement {
  const isNear = Math.abs(offset) === 1;
  const isBefore = offset < 0;
  const positionLabel = isBefore ? (isNear ? "Previous" : "Earlier") : isNear ? "Next" : "Later";
  const cardModeLabel = isCurrent ? (showAnswer ? "Answer" : "Prompt") : positionLabel;
  const answerVisible = isCurrent && showAnswer;

  return (
    <>
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-dashed border-slate-200 bg-slate-50/80 px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-slate-500 mobile:px-5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate">
            {card.levelLabel} / Lesson {card.lessonNumber}
          </span>
          <span
            className={cn(
              "shrink-0 rounded-md px-2 py-1 text-[10px] tracking-[0.1em]",
              answerVisible
                ? "bg-emerald-50 text-emerald-700"
                : isCurrent
                  ? "bg-slate-200/80 text-slate-600"
                  : "bg-white text-slate-500"
            )}
          >
            {cardModeLabel}
          </span>
        </div>
        <span className="shrink-0 text-slate-700">
          {targetIndex + 1}/{deckLength}
        </span>
      </div>

      <motion.div
        className="relative min-h-0 flex-1 [transform-style:preserve-3d]"
        animate={{ rotateY: answerVisible ? 180 : 0 }}
        transition={{ duration: isCurrent ? 0.42 : 0.24, ease: [0.22, 1, 0.36, 1] }}
      >
        <div
          role={isCurrent && !answerVisible ? "button" : undefined}
          onClick={isCurrent ? onToggleAnswer : undefined}
          aria-label={isCurrent ? `Reveal answer for ${card.english_phrase}` : undefined}
          aria-hidden={answerVisible}
          tabIndex={isCurrent && !answerVisible ? 0 : -1}
          onKeyDown={(event) => {
            if (!isCurrent) {
              return;
            }

            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onToggleAnswer();
            }
          }}
          className={cn(
            "absolute inset-0 flex items-center justify-center p-5 text-center focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-primary/25 tablet:p-8 [backface-visibility:hidden]",
            isCurrent ? "cursor-pointer" : "pointer-events-none select-none",
            answerVisible && "pointer-events-none",
            !isCurrent && (isNear ? "blur-[1px] opacity-72" : "blur-[2px] opacity-55")
          )}
        >
          <h2 className="max-w-3xl text-3xl font-black leading-tight tracking-tight text-slate-950 mobile:text-4xl">
            {card.english_phrase}
          </h2>
        </div>

        <div
          onClick={isCurrent ? onToggleAnswer : undefined}
          aria-hidden={!answerVisible}
          className={cn(
            "absolute inset-0 overflow-y-auto p-5 text-left customScrollBarStyle tablet:p-8 [backface-visibility:hidden] [transform:rotateY(180deg)]",
            answerVisible ? "cursor-pointer" : "pointer-events-none"
          )}
        >
          <div className="mx-auto w-full max-w-3xl">
            <h2 className="text-3xl font-black leading-tight tracking-tight text-slate-950 mobile:text-4xl">
              {card.english_phrase}
            </h2>

            <div className="mt-7 divide-y divide-slate-200">
              <AnswerBlock title="Meaning" rtl text={card.persian_phrase_meaning} />
              <AnswerBlock title="Definition" text={card.english_definition} />
              {card.examples?.[0] ? (
                <div className="pt-5">
                  <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Example</div>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-900 mobile:text-base">
                    {card.examples[0].english_text}
                  </p>
                  <p dir="rtl" className="mt-2 font-iranYekan text-sm leading-7 text-slate-700">
                    {card.examples[0].persian_meaning}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </motion.div>

      <div className="pointer-events-none h-1.5 overflow-hidden bg-slate-100" aria-hidden="true">
        <motion.div
          className={cn("h-full", isBefore ? "bg-slate-400" : "bg-gradient-to-r from-blue-500 to-teal-400")}
          animate={{ width: `${deckLength ? Math.min(100, Math.max(0, Math.round(((targetIndex + 1) / deckLength) * 100))) : 0}%` }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      {!isCurrent ? (
        <span
          className={cn(
            "pointer-events-none absolute inset-0 rounded-lg ring-1 ring-inset ring-white/50",
            isNear ? "bg-white/6" : "bg-white/14"
          )}
          aria-hidden="true"
        />
      ) : null}

      {!isCurrent ? (
        <span className="pointer-events-none absolute inset-x-3 top-[3.25rem] border-t border-dashed border-slate-200/80" aria-hidden="true" />
      ) : null}
    </>
  );
}

function AnswerBlock({ title, text, rtl = false }: { title: string; text?: string | null; rtl?: boolean }): React.ReactElement {
  return (
    <div className="py-5 first:pt-0">
      <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{title}</div>
      <p dir={rtl ? "rtl" : "ltr"} className={`${rtl ? "font-iranYekan text-right text-lg leading-8" : "text-sm leading-7 mobile:text-base"} mt-2 text-slate-800`}>
        {text || "No extra note for this idiom."}
      </p>
    </div>
  );
}

