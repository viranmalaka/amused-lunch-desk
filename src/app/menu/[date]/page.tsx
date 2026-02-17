import { type Metadata } from "next";
import Link from "next/link";
import { db } from "~/server/db";
import { MealType } from "generated/prisma";
import { MenuClientRedirect } from "./client-redirect";

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
  };
}

export default async function MenuPage({ params }: Props) {
  const { date: dateParam } = await params;
  const date = new Date(dateParam);
  date.setUTCHours(0, 0, 0, 0);

  const dateStr = date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const menus = await db.menu.findMany({
    where: { date, published: true },
    include: { items: { include: { preference: true } } },
  });

  const breakfast = menus.find((m) => m.mealType === MealType.BREAKFAST);
  const lunch = menus.find((m) => m.mealType === MealType.LUNCH);

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 p-4">
      {/* Client-side redirect component */}
      <MenuClientRedirect date={dateParam} />

      <div className="mx-auto max-w-lg">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-gray-800">🍽️ Lunch Desk</h1>
          <p className="mt-1 text-gray-600">{dateStr}</p>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-semibold text-gray-800">
              🌅 Breakfast
            </h2>
            {breakfast && breakfast.items.length > 0 ? (
              <ul className="space-y-2">
                {breakfast.items.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-lg bg-orange-50 p-3 text-gray-700"
                  >
                    {item.name}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">Menu not available yet</p>
            )}
          </div>

          <div className="rounded-xl bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-semibold text-gray-800">
              ☀️ Lunch
            </h2>
            {lunch && lunch.items.length > 0 ? (
              <ul className="space-y-2">
                {lunch.items.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-lg bg-orange-50 p-3 text-gray-700"
                  >
                    {item.name}
                    {item.preference && (
                      <span className="ml-2 text-sm text-gray-500">
                        ({item.preference.name})
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">Menu not available yet</p>
            )}
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            href={`/?date=${dateParam}`}
            className="inline-block rounded-lg bg-orange-500 px-6 py-3 font-semibold text-white transition hover:bg-orange-600"
          >
            Order Now →
          </Link>
        </div>
      </div>
    </main>
  );
}
