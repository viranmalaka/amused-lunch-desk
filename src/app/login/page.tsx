"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

/**
 * Error messages for authentication failures
 */
const errorMessages: Record<string, string> = {
  OAuthSignin: "Error starting the sign-in process. Please try again.",
  OAuthCallback: "Error during authentication callback. Please try again.",
  OAuthCreateAccount: "Could not create your account. Please contact support.",
  Callback: "Authentication callback error. Please try again.",
  OAuthAccountNotLinked: "This email is already linked to another account.",
  SessionRequired: "Please sign in to access this page.",
  Default: "An error occurred during sign-in. Please try again.",
};

function LoginForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  const errorMessage = error
    ? errorMessages[error] ?? errorMessages.Default
    : null;

  const handleSignIn = async () => {
    await signIn("azure-ad", { callbackUrl });
  };

  return (
    <div className="space-y-6">
      {errorMessage && (
        <div
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600"
          role="alert"
        >
          {errorMessage}
        </div>
      )}

      <button
        onClick={handleSignIn}
        className="flex w-full items-center justify-center gap-3 rounded-lg bg-[#2F2F2F] px-4 py-3 font-semibold text-white transition hover:bg-[#1F1F1F]"
      >
        <svg
          className="h-5 w-5"
          viewBox="0 0 21 21"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="1" y="1" width="9" height="9" fill="#F25022" />
          <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
          <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
          <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
        </svg>
        Sign in with Microsoft
      </button>

      <p className="text-center text-xs text-gray-500">
        Use your corporate Microsoft account to sign in.
      </p>

      <div className="mt-4 border-t pt-4">
        <a
          href="/admin-login"
          className="block text-center text-sm text-gray-500 hover:text-gray-700"
        >
          Admin Login →
        </a>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50 to-amber-100 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800">🍽️ Lunch Desk</h1>
          <p className="mt-2 text-gray-600">Sign in to manage your meals</p>
        </div>

        <Suspense fallback={<div className="py-4 text-center">Loading...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
