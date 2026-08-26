"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { cn } from "@/lib/utils";

export type AdminTheme = "light" | "dark";

const THEME_COOKIE = "admin-theme";

const AdminThemeContext = createContext<{ theme: AdminTheme; toggle: () => void } | null>(null);

export function AdminThemeProvider({
  initialTheme,
  className,
  children,
}: {
  initialTheme: AdminTheme;
  className?: string;
  children: React.ReactNode;
}) {
  const [theme, setTheme] = useState<AdminTheme>(initialTheme);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next: AdminTheme = prev === "dark" ? "light" : "dark";
      document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=31536000; SameSite=Lax`;
      return next;
    });
  }, []);

  return (
    <AdminThemeContext.Provider value={{ theme, toggle }}>
      {/* text-ink re-declares `color` at this scope so descendants that don't set
          their own text-* class inherit the current theme's ink value, instead of
          the light-mode value already baked into `body`'s inherited color. */}
      <div className={cn("text-ink", className, theme === "dark" && "dark")}>{children}</div>
    </AdminThemeContext.Provider>
  );
}

export function useAdminTheme() {
  const ctx = useContext(AdminThemeContext);
  if (!ctx) throw new Error("useAdminTheme must be used within AdminThemeProvider");
  return ctx;
}
