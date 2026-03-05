import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { MealType } from "generated/prisma";

export const menuRouter = createTRPCRouter({
  getByDateAndType: protectedProcedure
    .input(z.object({
      date: z.string(),
      mealType: z.nativeEnum(MealType),
    }))
    .query(async ({ ctx, input }) => {
      const date = new Date(input.date);
      date.setUTCHours(0, 0, 0, 0);

      return ctx.db.menu.findUnique({
        where: {
          date_mealType: {
            date,
            mealType: input.mealType,
          },
        },
        include: {
          items: {
            include: { preference: true },
            orderBy: { name: "asc" },
          },
        },
      });
    }),

  getMenusForDate: protectedProcedure
    .input(z.object({ date: z.string() }))
    .query(async ({ ctx, input }) => {
      const date = new Date(input.date);
      date.setUTCHours(0, 0, 0, 0);

      return ctx.db.menu.findMany({
        where: { date },
        include: {
          items: {
            include: { preference: true },
            orderBy: { name: "asc" },
          },
        },
      });
    }),

  create: protectedProcedure
    .input(z.object({
      date: z.string(),
      mealType: z.nativeEnum(MealType),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "ADMIN") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const date = new Date(input.date);
      date.setUTCHours(0, 0, 0, 0);

      return ctx.db.menu.upsert({
        where: {
          date_mealType: {
            date,
            mealType: input.mealType,
          },
        },
        create: {
          date,
          mealType: input.mealType,
        },
        update: {},
        include: {
          items: {
            include: { preference: true },
          },
        },
      });
    }),

  publish: protectedProcedure
    .input(z.object({ menuId: z.string(), published: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "ADMIN") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const menu = await ctx.db.menu.update({
        where: { id: input.menuId },
        data: { published: input.published },
        include: { items: { include: { preference: true } } },
      });

      // Auto-convert preference orders to menu item orders
      if (input.published) {
        const orders = await ctx.db.order.findMany({
          where: {
            date: menu.date,
            mealType: menu.mealType,
            preferenceId: { not: null },
            menuItemId: null,
          },
        });

        for (const order of orders) {
          const matchingItem = menu.items.find(
            (item) => item.preferenceId === order.preferenceId
          );
          if (matchingItem) {
            await ctx.db.order.update({
              where: { id: order.id },
              data: { menuItemId: matchingItem.id },
            });
          }
        }
      }

      return menu;
    }),
  // Check for pre-orders that won't be matched when publishing
  getUnmatchedPreferences: protectedProcedure
    .input(z.object({ menuId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "ADMIN") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const menu = await ctx.db.menu.findUnique({
        where: { id: input.menuId },
        include: { items: { include: { preference: true } } },
      });

      if (!menu) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Menu not found" });
      }

      // Get preference IDs covered by menu items
      const coveredPreferenceIds = new Set(
        menu.items
          .map((item) => item.preferenceId)
          .filter((id): id is string => id !== null),
      );

      // Find orders for this date/mealType that have a preference but no menu item yet
      const unmatchedOrders = await ctx.db.order.findMany({
        where: {
          date: menu.date,
          mealType: menu.mealType,
          preferenceId: { not: null },
          menuItemId: null,
        },
        include: {
          preference: true,
          user: { select: { id: true, name: true, email: true } },
        },
      });

      // Group by preference, only keep those NOT covered by any menu item
      const warnings: {
        preferenceId: string;
        preferenceName: string;
        userCount: number;
        users: { name: string | null; email: string | null }[];
      }[] = [];

      const grouped = new Map<
        string,
        { preferenceName: string; users: { name: string | null; email: string | null }[] }
      >();

      for (const order of unmatchedOrders) {
        if (!order.preference || coveredPreferenceIds.has(order.preferenceId!)) continue;

        const key = order.preferenceId!;
        if (!grouped.has(key)) {
          grouped.set(key, {
            preferenceName: order.preference.name,
            users: [],
          });
        }
        grouped.get(key)!.users.push({
          name: order.user.name,
          email: order.user.email,
        });
      }

      for (const [preferenceId, data] of grouped) {
        warnings.push({
          preferenceId,
          preferenceName: data.preferenceName,
          userCount: data.users.length,
          users: data.users,
        });
      }

      return warnings;
    }),


  addItem: protectedProcedure
    .input(z.object({
      menuId: z.string(),
      name: z.string().min(1),
      preferenceId: z.string().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "ADMIN") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return ctx.db.menuItem.create({
        data: {
          menuId: input.menuId,
          name: input.name,
          preferenceId: input.preferenceId,
        },
        include: { preference: true },
      });
    }),

  updateItem: protectedProcedure
    .input(z.object({
      itemId: z.string(),
      name: z.string().min(1),
      preferenceId: z.string().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "ADMIN") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return ctx.db.menuItem.update({
        where: { id: input.itemId },
        data: {
          name: input.name,
          preferenceId: input.preferenceId,
        },
        include: { preference: true },
      });
    }),

  deleteItem: protectedProcedure
    .input(z.object({ itemId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "ADMIN") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return ctx.db.menuItem.delete({
        where: { id: input.itemId },
      });
    }),
});
