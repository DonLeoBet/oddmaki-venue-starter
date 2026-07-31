"use client";

import { useState } from "react";

const SIZE_CLASS = {
  xs: "h-4 w-4",
  sm: "h-6 w-6",
  md: "h-10 w-10",
  row: "h-11 w-11",
  lg: "h-14 w-14",
} as const;

interface TeamLogoProps {
  src?: string | null;
  name: string;
  size?: keyof typeof SIZE_CLASS;
  className?: string;
  /** Transparent crest — no circle tile behind the image. */
  plain?: boolean;
}

/** Team crest — neutral circle when missing or broken; never letter avatars. */
export function TeamLogo({
  src,
  name,
  size = "sm",
  className = "",
  plain = false,
}: TeamLogoProps) {
  const [failed, setFailed] = useState(false);
  const sizeClass = SIZE_CLASS[size];

  if (!src || failed) {
    return (
      <span
        aria-hidden
        className={`${sizeClass} inline-block flex-shrink-0 ${
          plain ? "rounded-sm bg-transparent" : "rounded-full bg-default-200"
        } ${className}`}
        title={name}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt=""
      className={`${sizeClass} inline-block flex-shrink-0 object-contain ${
        plain ? "" : "rounded-full bg-default-100 p-0.5"
      } ${className}`}
      loading="lazy"
      src={src}
      title={name}
      onError={() => setFailed(true)}
    />
  );
}

interface MatchTeamLogosProps {
  home: { name: string; logo?: string | null };
  away: { name: string; logo?: string | null };
  size?: keyof typeof SIZE_CLASS;
}

/** Home / away crests with a vs separator for match headers. */
export function MatchTeamLogos({ home, away, size = "lg" }: MatchTeamLogosProps) {
  return (
    <div className="flex items-center gap-3">
      <TeamLogo name={home.name} size={size} src={home.logo} />
      <span className="text-sm font-medium text-default-400">vs</span>
      <TeamLogo name={away.name} size={size} src={away.logo} />
    </div>
  );
}
