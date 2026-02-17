import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { Nav } from "~/components/nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <>
      <Nav
        userName={session.user.name ?? null}
        userRole={session.user.role}
      />
      <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
    </>
  );
}
