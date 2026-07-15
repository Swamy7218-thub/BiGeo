import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { SignOutButton } from "@/components/SignOutButton"

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/transporters", label: "Transporters" },
  { href: "/bills", label: "Bills" },
  { href: "/reports", label: "Reports" },
]

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) redirect("/login")

  const { data: user } = await supabase.from("users").select("*, companies(name)").eq("id", authUser.id).single()

  if (!user) {
    return (
      <div className="flex flex-1 items-center justify-center bg-slate-50 px-4">
        <div className="max-w-sm text-center">
          <h1 className="text-lg font-semibold text-slate-900">Finishing setup…</h1>
          <p className="mt-2 text-sm text-slate-500">
            We couldn&apos;t find a company for this account yet. If this persists, sign out and sign up again.
          </p>
        </div>
      </div>
    )
  }

  const companyName = (user as unknown as { companies: { name: string } | null }).companies?.name ?? "Your company"

  return (
    <div className="flex min-h-screen flex-1 bg-slate-50">
      <aside className="hidden w-56 shrink-0 border-r border-slate-200 bg-white md:flex md:flex-col">
        <div className="px-5 py-5">
          <span className="text-lg font-semibold text-slate-900">FreightCheck</span>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-slate-200 px-3 py-4">
          <p className="truncate px-2 text-xs text-slate-500">{companyName}</p>
          <p className="truncate px-2 text-xs text-slate-400">{user.email}</p>
        </div>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3 md:hidden">
          <span className="text-lg font-semibold text-slate-900">FreightCheck</span>
          <SignOutButton />
        </header>
        <div className="hidden items-center justify-end border-b border-slate-200 bg-white px-6 py-3 md:flex">
          <SignOutButton />
        </div>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
