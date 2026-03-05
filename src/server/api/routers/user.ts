import { z } from "zod";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
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

    const users = await ctx.db.user.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        password: true,
        tempPassword: true,
        defaultPreference: true,
      },
    });

    // Don't expose actual password hash, just whether it exists
    return users.map((user) => ({
      ...user,
      password: user.password ? true : false,
    }));
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

  // Admin: Set temporary password for a user
  setTempPassword: protectedProcedure
    .input(z.object({
      userId: z.string(),
      password: z.string().min(6),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "ADMIN") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const hashedPassword = await bcrypt.hash(input.password, 10);

      return ctx.db.user.update({
        where: { id: input.userId },
        data: {
          password: hashedPassword,
          tempPassword: true,
          passwordUpdatedAt: new Date(),
        },
      });
    }),

  // Admin: Clear password (revert to AD-only login)
  clearPassword: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "ADMIN") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return ctx.db.user.update({
        where: { id: input.userId },
        data: {
          password: null,
          tempPassword: false,
          passwordUpdatedAt: null,
        },
      });
    }),

  // User: Change own password
  changePassword: protectedProcedure
    .input(z.object({
      currentPassword: z.string(),
      newPassword: z.string().min(6),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
      });

      if (!user?.password) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No password set for this account",
        });
      }

      const isValid = await bcrypt.compare(input.currentPassword, user.password);
      if (!isValid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Current password is incorrect",
        });
      }

      const hashedPassword = await bcrypt.hash(input.newPassword, 10);

      return ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: {
          password: hashedPassword,
          tempPassword: false,
          passwordUpdatedAt: new Date(),
        },
      });
    }),
});
