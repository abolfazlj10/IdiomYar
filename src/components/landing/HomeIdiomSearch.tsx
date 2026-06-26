"use client";

import { ArrowRight, Command, CornerDownLeft, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { LevelId } from "@/types/types";

export type HomeIdiomSearchItem = {
  id: string;
  englishPhrase: string;
  persianPhrase: string | null;
  level: LevelId;
  levelLabel: string;
  lessonNumber: number;
  href: string;
  searchText: string;
};

type HomeIdiomSearchProps = {
  items: HomeIdiomSearchItem[];
  variant?: "hero" | "navbar";
};

const maxResults = 10;

function normalizeSearch(value: string): string {
  return value.trim().toLowerCase();
}

function getSearchScore(item: HomeIdiomSearchItem, query: string): number | null {
  if (!query) {
    return 10;
  }

  const phrase = item.englishPhrase.toLowerCase();
  const persianPhrase = item.persianPhrase?.toLowerCase() ?? "";

  if (phrase === query) {
    return 0;
  }

  if (phrase.startsWith(query)) {
    return 1;
  }

  if (phrase.includes(query)) {
    return 2;
  }

  if (persianPhrase.includes(query)) {
    return 3;
  }

  if (`lesson ${item.lessonNumber}`.includes(query) || item.levelLabel.toLowerCase().includes(query)) {
    return 4;
  }

  return item.searchText.includes(query) ? 5 : null;
}

export function HomeIdiomSearch({ items, variant = "hero" }: HomeIdiomSearchProps): React.ReactElement {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const normalizedQuery = normalizeSearch(query);
  const hasQuery = Boolean(normalizedQuery);

  const results = useMemo(() => {
    return items
      .map((item, index) => ({ item, index, score: getSearchScore(item, normalizedQuery) }))
      .filter((result): result is { item: HomeIdiomSearchItem; index: number; score: number } => result.score !== null)
      .sort((a, b) => a.score - b.score || a.index - b.index)
      .slice(0, maxResults)
      .map((result) => result.item);
  }, [items, normalizedQuery]);

  useEffect(() => {
    function handleGlobalKeyDown(event: KeyboardEvent): void {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsExpanded(true);
        inputRef.current?.focus();
      }
    }

    document.addEventListener("keydown", handleGlobalKeyDown);

    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent): void {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsExpanded(false);
        setActiveIndex(0);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);

    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  useEffect(() => {
    setActiveIndex(0);
  }, [normalizedQuery]);

  useEffect(() => {
    if (activeIndex >= results.length) {
      setActiveIndex(Math.max(results.length - 1, 0));
    }
  }, [activeIndex, results.length]);

  function selectResult(item: HomeIdiomSearchItem): void {
    setIsExpanded(false);
    setQuery("");
    setActiveIndex(0);
    inputRef.current?.blur();
    router.push(item.href);
  }

  function handleInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>): void {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((currentIndex) => (results.length ? (currentIndex + 1) % results.length : 0));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((currentIndex) => (results.length ? (currentIndex - 1 + results.length) % results.length : 0));
      return;
    }

    if (event.key === "Enter" && results[activeIndex]) {
      event.preventDefault();
      selectResult(results[activeIndex]);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setIsExpanded(false);
      setActiveIndex(0);
      inputRef.current?.blur();
    }
  }

  function handleClearSearch(): void {
    setQuery("");
    setActiveIndex(0);
    setIsExpanded(true);
    inputRef.current?.focus();
  }

  return (
    <div ref={rootRef} className="relative w-full">
      <div
        className={cn(
          "flex w-full items-center gap-3 rounded-lg border border-[#D8D1C6] bg-white text-left transition-[border-color,box-shadow,transform] duration-150 focus-within:border-[#5B2EFF]/45 focus-within:ring-3 focus-within:ring-[#5B2EFF]/20 hover:-translate-y-0.5 hover:border-[#5B2EFF]/40",
          variant === "navbar"
            ? "min-h-10 px-3 py-2 shadow-sm hover:shadow-[0_10px_24px_rgba(11,16,32,0.1)]"
            : "mt-7 min-h-14 max-w-2xl px-4 py-3 shadow-[0_14px_34px_rgba(11,16,32,0.08)] hover:shadow-[0_18px_42px_rgba(11,16,32,0.11)]"
        )}
      >
        <span
          className={cn(
            "flex shrink-0 items-center justify-center rounded-lg bg-[#F4F1FF] text-[#5B2EFF]",
            variant === "navbar" ? "size-8" : "size-9"
          )}
        >
          <Search className="size-4" aria-hidden="true" />
        </span>
        <label className="min-w-0 flex-1">
          <span className="sr-only">Search idioms</span>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onFocus={() => setIsExpanded(true)}
            onChange={(event) => {
              setQuery(event.target.value);
              setIsExpanded(true);
            }}
            onKeyDown={handleInputKeyDown}
            placeholder="Search any idiom"
            autoComplete="off"
            className={cn(
              "block h-7 w-full min-w-0 bg-transparent font-black text-[#0B1020] outline-none placeholder:text-[#0B1020]",
              variant === "navbar" ? "text-sm" : "text-sm mobile:text-base"
            )}
            aria-label="Search idioms or meanings"
            aria-expanded={isExpanded}
            aria-controls="home-idiom-search-results"
            role="combobox"
          />
          <span className={cn("truncate text-xs font-semibold text-[#6C7280]", variant === "navbar" ? "hidden laptop:block" : "block mobile:text-sm")}>
            Find phrases and meanings
          </span>
        </label>
        {hasQuery ? (
          <button
            type="button"
            onClick={handleClearSearch}
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-[#6C7280] transition-colors hover:bg-[#F2EFE8] hover:text-[#0B1020] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#5B2EFF]/20"
            aria-label="Clear search"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        ) : (
          <span className="hidden shrink-0 items-center gap-1 rounded-lg border border-[#E4DDD2] bg-[#FBFAF7] px-2.5 py-1.5 text-xs font-black text-[#4E5668] mobile:inline-flex">
            <Command className="size-3.5" aria-hidden="true" />
            K
          </span>
        )}
      </div>

      {isExpanded ? (
        <div
          id="home-idiom-search-results"
          className={cn(
            "absolute left-0 right-0 z-50 mt-2 flex max-h-[min(540px,calc(100dvh-8rem))] flex-col overflow-hidden rounded-lg border border-[#E4DDD2] bg-[#FBFAF7] shadow-[0_24px_70px_rgba(11,16,32,0.18)]",
            variant === "hero" && "max-w-2xl"
          )}
        >
          <div className="min-h-0 flex-1 overflow-y-auto p-3 customScrollBarStyle">
            {results.length ? (
              <div className="flex flex-col gap-2" role="listbox" aria-label="Idiom search results">
                {results.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectResult(item)}
                    onMouseEnter={() => setActiveIndex(index)}
                    role="option"
                    aria-selected={activeIndex === index}
                    className={cn(
                      "group grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-3 rounded-lg border p-3 text-left transition-[background-color,border-color,box-shadow]",
                      activeIndex === index
                        ? "border-[#5B2EFF]/45 bg-white shadow-sm"
                        : "border-transparent bg-transparent hover:border-[#E4DDD2] hover:bg-white"
                    )}
                  >
                    <span className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-center gap-3">
                      <span className="truncate text-sm font-black text-[#0B1020] mobile:text-base">{item.englishPhrase}</span>
                      <span dir="rtl" className="truncate text-right font-iranYekan text-sm leading-6 text-[#4E5668]">
                        {item.persianPhrase || "No Persian meaning yet."}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "flex items-center gap-2 self-center text-xs font-black text-[#5B2EFF] opacity-0 transition-opacity group-hover:opacity-100",
                        activeIndex === index && "opacity-100"
                      )}
                    >
                      Open
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex min-h-40 flex-col items-center justify-center rounded-lg border border-dashed border-[#D8D1C6] bg-white/70 px-4 text-center">
                <p className="text-sm font-black text-[#0B1020]">No idioms found</p>
                <p className="mt-2 max-w-sm text-sm leading-6 text-[#6C7280]">Try a phrase or Persian meaning.</p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#E4DDD2] bg-white px-4 py-3 text-xs font-bold text-[#6C7280]">
            <span className="inline-flex items-center gap-1.5">
              <CornerDownLeft className="size-3.5" aria-hidden="true" />
              Enter opens result
            </span>
            <span>Use arrows to move through results</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
