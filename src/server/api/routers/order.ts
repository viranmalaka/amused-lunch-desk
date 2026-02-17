import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { MealType } from "generated/prisma";

export const orderRouter = createTRPCRouter({
  getMyOrder: protectedProcedure
    .input(z.object({
      date: z.string(),
      mealType: z.nativeEnum(MealType),
    }))
    .query(async ({ ctx, input }) => {
      const date = new Date(input.date);
      date.setUTCHours(0, 0, 0, 0);

      return ctx.db.order.findUnique({
        where: {
          userId_date_mealType: {
            userId: ctx.session.user.id,
            date,
            mealType: input.mealType,
          },
        },
        include: {
          menuItem: { include: { preference: true } },
          preference: true,
        },
      });
    }),

  getMyOrdersForDate: protectedProcedure
    .input(z.object({ date: z.string() }))
    .query(async ({ ctx, input }) => {
      const date = new Date(input.date);
      date.setUTCHours(0, 0, 0, 0);

      return ctx.db.order.findMany({
        where: {
          userId: ctx.session.user.id,
          date,
        },
        include: {
          menuItem: { include: { preference: true } },
          preference: true,
        },
      });
    }),

  getMyOrdersForDateRange: protectedProcedure
    .input(z.object({
      startDate: z.string(),
      endDate: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const startDate = new Date(input.startDate);
      startDate.setUTCHours(0, 0, 0, 0);
      const endDate = new Date(input.endDate);
      endDate.setUTCHours(23, 59, 59, 999);

      const orders = await ctx.db.order.findMany({
        where: {
          userId: ctx.session.user.id,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          date: true,
          mealType: true,
        },
      });

      // Build a map of date -> { breakfast: boolean, lunch: boolean }
      const result: Record<string, { breakfast: boolean; lunch: boolean }> = {};
      for (const order of orders) {
        const dateKey = order.date.toISOString().split("T")[0]!;
        result[dateKey] ??= { breakfast: false, lunch: false };
        if (order.mealType === "BREAKFAST") {
          result[dateKey].breakfast = true;
        } else {
          result[dateKey].lunch = true;
        }
      }
      return result;
    }),

  placeOrder: protectedProcedure
    .input(z.object({
      date: z.string(),
      mealType: z.nativeEnum(MealType),
      menuItemId: z.string().nullable(),
      preferenceId: z.string().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      const date = new Date(input.date);
      date.setUTCHours(0, 0, 0, 0);

      // Check if menu is published
      const menu = await ctx.db.menu.findUnique({
        where: {
          date_mealType: { date, mealType: input.mealType },
        },
        include: { items: true },
      });

      // If menu is published, must select a menu item
      if (menu?.published && !input.menuItemId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Menu is published. Please select a menu item.",
        });
      }

      // If menu is published, verify the item belongs to this menu
      if (menu?.published && input.menuItemId) {
        const validItem = menu.items.find((i) => i.id === input.menuItemId);
        if (!validItem) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid menu item for this menu.",
          });
        }
      }

      return ctx.db.order.upsert({
        where: {
          userId_date_mealType: {
            userId: ctx.session.user.id,
            date,
            mealType: input.mealType,
          },
        },
        create: {
          userId: ctx.session.user.id,
          date,
          mealType: input.mealType,
          menuItemId: menu?.published ? input.menuItemId : null,
          preferenceId: menu?.published ? null : input.preferenceId,
        },
        update: {
          menuItemId: menu?.published ? input.menuItemId : null,
          preferenceId: menu?.published ? null : input.preferenceId,
        },
        include: {
          menuItem: { include: { preference: true } },
          preference: true,
        },
      });
    }),

  deleteOrder: protectedProcedure
    .input(z.object({
      date: z.string(),
      mealType: z.nativeEnum(MealType),
    }))
    .mutation(async ({ ctx, input }) => {
      const date = new Date(input.date);
      date.setUTCHours(0, 0, 0, 0);

      return ctx.db.order.delete({
        where: {
          userId_date_mealType: {
            userId: ctx.session.user.id,
            date,
            mealType: input.mealType,
          },
        },
      });
    }),

  // Admin: Get all orders for a date/meal
  getAllOrders: protectedProcedure
    .input(z.object({
      date: z.string(),
      mealType: z.nativeEnum(MealType),
    }))
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "ADMIN") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const date = new Date(input.date);
      date.setUTCHours(0, 0, 0, 0);

      return ctx.db.order.findMany({
        where: { date, mealType: input.mealType },
        include: {
          user: true,
          menuItem: { include: { preference: true } },
          preference: true,
        },
        orderBy: { user: { name: "asc" } },
      });
    }),

  // Admin: Get summary counts
  getOrderSummary: protectedProcedure
    .input(z.object({
      date: z.string(),
      mealType: z.nativeEnum(MealType),
    }))
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "ADMIN") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const date = new Date(input.date);
      date.setUTCHours(0, 0, 0, 0);

      const orders = await ctx.db.order.findMany({
        where: { date, mealType: input.mealType },
        include: {
          menuItem: true,
          preference: true,
        },
      });

      const summary: Record<string, number> = {};

      for (const order of orders) {
        const key = order.menuItem?.name ?? order.preference?.name ?? "Unknown";
        summary[key] = (summary[key] ?? 0) + 1;
      }

      return summary;
    }),
});
