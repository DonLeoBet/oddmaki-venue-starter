"use client";

import { useCallback, useEffect, useState } from "react";
import NextLink from "next/link";

import { alpha, colors } from "@/lib/tokens";

interface SidebarAccordionProps {
  id: string;
  label: string;
  defaultOpen?: boolean;
  forceOpen?: boolean;
  badge?: string;
  children: React.ReactNode;
  level?: 0 | 1;
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

  const paddingClass = level === 0 ? "px-3" : "px-2";
  const labelClass =
    level === 0
      ? "text-[11px] font-bold uppercase tracking-[0.12em] text-default-400"
      : "text-sm font-semibold text-white/90";

  return (
    <div className="flex flex-col">
      <button
        aria-controls={`sidebar-panel-${id}`}
        aria-expanded={open}
        className={`flex w-full items-center gap-2 rounded-lg py-2 text-left transition-colors hover:bg-white/[0.05] ${paddingClass}`}
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
          className={`flex flex-col gap-0.5 pb-1 ${level === 0 ? "pl-2" : "pl-3"}`}
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
}

export function SidebarLink({
  href,
  label,
  active = false,
  sub = false,
}: SidebarLinkProps) {
  return (
    <NextLink
      className={`block rounded-lg py-2 text-left transition-colors ${
        sub ? "pl-9 pr-3 text-[13px] font-medium" : "px-3 text-sm font-semibold"
      } ${
        active
          ? "font-bold text-primary"
          : sub
            ? "text-default-300 hover:bg-white/[0.05] hover:text-white"
            : "text-white/85 hover:bg-white/[0.05] hover:text-white"
      }`}
      href={href}
      style={
        active
          ? { backgroundColor: alpha(colors.neonCyan, 0.1) }
          : undefined
      }
    >
      {label}
    </NextLink>
  );
}

function ChevronIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={`h-3.5 w-3.5 text-default-400 ${className}`}
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

export function SidebarSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-1 px-1 py-3">
      <h2 className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-default-500">
        {title}
      </h2>
      {children}
    </section>
  );
}
