import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { BillUploadForm } from "@/components/BillUploadForm"

export default async function NewBillPage({
  searchParams,
}: {
  searchParams: Promise<{ transporter_id?: string }>
}) {
  const { transporter_id: transporterId } = await searchParams
  const supabase = await createClient()
  const { data: transporters } = await supabase.from("transporters").select("id, name").order("name")

  if (!transporters || transporters.length === 0) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <h1 className="text-xl font-semibold text-slate-900">Upload a bill</h1>
        <p className="text-sm text-slate-500">
          Add a transporter first —{" "}
          <Link href="/transporters" className="font-medium text-slate-900 underline">
            go to Transporters
          </Link>
          .
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Upload a bill</h1>
        <p className="mt-1 text-sm text-slate-500">
          PDF, image, or Excel. Every trip line is extracted and checked against the rate master automatically
          (FR-5–FR-11).
        </p>
      </div>
      <BillUploadForm transporters={transporters} defaultTransporterId={transporterId} />
    </div>
  )
}
