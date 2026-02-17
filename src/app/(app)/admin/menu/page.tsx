"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Select } from "~/components/ui/select";
import { MealType } from "generated/prisma";

function getWeekdayDates(count: number): string[] {
  const dates: string[] = [];
  const d = new Date();
  while (dates.length < count) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) {
      dates.push(d.toISOString().split("T")[0]!);
    }
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

function CopyLinkButton({ date }: { date: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const url = `${window.location.origin}/menu/${date}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className="gap-1"
    >
      {copied ? "✓ Copied!" : "📋 Copy Link for Teams"}
    </Button>
  );
}

function BreakfastEditor({ date }: { date: string }) {
  const utils = api.useUtils();
  const { data: menu, isLoading } = api.menu.getByDateAndType.useQuery({
    date,
    mealType: MealType.BREAKFAST,
  });

  const [newItemName, setNewItemName] = useState("");

  const createMenu = api.menu.create.useMutation({
    onSuccess: () => {
      void utils.menu.getByDateAndType.invalidate({ date, mealType: MealType.BREAKFAST });
    },
  });

  const addItem = api.menu.addItem.useMutation({
    onSuccess: () => {
      void utils.menu.getByDateAndType.invalidate({ date, mealType: MealType.BREAKFAST });
      setNewItemName("");
    },
  });

  const deleteItem = api.menu.deleteItem.useMutation({
    onSuccess: () => {
      void utils.menu.getByDateAndType.invalidate({ date, mealType: MealType.BREAKFAST });
    },
  });

  const publishMenu = api.menu.publish.useMutation({
    onSuccess: () => {
      void utils.menu.getByDateAndType.invalidate({ date, mealType: MealType.BREAKFAST });
    },
  });

  const handleAddItem = () => {
    if (!menu || !newItemName.trim()) return;
    addItem.mutate({
      menuId: menu.id,
      name: newItemName.trim(),
      preferenceId: null,
    });
  };

  if (isLoading) {
    return <div className="py-4 text-center text-gray-500">Loading...</div>;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span>🌅 Breakfast</span>
          {menu?.published && (
            <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">
              Published
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!menu ? (
          <Button onClick={() => createMenu.mutate({ date, mealType: MealType.BREAKFAST })}>
            Create Menu
          </Button>
        ) : (
          <>
            <div className="space-y-2">
              {menu.items.length === 0 ? (
                <p className="text-sm text-gray-500">No items yet</p>
              ) : (
                menu.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg bg-gray-50 p-2"
                  >
                    <span className="font-medium">{item.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteItem.mutate({ itemId: item.id })}
                    >
                      ✕
                    </Button>
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Breakfast item name..."
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleAddItem} disabled={addItem.isPending}>
                Add
              </Button>
            </div>

            <Button
              variant={menu.published ? "outline" : "default"}
              onClick={() =>
                publishMenu.mutate({ menuId: menu.id, published: !menu.published })
              }
              disabled={publishMenu.isPending}
              className="w-full"
            >
              {menu.published ? "Unpublish" : "Publish Menu"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function LunchEditor({ date }: { date: string }) {
  const utils = api.useUtils();
  const { data: menu, isLoading } = api.menu.getByDateAndType.useQuery({
    date,
    mealType: MealType.LUNCH,
  });
  const { data: preferences } = api.preference.getAll.useQuery();

  const [newItemName, setNewItemName] = useState("");
  const [newItemPreference, setNewItemPreference] = useState("");

  const createMenu = api.menu.create.useMutation({
    onSuccess: () => {
      void utils.menu.getByDateAndType.invalidate({ date, mealType: MealType.LUNCH });
    },
  });

  const addItem = api.menu.addItem.useMutation({
    onSuccess: () => {
      void utils.menu.getByDateAndType.invalidate({ date, mealType: MealType.LUNCH });
      setNewItemName("");
      setNewItemPreference("");
    },
  });

  const deleteItem = api.menu.deleteItem.useMutation({
    onSuccess: () => {
      void utils.menu.getByDateAndType.invalidate({ date, mealType: MealType.LUNCH });
    },
  });

  const publishMenu = api.menu.publish.useMutation({
    onSuccess: () => {
      void utils.menu.getByDateAndType.invalidate({ date, mealType: MealType.LUNCH });
    },
  });

  const handleAddItem = () => {
    if (!menu || !newItemName.trim()) return;
    addItem.mutate({
      menuId: menu.id,
      name: newItemName.trim(),
      preferenceId: newItemPreference || null,
    });
  };

  if (isLoading) {
    return <div className="py-4 text-center text-gray-500">Loading...</div>;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span>☀️ Lunch</span>
          {menu?.published && (
            <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">
              Published
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!menu ? (
          <Button onClick={() => createMenu.mutate({ date, mealType: MealType.LUNCH })}>
            Create Menu
          </Button>
        ) : (
          <>
            <div className="space-y-2">
              {menu.items.length === 0 ? (
                <p className="text-sm text-gray-500">No items yet</p>
              ) : (
                menu.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg bg-gray-50 p-2"
                  >
                    <div>
                      <span className="font-medium">{item.name}</span>
                      {item.preference && (
                        <span className="ml-2 text-sm text-gray-500">
                          ({item.preference.name})
                        </span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteItem.mutate({ itemId: item.id })}
                    >
                      ✕
                    </Button>
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Item name..."
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="flex-1"
              />
              <Select
                value={newItemPreference}
                onChange={(e) => setNewItemPreference(e.target.value)}
                className="w-32"
              >
                <option value="">No pref</option>
                {preferences?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
              <Button onClick={handleAddItem} disabled={addItem.isPending}>
                Add
              </Button>
            </div>

            <Button
              variant={menu.published ? "outline" : "default"}
              onClick={() =>
                publishMenu.mutate({ menuId: menu.id, published: !menu.published })
              }
              disabled={publishMenu.isPending}
              className="w-full"
            >
              {menu.published ? "Unpublish" : "Publish Menu"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function ShareSection({ date }: { date: string }) {
  const { data: breakfastMenu } = api.menu.getByDateAndType.useQuery({
    date,
    mealType: MealType.BREAKFAST,
  });
  const { data: lunchMenu } = api.menu.getByDateAndType.useQuery({
    date,
    mealType: MealType.LUNCH,
  });

  const hasPublishedMenu = breakfastMenu?.published === true || lunchMenu?.published === true;

  if (!hasPublishedMenu) return null;

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <p className="font-medium text-gray-800">Share menu with your team</p>
          <p className="text-sm text-gray-600">
            Copy the link and paste it in Teams for a nice preview
          </p>
        </div>
        <CopyLinkButton date={date} />
      </CardContent>
    </Card>
  );
}

export default function AdminMenuPage() {
  const dates = getWeekdayDates(15);
  const [selectedDate, setSelectedDate] = useState(dates[0]!);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Manage Menu</h1>
        <p className="text-gray-600">Add and publish daily menu items</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {dates.map((date) => {
          const d = new Date(date);
          const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
          const dayNum = d.getDate();

          return (
            <button
              key={date}
              onClick={() => setSelectedDate(date)}
              className={`flex min-w-[60px] flex-col items-center rounded-lg px-3 py-2 transition-colors ${
                selectedDate === date
                  ? "bg-orange-500 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              <span className="text-xs">{dayName}</span>
              <span className="text-lg font-bold">{dayNum}</span>
            </button>
          );
        })}
      </div>

      <ShareSection date={selectedDate} />

      <div className="grid gap-4 sm:grid-cols-2">
        <BreakfastEditor date={selectedDate} />
        <LunchEditor date={selectedDate} />
      </div>
    </div>
  );
}
