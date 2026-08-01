"use client";

const SIZE_CLASS = {
  xs: "h-4 w-4 text-[8px]",
  sm: "h-6 w-6 text-[10px]",
  md: "h-10 w-10 text-sm",
  row: "h-11 w-11 text-base",
  lg: "h-14 w-14 text-lg",
} as const;

interface DrawOutcomeIconProps {
  size?: keyof typeof SIZE_CLASS;
  className?: string;
  title?: string;
}

/** Round draw tile — matches {@link TeamLogo} footprint for 1X2 middle column. */
export function DrawOutcomeIcon({
  size = "row",
  className = "",
  title = "Draw",
}: DrawOutcomeIconProps) {
  const sizeClass = SIZE_CLASS[size];

  return (
    <span
      aria-hidden
      className={`${sizeClass} inline-flex flex-shrink-0 items-center justify-center rounded-full border border-default-300/80 bg-default-100 font-bold leading-none text-default-500 ${className}`}
      title={title}
    >
      ×
    </span>
  );
}
