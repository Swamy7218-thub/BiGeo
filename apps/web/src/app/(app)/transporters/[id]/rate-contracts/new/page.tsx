import { notFound } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { RateContractUploadForm } from "@/components/RateContractUploadForm"

export default async function NewRateContractPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: transporter } = await supabase.from("transporters").select("*").eq("id", id).single()
  if (!transporter) notFound()

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <Link href={`/transporters/${id}`} className="text-sm text-slate-500 hover:underline">
          ← {transporter.name}
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-slate-900">Upload rate contract</h1>
        <p className="mt-1 text-sm text-slate-500">
          PDF or Excel. We&apos;ll extract lane rates, vehicle types, and detention terms — you&apos;ll review and
          confirm before anything prices a bill (FR-2, FR-3).
        </p>
      </div>
      <RateContractUploadForm transporterId={id} />
    </div>
  )
}
