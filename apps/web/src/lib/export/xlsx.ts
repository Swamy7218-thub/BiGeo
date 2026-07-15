import "server-only"
import ExcelJS from "exceljs"
import type { Tables } from "@/types/database"

type Flag = Tables<"flags">
type TripLine = Tables<"trip_lines"> & { flags: Flag[] }
type Bill = Tables<"bills"> & { transporters?: { name: string } | null }

const HEADER = [
  "Bill Number",
  "Transporter",
  "LR Number",
  "Trip Date",
  "Origin",
  "Destination",
  "Vehicle Number",
  "Vehicle Type",
  "Base Amount",
  "Extra Charges",
  "Line Total",
  "Flag Type",
  "Flag Reason",
  "Expected Amount",
  "Claimed Amount",
  "Flag Status",
]

function addBillRows(sheet: ExcelJS.Worksheet, bill: Bill, tripLines: TripLine[]) {
  for (const line of tripLines) {
    const extras = ((line.extra_charges_json as { type: string; amount: number }[] | null) ?? []).reduce(
      (s, c) => s + c.amount,
      0
    )
    const total = line.base_amount + extras
    const rows = line.flags.length > 0 ? line.flags : [null]
    for (const flag of rows) {
      sheet.addRow([
        bill.bill_number ?? "",
        bill.transporters?.name ?? "",
        line.lr_number ?? "",
        line.trip_date ?? "",
        line.origin ?? "",
        line.destination ?? "",
        line.vehicle_number ?? "",
        line.vehicle_type ?? "",
        line.base_amount,
        extras,
        total,
        flag?.flag_type ?? "",
        flag?.reason ?? "",
        flag?.expected_amount ?? "",
        flag?.claimed_amount ?? "",
        flag?.status ?? "",
      ])
    }
  }
}

function styleSheet(sheet: ExcelJS.Worksheet) {
  sheet.addRow(HEADER)
  sheet.getRow(1).font = { bold: true }
  sheet.columns.forEach((col) => {
    col.width = 18
  })
}

export async function buildBillWorkbook(bill: Bill, tripLines: TripLine[]): Promise<ExcelJS.Buffer> {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet("Audit Report")
  styleSheet(sheet)
  addBillRows(sheet, bill, tripLines)

  const summary = workbook.addWorksheet("Summary")
  summary.addRows([
    ["Bill number", bill.bill_number ?? ""],
    ["Transporter", bill.transporters?.name ?? ""],
    ["Total claimed", bill.total_claimed],
    ["Total approved", bill.total_approved],
    ["Total flagged", bill.total_flagged],
  ])
  summary.getColumn(1).font = { bold: true }
  summary.getColumn(1).width = 20
  summary.getColumn(2).width = 24

  return workbook.xlsx.writeBuffer()
}

export async function buildMonthlyWorkbook(
  bills: Bill[],
  tripLinesByBill: Map<string, TripLine[]>
): Promise<ExcelJS.Buffer> {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet("Monthly Audit Report")
  styleSheet(sheet)
  for (const bill of bills) {
    addBillRows(sheet, bill, tripLinesByBill.get(bill.id) ?? [])
  }

  const summary = workbook.addWorksheet("Summary")
  summary.addRow(["Bill Number", "Transporter", "Claimed", "Approved", "Flagged", "Status"])
  summary.getRow(1).font = { bold: true }
  for (const bill of bills) {
    summary.addRow([
      bill.bill_number ?? "",
      bill.transporters?.name ?? "",
      bill.total_claimed,
      bill.total_approved,
      bill.total_flagged,
      bill.status,
    ])
  }
  summary.columns.forEach((col) => {
    col.width = 18
  })

  return workbook.xlsx.writeBuffer()
}
