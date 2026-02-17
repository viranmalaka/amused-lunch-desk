import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const userRouter = createTRPCRouter({
  getMe: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      include: { defaultPreference: true },
    });
  }),

  // Admin: Get all users
  getAll: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.session.user.role !== "ADMIN") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    return ctx.db.user.findMany({
      include: { defaultPreference: true },
      orderBy: { name: "asc" },
    });
  }),

  // Admin: Create user
  create: protectedProcedure
    .input(z.object({
      email: z.string().email(),
      name: z.string().min(1),
      role: z.enum(["ADMIN", "EMPLOYEE"]),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "ADMIN") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return ctx.db.user.create({
        data: {
          email: input.email.toLowerCase(),
          name: input.name,
          role: input.role,
        },
      });
    }),

  // Admin: Update user role
  updateRole: protectedProcedure
    .input(z.object({
      userId: z.string(),
      role: z.enum(["ADMIN", "EMPLOYEE"]),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "ADMIN") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return ctx.db.user.update({
        where: { id: input.userId },
        data: { role: input.role },
      });
    }),

  // Admin: Delete user
  delete: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "ADMIN") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      if (input.userId === ctx.session.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete yourself",
        });
      }

      return ctx.db.user.delete({
        where: { id: input.userId },
      });
    }),
});
