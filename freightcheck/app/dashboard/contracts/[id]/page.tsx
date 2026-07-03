import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/server";
import { RateLineConfirmForm } from "@/components/RateLineConfirmForm";
import type { RateLine } from "@/lib/extraction/schema";

export const dynamic = "force-dynamic";

export default async function ContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = supabaseAdmin();

  const { data: contract } = await db
    .from("rate_contracts")
    .select("*, transporters(name)")
    .eq("id", id)
    .single();
  if (!contract) notFound();

  const { data: rateLines } = await db
    .from("rate_lines")
    .select("origin, destination, vehicle_type, rate, rate_basis, detention_free_days, detention_rate_per_day, diesel_escalation_clause")
    .eq("contract_id", id)
    .returns<RateLine[]>();

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold">
        {contract.transporters?.name ?? "Rate contract"}{" "}
        <span className="text-base font-normal text-zinc-500">({contract.status})</span>
      </h1>
      <RateLineConfirmForm
        contractId={id}
        initialRateLines={rateLines ?? []}
        alreadyConfirmed={contract.status === "confirmed"}
      />
    </div>
  );
}
