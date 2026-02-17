"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export function MenuClientRedirect({ date }: { date: string }) {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Wait for session to be determined
    if (status === "loading") return;

    if (status === "authenticated") {
      // User is logged in, go to order page with date
      router.replace(`/?date=${date}`);
    } else {
      // User is not logged in, go to login with callback
      router.replace(`/login?callbackUrl=${encodeURIComponent(`/?date=${date}`)}`);
    }
  }, [status, router, date]);

  return null;
}
