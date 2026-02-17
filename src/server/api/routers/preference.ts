import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";

export const preferenceRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.preference.findMany({
      orderBy: { name: "asc" },
    });
  }),

  setUserDefault: protectedProcedure
    .input(z.object({ preferenceId: z.string().nullable() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: { defaultPreferenceId: input.preferenceId },
      });
    }),

  getUserDefault: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      include: { defaultPreference: true },
    });
    return user?.defaultPreference ?? null;
  }),
});
