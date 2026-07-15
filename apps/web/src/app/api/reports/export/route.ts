import { NextRequest, NextResponse } from "next/server"
import type ExcelJS from "exceljs"
import { apiErrorResponse, ApiError, requireUser } from "@/lib/authz"
import { buildBillWorkbook, buildMonthlyWorkbook } from "@/lib/export/xlsx"
import type { Tables } from "@/types/database"

type Flag = Tables<"flags">
type TripLine = Tables<"trip_lines"> & { flags: Flag[] }

/** FR-17: exportable audit report per bill (?bill_id=) or per month (?month=YYYY-MM), formatted to send to the transporter. */
export async function GET(req: NextRequest) {
  try {
    const { supabase } = await requireUser()
    const { searchParams } = new URL(req.url)
    const billId = searchParams.get("bill_id")
    const month = searchParams.get("month")

    if (billId) {
      const { data: bill } = await supabase.from("bills").select("*, transporters(name)").eq("id", billId).single()
      if (!bill) throw new ApiError(404, "NOT_FOUND", "Bill not found.")

      const { data: tripLines } = await supabase.from("trip_lines").select("*, flags(*)").eq("bill_id", billId)

      const buffer = await buildBillWorkbook(bill, (tripLines as unknown as TripLine[]) ?? [])
      return xlsxResponse(buffer, `${bill.bill_number ?? bill.id}-audit-report.xlsx`)
    }

    if (month) {
      if (!/^\d{4}-\d{2}$/.test(month)) {
        throw new ApiError(400, "VALIDATION_ERROR", "month must be in YYYY-MM format.", "month")
      }
      const from = `${month}-01`
      const [y, m] = month.split("-").map(Number)
      const to = new Date(y, m, 1).toISOString().slice(0, 10)

      const { data: bills } = await supabase
        .from("bills")
        .select("*, transporters(name)")
        .gte("created_at", from)
        .lt("created_at", to)
        .order("created_at")

      const billIds = (bills ?? []).map((b) => b.id)
      const { data: tripLines } =
        billIds.length > 0
          ? await supabase.from("trip_lines").select("*, flags(*)").in("bill_id", billIds)
          : { data: [] as TripLine[] }

      const tripLinesByBill = new Map<string, TripLine[]>()
      for (const line of (tripLines as unknown as TripLine[]) ?? []) {
        const list = tripLinesByBill.get(line.bill_id) ?? []
        list.push(line)
        tripLinesByBill.set(line.bill_id, list)
      }

      const buffer = await buildMonthlyWorkbook(bills ?? [], tripLinesByBill)
      return xlsxResponse(buffer, `freightcheck-${month}-audit-report.xlsx`)
    }

    throw new ApiError(400, "VALIDATION_ERROR", "Provide either bill_id or month.")
  } catch (error) {
    return apiErrorResponse(error)
  }
}

function xlsxResponse(buffer: ExcelJS.Buffer, filename: string) {
  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}
