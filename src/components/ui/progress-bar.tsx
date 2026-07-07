'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

type ProgressBarHeight = 'sm' | 'md' | 'lg'

interface ProgressBarProps {
  percentage: number
  color?: string
  showPercentage?: boolean
  height?: ProgressBarHeight
  animationDelay?: number
  className?: string
  label?: string
  valueLabel?: string
  ariaLabel?: string
  showMilestones?: boolean
}

const heightClasses: Record<ProgressBarHeight, { shell: string; marker: string }> = {
  sm: {
    shell: 'h-3 p-[2px]',
    marker: 'size-1.5',
  },
  md: {
    shell: 'h-4 p-[3px]',
    marker: 'size-2',
  },
  lg: {
    shell: 'h-5 p-[3px]',
    marker: 'size-2.5',
  },
}

const progressThemes = {
  primary: {
    fill: 'from-blue-500 via-cyan-500 to-teal-400',
    glow: 'shadow-blue-500/25',
  },
  green: {
    fill: 'from-emerald-400 via-teal-400 to-cyan-500',
    glow: 'shadow-emerald-500/25',
  },
  blue: {
    fill: 'from-blue-500 via-sky-400 to-cyan-400',
    glow: 'shadow-sky-500/25',
  },
  purple: {
    fill: 'from-violet-500 via-fuchsia-400 to-rose-400',
    glow: 'shadow-violet-500/25',
  },
  red: {
    fill: 'from-rose-500 via-orange-400 to-amber-300',
    glow: 'shadow-rose-500/25',
  },
  amber: {
    fill: 'from-amber-400 via-orange-400 to-rose-400',
    glow: 'shadow-amber-500/25',
  },
  elementary: {
    fill: 'from-amber-300 via-yellow-400 to-orange-400',
    glow: 'shadow-amber-500/25',
  },
  intermediate: {
    fill: 'from-sky-400 via-cyan-400 to-blue-500',
    glow: 'shadow-sky-500/25',
  },
  advanced: {
    fill: 'from-rose-400 via-orange-400 to-amber-300',
    glow: 'shadow-rose-500/25',
  },
}

function clampPercentage(value: number): number {
  if (!Number.isFinite(value)) {
    return 0
  }

  return Math.min(100, Math.max(0, value))
}

function getTheme(color?: string): (typeof progressThemes)[keyof typeof progressThemes] {
  if (!color) {
    return progressThemes.primary
  }

  if (color in progressThemes) {
    return progressThemes[color as keyof typeof progressThemes]
  }

  if (color.includes('from-') || color.includes('to-') || color.includes('via-')) {
    return {
      fill: color,
      glow: progressThemes.primary.glow,
    }
  }

  if (color.includes('green') || color.includes('emerald') || color.includes('teal')) {
    return progressThemes.green
  }

  if (color.includes('purple') || color.includes('violet') || color.includes('fuchsia')) {
    return progressThemes.purple
  }

  if (color.includes('red') || color.includes('rose')) {
    return progressThemes.red
  }

  if (color.includes('amber') || color.includes('orange') || color.includes('yellow')) {
    return progressThemes.amber
  }

  if (color.includes('blue') || color.includes('sky') || color.includes('cyan')) {
    return progressThemes.blue
  }

  return progressThemes.primary
}

export default function ProgressBar({
  percentage,
  color,
  showPercentage = true,
  height = 'md',
  animationDelay = 0,
  className = '',
  label,
  valueLabel,
  ariaLabel,
  showMilestones = true,
}: ProgressBarProps) {
  const prefersReducedMotion = useReducedMotion()
  const clampedPercentage = clampPercentage(percentage)
  const roundedPercentage = Math.round(clampedPercentage)
  const theme = getTheme(color)
  const shouldShowHeader = Boolean(label || valueLabel || showPercentage)
  const displayedValue = valueLabel ?? `${roundedPercentage}%`

  return (
    <div className={cn('mb-4 min-w-0', className)}>
      {shouldShowHeader ? (
        <div className="mb-2 flex min-w-0 items-end justify-between gap-3">
          {label ? (
            <span className="min-w-0 truncate text-xs font-black uppercase tracking-[0.14em] text-slate-500">
              {label}
            </span>
          ) : (
            <span aria-hidden="true" />
          )}
          <span className="shrink-0 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs font-black tabular-nums text-slate-700 shadow-sm">
            {displayedValue}
          </span>
        </div>
      ) : null}

      <div
        role="progressbar"
        aria-label={ariaLabel ?? label ?? 'Progress'}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={roundedPercentage}
        className={cn(
          'relative isolate overflow-hidden rounded-full border border-white/80 bg-slate-100 shadow-[inset_0_1px_3px_rgba(15,23,42,0.14),0_1px_0_rgba(255,255,255,0.9)]',
          heightClasses[height].shell
        )}
      >
        <div className="absolute inset-0 rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(226,232,240,0.68))]" aria-hidden="true" />

        {showMilestones ? (
          <div className="pointer-events-none absolute inset-y-[3px] left-0 right-0 z-10 grid grid-cols-4 px-[3px]" aria-hidden="true">
            <span />
            <span className="border-l border-white/60" />
            <span className="border-l border-white/60" />
            <span className="border-l border-white/60" />
          </div>
        ) : null}

        <motion.div
          className={cn('relative z-20 h-full overflow-hidden rounded-full bg-gradient-to-r shadow-lg', theme.fill, theme.glow)}
          initial={prefersReducedMotion ? false : { width: 0 }}
          animate={{ width: `${clampedPercentage}%` }}
          transition={{
            duration: prefersReducedMotion ? 0 : 0.9,
            delay: prefersReducedMotion ? 0 : animationDelay,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <span className="absolute inset-0 rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,0.42),rgba(255,255,255,0)_54%)]" aria-hidden="true" />
          {!prefersReducedMotion ? (
            <motion.span
              className="absolute inset-y-0 -left-1/3 w-1/3 skew-x-[-18deg] bg-white/35 blur-[1px]"
              aria-hidden="true"
              animate={{ x: ['0%', '420%'] }}
              transition={{
                duration: 1.7,
                delay: animationDelay + 0.25,
                ease: 'easeOut',
              }}
            />
          ) : null}
          {clampedPercentage > 4 ? (
            <span
              className={cn('absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-white/95 shadow-[0_0_10px_rgba(255,255,255,0.85)]', heightClasses[height].marker)}
              aria-hidden="true"
            />
          ) : null}
        </motion.div>
      </div>
    </div>
  )
}
