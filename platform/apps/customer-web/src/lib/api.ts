const API_URL = process.env.NEXT_PUBLIC_BOOKING_API_URL || "http://localhost:8005";

export type Quote = {
  distance_km: number;
  billable_kg: number;
  service_level: string;
  price_inr: number;
  eta_hours: number;
};

export async function getQuote(input: {
  origin_address: string;
  destination_address: string;
  weight_kg: number;
  volume_cbm?: number;
  service_level?: "standard" | "express";
}): Promise<Quote> {
  const res = await fetch(`${API_URL}/quote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Failed to fetch quote");
  return res.json();
}

export async function sendOtp(phone: string) {
  const res = await fetch(`${API_URL}/auth/otp/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone }),
  });
  if (!res.ok) throw new Error("Failed to send OTP");
  return res.json();
}

export async function verifyOtp(phone: string, otp: string, role = "customer") {
  const res = await fetch(`${API_URL}/auth/otp/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, otp, role }),
  });
  if (!res.ok) throw new Error("Invalid OTP");
  return res.json() as Promise<{ token: string; role: string }>;
}

export async function createBooking(token: string, payload: Record<string, unknown>) {
  const res = await fetch(`${API_URL}/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create booking");
  return res.json();
}

export async function getBooking(bookingId: string) {
  const res = await fetch(`${API_URL}/bookings/${bookingId}`);
  if (!res.ok) throw new Error("Booking not found");
  return res.json();
}
