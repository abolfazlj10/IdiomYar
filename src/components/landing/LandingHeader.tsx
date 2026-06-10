import Link from "next/link";
import { Github, Languages } from "lucide-react";

type NavItem = {
  href: string;
  label: string;
};

type LandingHeaderProps = {
  navItems: NavItem[];
  githubRepoUrl: string;
  githubProfileUrl: string;
  githubAvatarUrl: string;
  searchSlot?: React.ReactNode;
};

export function LandingHeader({
  navItems,
  githubRepoUrl,
  githubProfileUrl,
  githubAvatarUrl,
  searchSlot,
}: LandingHeaderProps): React.ReactElement {
  return (
    <header className="sticky top-3 z-50 flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-lg border border-[#E7E0D5] bg-[#FBFAF7]/90 px-3 py-3 shadow-[0_14px_40px_rgba(11,16,32,0.08)] backdrop-blur-xl tablet:px-4">
      <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="IdiomYar home">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#0B1020] text-white shadow-sm">
          <Languages className="size-5" aria-hidden="true" />
        </span>
        <span className="min-w-0">
          <span className="block text-base font-black tracking-[0] text-[#0B1020]">IdiomYar</span>
          <span className="hidden text-xs font-semibold tracking-[0] text-[#6C7280] mobile:block">Idioms that stay with you</span>
        </span>
      </Link>

      {searchSlot ? <div className="order-3 w-full min-w-0 tablet:order-none tablet:flex-1 tablet:basis-72 laptop:max-w-lg">{searchSlot}</div> : null}

      <nav aria-label="Primary navigation" className="order-4 flex w-full min-w-0 items-center gap-1 overflow-x-auto tablet:order-none tablet:w-auto tablet:overflow-visible">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-lg px-3 py-2 text-sm font-bold tracking-[0] text-[#4E5668] transition-colors duration-150 hover:bg-white hover:text-[#0B1020] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#5B2EFF]/25"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="group relative inline-flex h-10 max-w-full items-center justify-end">
        <a
          href={githubProfileUrl}
          target="_blank"
          rel="noreferrer"
          aria-label="Open Abolfazl's GitHub profile"
          className="pointer-events-none absolute right-0 top-1/2 z-0 hidden size-10 -translate-y-1/2 scale-75 items-center justify-center opacity-0 shadow-sm transition-[right,opacity,transform] duration-300 ease-out group-hover:pointer-events-auto group-hover:right-[calc(100%+0.5rem)] group-hover:scale-100 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:right-[calc(100%+0.5rem)] group-focus-within:scale-100 group-focus-within:opacity-100 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#5B2EFF]/25 mobile:inline-flex"
        >
          <img src={githubAvatarUrl} alt="Abolfazl GitHub profile" className="size-10 rounded-full border border-[#E7E0D5] object-cover ring-2 ring-white" />
        </a>
        <a
          href={githubRepoUrl}
          target="_blank"
          rel="noreferrer"
          aria-label="Open the IdiomYar repository on GitHub"
          className="relative z-10 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#0B1020] px-3 py-2 text-sm font-black text-white shadow-sm transition-[background-color,transform] duration-150 hover:-translate-y-0.5 hover:bg-[#1C2442] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#5B2EFF]/30"
        >
          <Github className="size-4" aria-hidden="true" />
          <span className="hidden mobile:inline">GitHub</span>
        </a>
      </div>
    </header>
  );
}
