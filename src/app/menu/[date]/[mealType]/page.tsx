import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "~/server/db";
import { MealType } from "generated/prisma";
import { MenuClientRedirect } from "./client-redirect";

interface Props {
  params: Promise<{ date: string; mealType: string }>;
}

function getMealType(mealType: string): MealType | null {
  if (mealType === "breakfast") return MealType.BREAKFAST;
  if (mealType === "lunch") return MealType.LUNCH;
  return null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { date: dateParam, mealType: mealTypeParam } = await params;
  const mealType = getMealType(mealTypeParam);
  
  if (!mealType) {
    return { title: "Not Found" };
  }

  const date = new Date(dateParam);
  date.setUTCHours(0, 0, 0, 0);

  const dateStr = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const menu = await db.menu.findUnique({
    where: { date_mealType: { date, mealType } },
    include: { items: true },
  });

  const isBreakfast = mealType === MealType.BREAKFAST;
  const emoji = isBreakfast ? "🌅" : "☀️";
  const mealName = isBreakfast ? "Breakfast" : "Lunch";

  let description = "";
  if (menu?.published && menu.items.length > 0) {
    const itemNames = menu.items.map((i) => i.name).join(" • ");
    description = itemNames;
  } else {
    description = "Menu not available yet";
  }

  const title = `${emoji} ${mealName} for ${dateStr}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "Lunch Desk",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function MealMenuPage({ params }: Props) {
  const { date: dateParam, mealType: mealTypeParam } = await params;
  const mealType = getMealType(mealTypeParam);

  if (!mealType) {
    notFound();
  }

  const date = new Date(dateParam);
  date.setUTCHours(0, 0, 0, 0);

  const dateStr = date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const menu = await db.menu.findUnique({
    where: { date_mealType: { date, mealType } },
    include: { items: { include: { preference: true } } },
  });

  const isBreakfast = mealType === MealType.BREAKFAST;
  const emoji = isBreakfast ? "🌅" : "☀️";
  const mealName = isBreakfast ? "Breakfast" : "Lunch";

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 p-4">
      <MenuClientRedirect date={dateParam} />

      <div className="mx-auto max-w-lg">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-gray-800">🍽️ Lunch Desk</h1>
          <p className="mt-1 text-gray-600">{dateStr}</p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-lg">
          <h2 className="mb-4 text-xl font-semibold text-gray-800">
            {emoji} {mealName}
          </h2>
          {menu?.published && menu.items.length > 0 ? (
            <ul className="space-y-2">
              {menu.items.map((item) => (
                <li
                  key={item.id}
                  className="rounded-lg bg-orange-50 p-3 text-gray-700"
                >
                  {item.name}
                  {item.preference && !isBreakfast && (
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
