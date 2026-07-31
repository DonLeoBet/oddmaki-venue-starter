"use client";

import { useState } from "react";

const SIZE_CLASS = {
  sm: "h-8 w-8",
  md: "h-12 w-12",
  lg: "h-16 w-16",
} as const;

interface LeagueLogoProps {
  src?: string | null;
  name: string;
  size?: keyof typeof SIZE_CLASS;
  className?: string;
  plain?: boolean;
}

/** Competition crest — CDN league logo or minimal fallback. */
export function LeagueLogo({
  src,
  name,
  size = "md",
  className = "",
  plain = false,
}: LeagueLogoProps) {
  const [failed, setFailed] = useState(false);
  const sizeClass = SIZE_CLASS[size];

  if (!src || failed) {
    return (
      <span
        aria-hidden
        className={`${sizeClass} inline-flex flex-shrink-0 items-center justify-center ${
          plain ? "" : "rounded-xl bg-default-100/80"
        } ${className}`}
        title={name}
      >
        <span className="text-[10px] font-bold uppercase text-default-400">
          {name.slice(0, 2)}
        </span>
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt=""
      className={`${sizeClass} inline-block flex-shrink-0 object-contain ${
        plain ? "" : "rounded-xl bg-default-100/80 p-1.5"
      } ${className}`}
      loading="lazy"
      src={src}
      title={name}
      onError={() => setFailed(true)}
    />
  );
}
