"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";

/**
 * Gates /admin/* behind an httpOnly cookie session.
 * Operators enter ADMIN_SECRET once; it is never bundled in client JS.
 */
export function AdminSessionGate({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const refreshSession = useCallback(async () => {
    setChecking(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/session", { cache: "no-store" });
      const json = (await res.json()) as { authenticated?: boolean };

      setAuthenticated(Boolean(json.authenticated));
    } catch {
      setAuthenticated(false);
      setError("Could not verify admin session");
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const login = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };

      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "Login failed");
      }

      setToken("");
      setAuthenticated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  const logout = async () => {
    await fetch("/api/admin/session", { method: "DELETE" });
    setAuthenticated(false);
  };

  if (checking) {
    return (
      <div className="flex justify-center py-16 text-sm text-default-500">
        Checking admin session…
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-4 py-8 px-4">
        <Card>
          <CardHeader>
            <h1 className="text-lg font-semibold">Admin access</h1>
          </CardHeader>
          <CardBody className="gap-3">
            <p className="text-sm text-default-500">
              Enter the server <code className="text-xs">ADMIN_SECRET</code> to
              open fixture tools. The secret stays on the server — only an
              httpOnly session cookie is stored in your browser.
            </p>
            <Input
              label="Admin token"
              type="password"
              value={token}
              onValueChange={setToken}
              onKeyDown={(e) => {
                if (e.key === "Enter") void login();
              }}
            />
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button
              color="primary"
              isDisabled={!token.trim()}
              isLoading={submitting}
              onPress={() => void login()}
            >
              Unlock admin
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end px-4 pt-2">
        <Button size="sm" variant="light" onPress={() => void logout()}>
          Sign out admin
        </Button>
      </div>
      {children}
    </div>
  );
}
