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

function CopyLinkButton({ date, mealType }: { date: string; mealType: "breakfast" | "lunch" }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const url = `${window.location.origin}/menu/${date}/${mealType}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className="gap-1 text-xs"
    >
      {copied ? "✓ Copied!" : "📋 Copy Link"}
    </Button>
  );
}

function PublishWarningDialog({
  menuId,
  isPublished,
  onConfirm,
  isPending,
}: {
  menuId: string;
  isPublished: boolean;
  onConfirm: () => void;
  isPending: boolean;
}) {
  const [showWarning, setShowWarning] = useState(false);
  const { data: warnings, isLoading, refetch, isFetching } = api.menu.getUnmatchedPreferences.useQuery(
    { menuId },
    { enabled: showWarning && !isPublished },
  );

  const handleClick = () => {
    refetch();
    if (isPublished) {
      // Unpublish directly, no warning needed
      onConfirm();
      return;
    }
    setShowWarning(true);
  };

  const handleConfirmPublish = () => {
    setShowWarning(false);
    onConfirm();
  };

  return (
    <>
      <Button
        variant={isPublished ? "outline" : "default"}
        onClick={handleClick}
        disabled={isPending}
        className="w-full"
      >
        {isPublished ? "Unpublish" : "Publish Menu"}
      </Button>

      {showWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            {isLoading || isFetching ? (
              <p className="text-center text-gray-500">Checking pre-orders...</p>
            ) : warnings && warnings.length > 0 ? (
              <>
                <div className="mb-4 flex items-start gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Unmatched Pre-orders
                    </h3>
                    <p className="text-sm text-gray-600">
                      Some users pre-ordered preferences that have no matching menu item.
                      Their orders won&apos;t be auto-assigned.
                    </p>
                  </div>
                </div>
                <div className="mb-4 space-y-3">
                  {warnings.map((w) => (
                    <div
                      key={w.preferenceId}
                      className="rounded-lg border border-amber-200 bg-amber-50 p-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-amber-800">
                          {w.preferenceName}
                        </span>
                        <span className="rounded-full bg-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-800">
                          {w.userCount} {w.userCount === 1 ? "user" : "users"}
                        </span>
                      </div>
                      <div className="mt-1 text-sm text-amber-700">
                        {w.users.map((u, i) => (
                          <span key={i}>
                            {u.name ?? u.email ?? "Unknown"}
                            {i < w.users.length - 1 ? ", " : ""}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowWarning(false)}
                    className="flex-1"
                  >
                    Go Back
                  </Button>
                  <Button
                    onClick={handleConfirmPublish}
                    className="flex-1 bg-amber-500 hover:bg-amber-600"
                  >
                    Publish Anyway
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="mb-4 flex items-start gap-3">
                  <span className="text-2xl">✅</span>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Ready to Publish
                    </h3>
                    <p className="text-sm text-gray-600">
                      All pre-orders have matching menu items. Good to go.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowWarning(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleConfirmPublish} className="flex-1">
                    Publish
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
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
          <div className="flex items-center gap-2">
            {menu?.published && (
              <>
                <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">
                  Published
                </span>
                <CopyLinkButton date={date} mealType="breakfast" />
              </>
            )}
          </div>
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

            <PublishWarningDialog
              menuId={menu.id}
              isPublished={menu.published}
              onConfirm={() =>
                publishMenu.mutate({ menuId: menu.id, published: !menu.published })
              }
              isPending={publishMenu.isPending}
            />
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
          <div className="flex items-center gap-2">
            {menu?.published && (
              <>
                <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">
                  Published
                </span>
                <CopyLinkButton date={date} mealType="lunch" />
              </>
            )}
          </div>
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

            <PublishWarningDialog
              menuId={menu.id}
              isPublished={menu.published}
              onConfirm={() =>
                publishMenu.mutate({ menuId: menu.id, published: !menu.published })
              }
              isPending={publishMenu.isPending}
            />
          </>
        )}
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

      <div className="grid gap-4 sm:grid-cols-2">
        <BreakfastEditor date={selectedDate} />
        <LunchEditor date={selectedDate} />
      </div>
    </div>
  );
}
