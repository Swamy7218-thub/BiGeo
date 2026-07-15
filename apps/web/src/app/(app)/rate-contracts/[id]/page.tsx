import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { RateMasterReview } from "@/components/RateMasterReview"

export default async function RateContractPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: contract } = await supabase
    .from("rate_contracts")
    .select("*, rate_lines(*), transporters(id, name)")
    .eq("id", id)
    .single()
  if (!contract) notFound()

  const transporter = (contract as unknown as { transporters: { id: string; name: string } }).transporters

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link href={`/transporters/${transporter.id}`} className="text-sm text-slate-500 hover:underline">
          ← {transporter.name}
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-slate-900">Rate master review</h1>
        <p className="mt-1 text-sm text-slate-500">
          {contract.valid_from ?? "?"} → {contract.valid_to ?? "open-ended"}
        </p>
      </div>

      <RateMasterReview contract={contract} />
    </div>
  )
}
