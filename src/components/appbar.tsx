import React from "react";

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
        className="flex min-h-10 shrink-0 items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors duration-150 hover:border-primary/30 hover:bg-accent max-mobile:min-h-11 max-mobile:px-2"
        onClick={onBackClick}
        aria-label="Go back"
      >
        <span aria-hidden="true" className="text-sm">
          &lt;-
        </span>
        Back
      </button>
      <div className="flex min-w-0 flex-1 items-center justify-center gap-2 text-center text-xl font-black tracking-tight text-slate-950 max-tablet:text-lg max-mobile:text-base">
        <span className="truncate">{title}</span>
        <img src={iconSrc} alt="" className="size-7 shrink-0 max-tablet:size-6" />
      </div>
      <div className="flex min-w-10 shrink-0 justify-end">{rightButton ? rightButton : null}</div>
    </header>
  );
}
