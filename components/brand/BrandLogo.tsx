import Image from "next/image";

import {
  BRAND_CONFIG,
  getBrandLogoIntrinsicSize,
} from "@/config/brand.config";
import { venueConfig } from "@/config/venue.config";
import { fonts, letterSpacings } from "@/lib/tokens";

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
  const { width: intrinsicWidth, height: intrinsicHeight } =
    getBrandLogoIntrinsicSize(BRAND_CONFIG.id, logo);
  const isWiseguy = logo === "/wiseguy-logo.png";
  const resolvedHeight = isWiseguy ? Math.max(height, 40) : height;
  const width = Math.round(
    resolvedHeight * (intrinsicWidth / intrinsicHeight),
  );
  const maxWidth =
    isWiseguy ?
      Math.round(320 * (intrinsicWidth / 834))
    : Math.round(220 * (intrinsicWidth / 256));

  const image = (
    <Image
      alt={`${name} logo`}
      className={
        className ??
        "w-auto shrink-0 object-contain object-left"
      }
      height={resolvedHeight}
      priority={priority}
      src={logo}
      style={{ height: resolvedHeight, maxWidth }}
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
