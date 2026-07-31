"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@heroui/button";

import { BRAND_CONFIG } from "@/config/brand.config";

interface VaultErrorBoundaryProps {
  children: ReactNode;
}

interface VaultErrorBoundaryState {
  hasError: boolean;
}

export class VaultErrorBoundary extends Component<
  VaultErrorBoundaryProps,
  VaultErrorBoundaryState
> {
  state: VaultErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): VaultErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[vault] VaultErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      const primaryColor = BRAND_CONFIG.theme.primaryColor;

      return (
        <div
          className="rounded-xl border p-8 text-center"
          style={{ borderColor: `${primaryColor}30`, background: "#111214" }}
        >
          <h2 className="text-lg font-bold">Vault temporarily unavailable</h2>
          <p className="mt-2 text-sm text-default-500">
            Something went wrong loading the dashboard. Your wallet and funds are
            unaffected.
          </p>
          <Button
            className="mt-4"
            style={{ background: primaryColor }}
            onPress={() => this.setState({ hasError: false })}
          >
            Try again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
