/** What the venue operator provides in theme.config.json */
export interface ThemeConfig {
  brand: {
    primary: string;
    secondary: string;
  };
  surfaces?: {
    background?: string;
    card?: string;
    foreground?: string;
  };
  semantic?: {
    success?: string;
    warning?: string;
    danger?: string;
  };
}

/** A full 50-900 shade scale with DEFAULT and foreground */
export interface ColorScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  DEFAULT: string;
  foreground: string;
}

/** Fully resolved theme ready for HeroUI consumption */
export interface ResolvedTheme {
  primary: ColorScale;
  secondary: ColorScale;
  success: ColorScale;
  warning: { DEFAULT: string; foreground: string };
  danger: ColorScale;
  default: ColorScale;
  background: string;
  foreground: string;
  content1: string;
  content2: string;
  content3: string;
  content4: string;
  focus: string;
}
