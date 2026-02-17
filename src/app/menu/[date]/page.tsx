import { type Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "~/server/db";
import { auth } from "~/server/auth";
import { MealType } from "generated/prisma";

interface Props {
  params: Promise<{ date: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { date: dateParam } = await params;
  const date = new Date(dateParam);
  date.setUTCHours(0, 0, 0, 0);

  const dateStr = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const menus = await db.menu.findMany({
    where: { date, published: true },
    include: { items: true },
  });

  const breakfast = menus.find((m) => m.mealType === MealType.BREAKFAST);
  const lunch = menus.find((m) => m.mealType === MealType.LUNCH);

  // Build a nice description for Teams preview
  const breakfastItem = breakfast?.items[0]?.name;
  const lunchItems = lunch?.items.map((i) => `• ${i.name}`).join("\n") ?? "";

  let description = "";
  if (breakfastItem) {
    description += `🌅 Breakfast: ${breakfastItem}\n\n`;
  }
  if (lunchItems) {
    description += `☀️ Lunch:\n${lunchItems}`;
  }
  if (!description) {
    description = "Menu not available yet";
  }

  return {
    title: `🍽️ Menu for ${dateStr}`,
    description,
    openGraph: {
      title: `🍽️ Menu for ${dateStr}`,
      description,
      type: "website",
      siteName: "Lunch Desk",
    },
    twitter: {
      card: "summary",
      title: `🍽️ Menu for ${dateStr}`,
      description,
    },
    other: {
      // Additional meta for better Teams/Slack unfurling
      "og:locale": "en_US",
    },
  };
}

export default async function MenuPage({ params }: Props) {
  const { date: dateParam } = await params;
  const session = await auth();

  // If user is logged in, redirect to order page with date
  if (session?.user) {
    redirect(`/?date=${dateParam}`);
  }

  // If not logged in, redirect to login with callback to order page
  redirect(`/login?callbackUrl=${encodeURIComponent(`/?date=${dateParam}`)}`);
}
