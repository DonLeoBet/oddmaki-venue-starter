import Image from "next/image";

import { venueConfig } from "@/config/venue.config";
import { fonts, letterSpacings } from "@/lib/tokens";

/** TopClass / Poly.Football wordmark is 256×31. */
const LOGO_WIDTH = 256;
const LOGO_HEIGHT = 31;

export interface BrandLogoProps {
  height?: number;
  priority?: boolean;
  className?: string;
  /** Show venue name beside the logo (for icon-only logos). Default false. */
  showName?: boolean;
}

/** Site logo from venueConfig.branding (→ BRAND_CONFIG). */
export function BrandLogo({
  height = 32,
  priority = false,
  className,
  showName = false,
}: BrandLogoProps) {
  const { logo, name } = venueConfig.branding;
  const width = Math.round(height * (LOGO_WIDTH / LOGO_HEIGHT));

  const image = (
    <Image
      alt={`${name} logo`}
      className={
        className ??
        "h-8 w-auto max-w-[220px] shrink-0 object-contain object-left"
      }
      height={height}
      priority={priority}
      src={logo}
      width={width}
    />
  );

  if (!showName) return image;

  return (
    <span
      className="flex items-center gap-2.5"
      style={{ fontFamily: fonts.sans, letterSpacing: letterSpacings.normal }}
    >
      {image}
      <span className="text-base font-semibold text-white">{name}</span>
    </span>
  );
}
