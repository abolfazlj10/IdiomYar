import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface QuickAccessCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  route: string;
  cta: string;
  featured?: boolean;
  meta?: string;
  tone?: "blue" | "emerald" | "amber" | "slate";
}

const toneStyles = {
  blue: {
    border: "border-primary/30 hover:border-primary/45",
    surface: "bg-blue-50 text-blue-700",
    meta: "bg-blue-50 text-blue-700",
  },
  emerald: {
    border: "border-slate-200 hover:border-emerald-300",
    surface: "bg-emerald-50 text-emerald-700",
    meta: "bg-emerald-50 text-emerald-700",
  },
  amber: {
    border: "border-slate-200 hover:border-amber-300",
    surface: "bg-amber-50 text-amber-800",
    meta: "bg-amber-50 text-amber-800",
  },
  slate: {
    border: "border-slate-200 hover:border-slate-300",
    surface: "bg-slate-100 text-slate-700",
    meta: "bg-slate-100 text-slate-700",
  },
};

export default function QuickAccessCard({
  icon,
  title,
  description,
  route,
  cta,
  featured = false,
  meta,
  tone = "slate",
}: QuickAccessCardProps): React.ReactElement {
  const styles = toneStyles[tone];

  return (
    <Link
      href={route}
      aria-label={`${cta}: ${title}`}
      className={`group flex min-h-[190px] min-w-0 flex-col rounded-lg border bg-white p-5 transition-[border-color,box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/20 ${
        featured ? `${styles.border} shadow-sm` : styles.border
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className={`rounded-lg p-2.5 [&_svg]:size-5 ${styles.surface}`}>
          {icon}
        </div>
        {meta ? <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${styles.meta}`}>{meta}</span> : null}
      </div>
      <div className="mt-5 min-w-0">
        <h3 className="text-base font-black tracking-tight text-slate-950">{title}</h3>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{description}</p>
      </div>
      <span className="mt-auto inline-flex items-center gap-1 pt-5 text-sm font-bold text-primary transition-colors duration-150 group-hover:text-primary/80">
        {cta}
        <ArrowRight className="size-4 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" />
      </span>
    </Link>
  );
}
