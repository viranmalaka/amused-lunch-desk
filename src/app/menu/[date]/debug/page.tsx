import { db } from "~/server/db";
import { MealType } from "generated/prisma";

interface Props {
  params: Promise<{ date: string }>;
}

export default async function DebugMetaPage({ params }: Props) {
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

  const title = `🍽️ Menu for ${dateStr}`;

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold">SEO Meta Tags Preview</h1>
        <p className="text-gray-600">This shows what Teams/Slack will display</p>

        {/* Simulated link preview card */}
        <div className="overflow-hidden rounded-lg border bg-white shadow-lg">
          <div className="border-b bg-gray-50 px-4 py-2 text-xs text-gray-500">
            Link Preview Simulation
          </div>
          <div className="p-4">
            <p className="text-sm text-gray-500">lunch-desk.vercel.app</p>
            <h2 className="mt-1 text-lg font-semibold text-blue-600">{title}</h2>
            <p className="mt-2 whitespace-pre-line text-sm text-gray-700">
              {description}
            </p>
          </div>
        </div>

        {/* Raw meta tags */}
        <div className="rounded-lg border bg-white p-4">
          <h3 className="mb-3 font-semibold">Raw Meta Tags:</h3>
          <pre className="overflow-x-auto rounded bg-gray-900 p-4 text-sm text-green-400">
{`<meta property="og:title" content="${title}" />
<meta property="og:description" content="${description.replace(/\n/g, "\\n")}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Lunch Desk" />
<meta name="twitter:card" content="summary" />
<meta name="twitter:title" content="${title}" />
<meta name="twitter:description" content="${description.replace(/\n/g, "\\n")}" />`}
          </pre>
        </div>

        <p className="text-sm text-gray-500">
          Visit <code className="rounded bg-gray-200 px-1">/menu/{dateParam}</code> to test the actual redirect flow
        </p>
      </div>
    </main>
  );
}
