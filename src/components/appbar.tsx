import React from "react";
import { ArrowLeft } from "lucide-react";

interface AppbarProps {
  onBackClick?: () => void;
  title: string;
  iconSrc: string;
  rightButton: React.ReactNode;
}

export default function Appbar({ onBackClick, title, iconSrc, rightButton }: AppbarProps): React.ReactElement {
  return (
    <header className="flex min-w-0 items-center justify-between gap-3">
      <button
        type="button"
        className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors duration-150 hover:border-primary/30 hover:bg-accent focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primaryColor/25 max-mobile:size-10 max-mobile:min-h-10 max-mobile:justify-center max-mobile:gap-0 max-mobile:rounded-full max-mobile:border-transparent max-mobile:bg-transparent max-mobile:p-0 max-mobile:shadow-none max-mobile:hover:border-transparent max-mobile:hover:bg-white"
        onClick={onBackClick}
        aria-label="Go back"
      >
        <ArrowLeft className="size-4 max-mobile:size-5" aria-hidden="true" />
        <span className="max-mobile:hidden">Back</span>
      </button>
      <div className="flex min-w-0 flex-1 items-center justify-center gap-2 text-center text-xl font-black tracking-tight text-slate-950 max-tablet:text-lg max-mobile:text-base">
        <span className="truncate">{title}</span>
        <img src={iconSrc} alt="" className="size-7 shrink-0 max-tablet:size-6" />
      </div>
      <div className="flex min-w-10 shrink-0 justify-end">{rightButton ? rightButton : null}</div>
    </header>
  );
}
