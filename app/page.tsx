"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const hasToken =
      typeof window !== "undefined" && localStorage.getItem("muna_token");
    router.replace(hasToken ? "/dashboard" : "/login");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas">
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  );
}