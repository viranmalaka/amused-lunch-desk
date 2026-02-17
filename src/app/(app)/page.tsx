"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "~/trpc/react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
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

function BreakfastCard({ date }: { date: string }) {
  const utils = api.useUtils();
  const { data: menu, isLoading: menuLoading } = api.menu.getByDateAndType.useQuery({
    date,
    mealType: MealType.BREAKFAST,
  });
  const { data: order, isLoading: orderLoading } = api.order.getMyOrder.useQuery({
    date,
    mealType: MealType.BREAKFAST,
  });

  const placeOrder = api.order.placeOrder.useMutation({
    onSuccess: () => {
      void utils.order.getMyOrder.invalidate({ date, mealType: MealType.BREAKFAST });
      void utils.order.getMyOrdersForDateRange.invalidate();
    },
  });

  const deleteOrder = api.order.deleteOrder.useMutation({
    onSuccess: () => {
      void utils.order.getMyOrder.invalidate({ date, mealType: MealType.BREAKFAST });
      void utils.order.getMyOrdersForDateRange.invalidate();
    },
  });

  const isMenuPublished = menu?.published ?? false;
  const isLoading = menuLoading || orderLoading;
  const hasOrder = !!order;
  const menuItem = menu?.items[0];

  const handleToggle = () => {
    if (hasOrder) {
      deleteOrder.mutate({ date, mealType: MealType.BREAKFAST });
    } else if (menuItem) {
      placeOrder.mutate({
        date,
        mealType: MealType.BREAKFAST,
        menuItemId: menuItem.id,
        preferenceId: null,
      });
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span>🌅 Breakfast</span>
          {isMenuPublished ? (
            <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">
              Available
            </span>
          ) : (
            <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-500">
              Not Available
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-4 text-center text-gray-500">Loading...</div>
        ) : !isMenuPublished || !menuItem ? (
          <p className="py-4 text-center text-gray-500">
            Breakfast menu not available yet
          </p>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg bg-orange-50 p-4">
              <p className="font-medium text-gray-800">{menuItem.name}</p>
            </div>
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition hover:bg-gray-50">
              <input
                type="checkbox"
                checked={hasOrder}
                onChange={handleToggle}
                disabled={placeOrder.isPending || deleteOrder.isPending}
                className="h-5 w-5 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
              />
              <span className="font-medium">
                {hasOrder ? "Yes, I want breakfast" : "Check to order breakfast"}
              </span>
            </label>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LunchCard({
  date,
  userDefaultPreferenceId,
}: {
  date: string;
  userDefaultPreferenceId: string | null;
}) {
  const utils = api.useUtils();
  const { data: menu, isLoading: menuLoading } = api.menu.getByDateAndType.useQuery({
    date,
    mealType: MealType.LUNCH,
  });
  const { data: order, isLoading: orderLoading } = api.order.getMyOrder.useQuery({
    date,
    mealType: MealType.LUNCH,
  });
  const { data: preferences } = api.preference.getAll.useQuery();

  const [selectedItem, setSelectedItem] = useState<string>("");
  const [selectedPreference, setSelectedPreference] = useState<string>("");

  const placeOrder = api.order.placeOrder.useMutation({
    onSuccess: () => {
      void utils.order.getMyOrder.invalidate({ date, mealType: MealType.LUNCH });
      void utils.order.getMyOrdersForDateRange.invalidate();
    },
  });

  const deleteOrder = api.order.deleteOrder.useMutation({
    onSuccess: () => {
      void utils.order.getMyOrder.invalidate({ date, mealType: MealType.LUNCH });
      void utils.order.getMyOrdersForDateRange.invalidate();
    },
  });

  const isMenuPublished = menu?.published ?? false;
  const isLoading = menuLoading || orderLoading;

  const getDefaultSelection = () => {
    if (order?.menuItemId) return order.menuItemId;
    if (order?.preferenceId) return order.preferenceId;
    if (userDefaultPreferenceId && isMenuPublished && menu?.items) {
      const matchingItem = menu.items.find(
        (item) => item.preferenceId === userDefaultPreferenceId
      );
      if (matchingItem) return matchingItem.id;
    }
    if (userDefaultPreferenceId && !isMenuPublished) {
      return userDefaultPreferenceId;
    }
    return "";
  };

  const handleSubmit = () => {
    const selection = isMenuPublished
      ? selectedItem || getDefaultSelection()
      : selectedPreference || getDefaultSelection();

    if (!selection) return;

    placeOrder.mutate({
      date,
      mealType: MealType.LUNCH,
      menuItemId: isMenuPublished ? selection : null,
      preferenceId: isMenuPublished ? null : selection,
    });
  };

  const currentSelection = order?.menuItem?.name ?? order?.preference?.name;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span>☀️ Lunch</span>
          {isMenuPublished ? (
            <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">
              Menu Available
            </span>
          ) : (
            <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs text-yellow-700">
              Select Preference
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-4 text-center text-gray-500">Loading...</div>
        ) : (
          <div className="space-y-4">
            {currentSelection && (
              <div className="rounded-lg bg-orange-50 p-3">
                <p className="text-sm text-gray-600">Your selection:</p>
                <p className="font-medium text-orange-700">{currentSelection}</p>
              </div>
            )}

            {isMenuPublished && menu?.items ? (
              <Select
                value={selectedItem || getDefaultSelection()}
                onChange={(e) => setSelectedItem(e.target.value)}
              >
                <option value="">Select an option...</option>
                {menu.items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                    {item.preference ? ` (${item.preference.name})` : ""}
                  </option>
                ))}
              </Select>
            ) : (
              <Select
                value={selectedPreference || getDefaultSelection()}
                onChange={(e) => setSelectedPreference(e.target.value)}
              >
                <option value="">Select your preference...</option>
                {preferences?.map((pref) => (
                  <option key={pref.id} value={pref.id}>
                    {pref.name}
                  </option>
                ))}
              </Select>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleSubmit}
                disabled={placeOrder.isPending}
                className="flex-1"
              >
                {placeOrder.isPending ? "Saving..." : order ? "Update" : "Submit"}
              </Button>
              {order && (
                <Button
                  variant="outline"
                  onClick={() => deleteOrder.mutate({ date, mealType: MealType.LUNCH })}
                  disabled={deleteOrder.isPending}
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function OrderPageContent() {
  const searchParams = useSearchParams();
  const dateFromUrl = searchParams.get("date");
  const dates = getWeekdayDates(15);
  
  // Use date from URL if valid, otherwise use first date
  const initialDate = dateFromUrl && dates.includes(dateFromUrl) ? dateFromUrl : dates[0]!;
  const [selectedDate, setSelectedDate] = useState(initialDate);
  
  const { data: user } = api.user.getMe.useQuery();
  const { data: ordersMap } = api.order.getMyOrdersForDateRange.useQuery({
    startDate: dates[0]!,
    endDate: dates[dates.length - 1]!,
  });

  // Update selected date if URL changes
  useEffect(() => {
    if (dateFromUrl && dates.includes(dateFromUrl)) {
      setSelectedDate(dateFromUrl);
    }
  }, [dateFromUrl, dates]);

  const today = new Date().toISOString().split("T")[0]!;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Order Your Meal</h1>
        <p className="text-gray-600">Select your meal options for the day</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {dates.map((date) => {
          const d = new Date(date);
          const isToday = date === today;
          const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
          const dayNum = d.getDate();
          const hasBreakfast = ordersMap?.[date]?.breakfast;
          const hasLunch = ordersMap?.[date]?.lunch;

          return (
            <button
              key={date}
              onClick={() => setSelectedDate(date)}
              className={`relative flex min-w-[60px] flex-col items-center rounded-lg px-3 py-2 transition-colors ${
                selectedDate === date
                  ? "bg-orange-500 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              <span className="text-xs">{dayName}</span>
              <span className="text-lg font-bold">{dayNum}</span>
              {isToday && <span className="text-xs">Today</span>}
              {/* Order indicators */}
              <div className="mt-1 flex gap-1">
                {hasBreakfast && (
                  <span
                    className={`h-2 w-2 rounded-full ${
                      selectedDate === date ? "bg-white" : "bg-orange-400"
                    }`}
                    title="Breakfast ordered"
                  />
                )}
                {hasLunch && (
                  <span
                    className={`h-2 w-2 rounded-full ${
                      selectedDate === date ? "bg-white" : "bg-green-400"
                    }`}
                    title="Lunch ordered"
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mb-2 flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-orange-400" /> Breakfast
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-green-400" /> Lunch
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <BreakfastCard date={selectedDate} />
        <LunchCard
          date={selectedDate}
          userDefaultPreferenceId={user?.defaultPreferenceId ?? null}
        />
      </div>
    </div>
  );
}

export default function OrderPage() {
  return (
    <OrderPageContent />
  );
}
