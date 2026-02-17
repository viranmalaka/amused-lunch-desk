"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export function MenuClientRedirect({ date }: { date: string }) {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (status === "authenticated") {
      router.replace(`/?date=${date}`);
    } else {
      router.replace(`/login?callbackUrl=${encodeURIComponent(`/?date=${date}`)}`);
    }
  }, [status, router, date]);

  return null;
}
