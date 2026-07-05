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
        className="inline-flex size-10 shrink-0 items-center justify-center rounded-full text-slate-700 transition-colors duration-150 hover:bg-white focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primaryColor/25"
        onClick={onBackClick}
        aria-label="Go back"
      >
        <ArrowLeft className="size-5" aria-hidden="true" />
      </button>
      <div className="flex min-w-0 flex-1 items-center justify-center gap-2 text-center text-xl font-black tracking-tight text-slate-950 max-tablet:text-lg max-mobile:text-base">
        <span className="truncate">{title}</span>
        <img src={iconSrc} alt="" className="size-7 shrink-0 max-tablet:size-6" />
      </div>
      <div className="flex min-w-10 shrink-0 justify-end">{rightButton ? rightButton : null}</div>
    </header>
  );
}
