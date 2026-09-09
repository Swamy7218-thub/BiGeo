import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(amount)
}

export function formatCurrencyShort(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`
  return `₹${amount}`
}

export function formatDate(d: string): string {
  try {
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch { return d }
}

export function getConfidenceColor(c: number) {
  if (c >= 0.9) return 'text-green-600'
  if (c >= 0.75) return 'text-yellow-600'
  return 'text-red-600'
}

export function getFlagLabel(type: string): string {
  const m: Record<string, string> = {
    rate_mismatch: 'Rate Mismatch',
    duplicate: 'Duplicate',
    detention_invalid: 'Invalid Detention',
    missing_pod: 'Missing POD',
    unknown_lane: 'Unknown Lane',
  }
  return m[type] ?? type
}

export function getFlagColor(type: string): string {
  const m: Record<string, string> = {
    rate_mismatch: 'bg-red-100 text-red-700',
    duplicate: 'bg-purple-100 text-purple-700',
    detention_invalid: 'bg-orange-100 text-orange-700',
    missing_pod: 'bg-yellow-100 text-yellow-700',
    unknown_lane: 'bg-gray-100 text-gray-600',
  }
  return m[type] ?? 'bg-gray-100 text-gray-600'
}
