/** Shared HeroUI tab styling for market detail pages. */
export const marketDetailTabClassNames = {
  base: "w-full min-w-0",
  tabList:
    "p-0 gap-3 sm:gap-6 w-full overflow-x-auto flex-nowrap bg-transparent rounded-none [scrollbar-width:thin]",
  tab: "px-0 h-auto py-2 w-fit flex-shrink-0",
  cursor: "bg-primary h-0.5",
  tabContent:
    "text-default-500 group-data-[selected=true]:text-foreground font-semibold text-sm sm:text-base",
  panel: "pt-4 sm:pt-6 px-0",
} as const;
