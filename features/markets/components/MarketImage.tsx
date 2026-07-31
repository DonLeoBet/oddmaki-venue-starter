"use client";

import { Avatar } from "@heroui/avatar";
import { resolveIPFSUri, type MarketMetadata } from "@oddmaki-protocol/sdk";

import { useMetadata } from "@/lib/ipfs/useMetadata";

interface MarketImageProps {
  metadataURI: string;
  name: string;
  size?: "sm" | "md" | "lg";
  /** Show initials avatar when no IPFS image is set. */
  showFallback?: boolean;
}

export function MarketImage({
  metadataURI,
  name,
  size = "sm",
  showFallback = false,
}: MarketImageProps) {
  const { data: metadata } = useMetadata<MarketMetadata>(metadataURI || null);

  const imageUrl = metadata?.image_url
    ? resolveIPFSUri(metadata.image_url, process.env.NEXT_PUBLIC_IPFS_GATEWAY)
    : undefined;

  if (!imageUrl && !showFallback) return null;

  return (
    <Avatar
      className="flex-shrink-0"
      name={name}
      radius="sm"
      size={size}
      src={imageUrl}
    />
  );
}
