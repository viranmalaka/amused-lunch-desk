"use client";

import { useState, useRef } from "react";
import { api } from "~/trpc/react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
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

function OrdersView({
  date,
  mealType,
}: {
  date: string;
  mealType: MealType;
}) {
  const printRef = useRef<HTMLDivElement>(null);
  const { data: orders, isLoading } = api.order.getAllOrders.useQuery({
    date,
    mealType,
  });
  const { data: summary } = api.order.getOrderSummary.useQuery({
    date,
    mealType,
  });

  const handlePrint = () => {
    if (!printRef.current) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const d = new Date(date);
    const dateStr = d.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    printWindow.document.write(`
      <html>
        <head>
          <title>${mealType} Orders - ${dateStr}</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 20px; }
            h1 { font-size: 24px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #f5f5f5; }
            .summary { margin-top: 30px; }
            .summary h2 { font-size: 18px; }
            .summary-item { padding: 4px 0; }
          </style>
        </head>
        <body>
          <h1>${mealType} - ${dateStr}</h1>
          ${printRef.current.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (isLoading) {
    return <div className="py-4 text-center text-gray-500">Loading...</div>;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span>{mealType === "BREAKFAST" ? "🌅 Breakfast" : "☀️ Lunch"}</span>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            🖨️ Print
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={printRef}>
          {/* Summary */}
          <div className="mb-4 rounded-lg bg-orange-50 p-3">
            <h3 className="mb-2 font-semibold">Summary</h3>
            {summary && Object.keys(summary).length > 0 ? (
              <div className="space-y-1">
                {Object.entries(summary).map(([item, count]) => (
                  <div key={item} className="flex justify-between text-sm">
                    <span>{item}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
                <div className="mt-2 border-t pt-2 font-semibold">
                  <div className="flex justify-between">
                    <span>Total</span>
                    <span>{orders?.length ?? 0}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No orders yet</p>
            )}
          </div>

          {/* Order list */}
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="pb-2 text-left font-medium">Name</th>
                <th className="pb-2 text-left font-medium">Selection</th>
              </tr>
            </thead>
            <tbody>
              {orders?.map((order) => (
                <tr key={order.id} className="border-b">
                  <td className="py-2">{order.user.name ?? order.user.email}</td>
                  <td className="py-2">
                    {order.menuItem?.name ?? order.preference?.name ?? "-"}
                  </td>
                </tr>
              ))}
              {(!orders || orders.length === 0) && (
                <tr>
                  <td colSpan={2} className="py-4 text-center text-gray-500">
                    No orders
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminOrdersPage() {
  const dates = getWeekdayDates(15);
  const [selectedDate, setSelectedDate] = useState(dates[0]!);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">View Orders</h1>
        <p className="text-gray-600">See order summary and print labels</p>
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
        <OrdersView date={selectedDate} mealType={MealType.BREAKFAST} />
        <OrdersView date={selectedDate} mealType={MealType.LUNCH} />
      </div>
    </div>
  );
}
