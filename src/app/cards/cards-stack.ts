import type { TargetAndTransition } from "framer-motion";

export const STACK_VISIBLE_OFFSET = 3;
export const STACK_CARD_CLASS =
  "flex h-full min-h-[366px] w-full max-w-[38rem] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white text-center shadow-[0_22px_60px_rgba(15,23,42,0.18)] mobile:min-h-[420px] laptop:min-h-0";

const STACK_CARD_X_BY_OFFSET = [0, 238, 420, 560] as const;
const STACK_CARD_Y_BY_OFFSET = [0, 14, 30, 50] as const;
const STACK_CARD_ROTATION_BY_OFFSET = [0, 2.4, 4.2, 5.6] as const;
const STACK_CARD_OPACITY_BY_OFFSET = [1, 0.88, 0.5, 0.18] as const;
const STACK_CARD_TRANSITION = {
  type: "spring",
  stiffness: 150,
  damping: 24,
  mass: 0.95,
} as const;
const STACK_CARD_REDUCED_TRANSITION = { duration: 0.01 } as const;

export function getStackCardPlacement(offset: number, prefersReducedMotion: boolean): TargetAndTransition {
  const absoluteOffset = Math.abs(offset);
  const direction = Math.sign(offset);
  const visibleOffset = Math.min(absoluteOffset, STACK_VISIBLE_OFFSET);
  const isBeyondStack = absoluteOffset > STACK_VISIBLE_OFFSET;

  return {
    opacity: isBeyondStack ? 0 : STACK_CARD_OPACITY_BY_OFFSET[visibleOffset],
    rotateZ: direction * STACK_CARD_ROTATION_BY_OFFSET[visibleOffset],
    x: direction * (isBeyondStack ? STACK_CARD_X_BY_OFFSET[STACK_VISIBLE_OFFSET] + 140 : STACK_CARD_X_BY_OFFSET[visibleOffset]),
    y: isBeyondStack ? STACK_CARD_Y_BY_OFFSET[STACK_VISIBLE_OFFSET] + 24 : STACK_CARD_Y_BY_OFFSET[visibleOffset],
    transition: prefersReducedMotion ? STACK_CARD_REDUCED_TRANSITION : STACK_CARD_TRANSITION,
  };
}

export function getStackCardZIndex(offset: number): number {
  return 80 - Math.min(Math.abs(offset), STACK_VISIBLE_OFFSET + 1) * 10;
}
