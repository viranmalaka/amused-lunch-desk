"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "~/lib/utils";
import type { Role } from "generated/prisma";

interface NavProps {
  userName: string | null;
  userRole: Role;
}

export function Nav({ userName, userRole }: NavProps) {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Order" },
    { href: "/preferences", label: "My Preferences" },
    ...(userRole === "ADMIN"
      ? [
          { href: "/admin/menu", label: "Manage Menu" },
          { href: "/admin/orders", label: "View Orders" },
          { href: "/admin/users", label: "Users" },
        ]
      : []),
  ];

  return (
    <nav className="sticky top-0 z-50 border-b bg-white shadow-sm">
      <div className="mx-auto max-w-4xl px-4">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-xl font-bold text-orange-500">
              🍽️ Lunch Desk
            </Link>
            <div className="hidden items-center gap-1 sm:flex">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    pathname === link.href
                      ? "bg-orange-100 text-orange-700"
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-gray-600 sm:block">
              {userName}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="flex gap-1 overflow-x-auto pb-2 sm:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname === link.href
                  ? "bg-orange-100 text-orange-700"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
