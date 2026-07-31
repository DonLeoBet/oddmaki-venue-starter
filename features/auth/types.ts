/**
 * Pluggable Auth Provider Types
 *
 * Shared type definitions for the auth provider abstraction layer.
 */

/** Supported auth provider identifiers. Configured via NEXT_PUBLIC_AUTH_PROVIDER. */
export type AuthProviderType = "privy" | "rainbowkit";

/** Props for auth provider wrapper components. Each adapter must accept these. */
export interface AuthProviderProps {
  children: React.ReactNode;
}

/** Props for connect button components. Each adapter renders its own UI. */
export interface ConnectButtonProps {
  /** Whether to show the wallet balance. Default: false */
  showBalance?: boolean;
}

export type LoginMethod = "privy" | "wallet" | null;

/** Unified session returned by useSession(). */
export interface SessionState {
  isReady: boolean;
  isLoggedIn: boolean;
  address: `0x${string}` | undefined;
  loginMethod: LoginMethod;
  privyAuthenticated: boolean;
  wagmiConnected: boolean;
  login: () => void;
  logout: () => Promise<void>;
}
