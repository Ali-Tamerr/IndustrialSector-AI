"use client";

import { SessionProvider } from "next-auth/react";
import { ToastProvider } from "@/app/_components/ToastContext";

export function Providers({ children }) {
  return (
    <SessionProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </SessionProvider>
  );
}
