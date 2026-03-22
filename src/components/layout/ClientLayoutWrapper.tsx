"use client";

import dynamic from "next/dynamic";

const MainLayout = dynamic(
  () => import("./MainLayout").then((mod) => mod.MainLayout),
  { ssr: false }
);

export function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  return <MainLayout>{children}</MainLayout>;
}
