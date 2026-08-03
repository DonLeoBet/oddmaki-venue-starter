"use client";

import { useCallback, useEffect, useState } from "react";
import NextLink from "next/link";

interface SidebarAccordionProps {
  id: string;
  label: string;
  defaultOpen?: boolean;
  forceOpen?: boolean;
  badge?: string;
  children: React.ReactNode;
  level?: 0 | 1 | 2;
}

export function SidebarAccordion({
  id,
  label,
  defaultOpen = false,
  forceOpen = false,
  badge,
  children,
  level = 0,
}: SidebarAccordionProps) {
  const [open, setOpen] = useState(defaultOpen || forceOpen);

  useEffect(() => {
    if (forceOpen) setOpen(true);
  }, [forceOpen]);

  const toggle = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  const paddingClass =
    level === 0 ? "px-3" : level === 1 ? "pl-6 pr-2" : "pl-9 pr-2";
  const labelClass =
    level === 0
      ? "text-[15px] font-semibold text-white/90 [[data-brand=wiseguy]_&]:text-[17px] [[data-brand=wiseguy]_&]:font-bold"
      : level === 1
        ? "text-[13px] font-semibold text-white/80 [[data-brand=wiseguy]_&]:text-base [[data-brand=wiseguy]_&]:font-semibold"
        : "text-[13px] font-medium text-default-300 [[data-brand=wiseguy]_&]:text-[15px]";
  const indentClass =
    level === 0 ? "pl-2" : level === 1 ? "pl-4" : "pl-5";

  return (
    <div className="flex flex-col">
      <button
        aria-controls={`sidebar-panel-${id}`}
        aria-expanded={open}
        className={`flex w-full items-center gap-2 rounded-md py-1.5 text-left transition-colors hover:bg-white/[0.04] ${paddingClass}`}
        type="button"
        onClick={toggle}
      >
        <ChevronIcon className={`shrink-0 transition-transform ${open ? "rotate-90" : ""}`} />
        <span className={`min-w-0 flex-1 truncate ${labelClass}`}>{label}</span>
        {badge ?
          <span className="shrink-0 rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-default-300">
            {badge}
          </span>
        : null}
      </button>
      {open ?
        <div
          className={`flex flex-col gap-0.5 pb-0.5 ${indentClass}`}
          id={`sidebar-panel-${id}`}
        >
          {children}
        </div>
      : null}
    </div>
  );
}

interface SidebarLinkProps {
  href: string;
  label: string;
  active?: boolean;
  sub?: boolean;
  depth?: 1 | 2;
  /** Optional leading icon (e.g. country flag emoji). */
  leading?: React.ReactNode;
  onNavigate?: () => void;
}

export function SidebarLink({
  href,
  label,
  active = false,
  sub = false,
  depth = 1,
  leading,
  onNavigate,
}: SidebarLinkProps) {
  const paddingClass =
    depth === 2
      ? "pl-12 pr-3 text-[12px] [[data-brand=wiseguy]_&]:text-sm"
      : sub
        ? "pl-8 pr-3 text-[13px] [[data-brand=wiseguy]_&]:text-base"
        : "px-3 text-sm [[data-brand=wiseguy]_&]:text-base";

  return (
    <NextLink
      className={`flex items-center gap-2 rounded-md py-1.5 text-left transition-colors ${paddingClass} ${
        active
          ? "font-semibold text-primary"
          : sub || depth === 2
            ? "font-medium text-default-400 hover:text-white"
            : "font-semibold text-white/85 hover:text-white"
      } ${active ? "border-l-2 border-primary" : "border-l-2 border-transparent"}`}
      href={href}
      onClick={onNavigate}
    >
      {leading ?
        <span aria-hidden className="inline-flex w-5 shrink-0 justify-center text-base leading-none">
          {leading}
        </span>
      : null}
      <span className="min-w-0 truncate">{label}</span>
    </NextLink>
  );
}

function ChevronIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={`h-3 w-3 text-default-500 ${className}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        d="M9 5l7 7-7 7"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
      />
    </svg>
  );
}

export function SidebarSubheading({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-default-500">
      {children}
    </p>
  );
}

export function SidebarSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-0.5 px-1 py-2 [[data-brand=wiseguy]_&]:gap-0.5 [[data-brand=wiseguy]_&]:px-0.5 [[data-brand=wiseguy]_&]:py-1.5">
      <h2 className="px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-default-500 [[data-brand=wiseguy]_&]:pb-1.5 [[data-brand=wiseguy]_&]:tracking-[0.14em]">
        {title}
      </h2>
      {children}
    </section>
  );
}
