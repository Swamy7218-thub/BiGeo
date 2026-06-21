"use client";

import { useState } from "react";
import { sendOtp, verifyOtp, getQuote, createBooking } from "@/lib/api";

type Step = "phone" | "otp" | "details" | "confirmed";

export default function BookPage() {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [token, setToken] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    origin_address: "",
    destination_address: "",
    weight_kg: "",
    service_level: "standard" as "standard" | "express",
    pickup_date: "",
    consignee_name: "",
    consignee_phone: "",
  });

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await sendOtp(phone);
      setStep("otp");
    } catch {
      setError("Could not send OTP. Check the phone number.");
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const result = await verifyOtp(phone, otp, "customer");
      setToken(result.token);
      setStep("details");
    } catch {
      setError("Incorrect OTP.");
    }
  }

  async function handleCreateBooking(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const quote = await getQuote({
        origin_address: form.origin_address,
        destination_address: form.destination_address,
        weight_kg: parseFloat(form.weight_kg),
        service_level: form.service_level,
      });
      const booking = await createBooking(token, {
        ...form,
        weight_kg: parseFloat(form.weight_kg),
        quoted_price_inr: quote.price_inr,
      });
      setBookingId(booking.booking_id);
      setStep("confirmed");
    } catch {
      setError("Could not create booking. Please try again.");
    }
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-12">
      <h1 className="mb-6 text-2xl font-bold">Book a Shipment</h1>

      {step === "phone" && (
        <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
          <input
            className="rounded-lg border border-border bg-surface px-4 py-3"
            placeholder="+91XXXXXXXXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <button type="submit" className="rounded-lg bg-accent-500 px-6 py-3 font-semibold hover:bg-accent-600">
            Send OTP
          </button>
        </form>
      )}

      {step === "otp" && (
        <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
          <input
            className="rounded-lg border border-border bg-surface px-4 py-3"
            placeholder="Enter 4-digit OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
          />
          <button type="submit" className="rounded-lg bg-accent-500 px-6 py-3 font-semibold hover:bg-accent-600">
            Verify
          </button>
        </form>
      )}

      {step === "details" && (
        <form onSubmit={handleCreateBooking} className="flex flex-col gap-4">
          <input
            className="rounded-lg border border-border bg-surface px-4 py-3"
            placeholder="Pickup address"
            value={form.origin_address}
            onChange={(e) => setForm({ ...form, origin_address: e.target.value })}
            required
          />
          <input
            className="rounded-lg border border-border bg-surface px-4 py-3"
            placeholder="Drop address"
            value={form.destination_address}
            onChange={(e) => setForm({ ...form, destination_address: e.target.value })}
            required
          />
          <input
            className="rounded-lg border border-border bg-surface px-4 py-3"
            placeholder="Weight (kg)"
            type="number"
            min="0.1"
            step="0.1"
            value={form.weight_kg}
            onChange={(e) => setForm({ ...form, weight_kg: e.target.value })}
            required
          />
          <input
            className="rounded-lg border border-border bg-surface px-4 py-3"
            placeholder="Pickup date"
            type="date"
            value={form.pickup_date}
            onChange={(e) => setForm({ ...form, pickup_date: e.target.value })}
            required
          />
          <input
            className="rounded-lg border border-border bg-surface px-4 py-3"
            placeholder="Consignee name"
            value={form.consignee_name}
            onChange={(e) => setForm({ ...form, consignee_name: e.target.value })}
            required
          />
          <input
            className="rounded-lg border border-border bg-surface px-4 py-3"
            placeholder="Consignee phone (+91XXXXXXXXXX)"
            value={form.consignee_phone}
            onChange={(e) => setForm({ ...form, consignee_phone: e.target.value })}
            required
          />
          <select
            className="rounded-lg border border-border bg-surface px-4 py-3"
            value={form.service_level}
            onChange={(e) => setForm({ ...form, service_level: e.target.value as "standard" | "express" })}
          >
            <option value="standard">Standard</option>
            <option value="express">Express</option>
          </select>
          <button type="submit" className="rounded-lg bg-accent-500 px-6 py-3 font-semibold hover:bg-accent-600">
            Confirm Booking
          </button>
        </form>
      )}

      {step === "confirmed" && (
        <div className="rounded-lg border border-border bg-surface p-6 text-center">
          <p className="text-xl font-semibold text-accent-500">Booking confirmed!</p>
          <p className="mt-2 text-white/70">Consignment ID: {bookingId}</p>
          <a href={`/track/${bookingId}`} className="mt-4 inline-block underline">
            Track this shipment →
          </a>
        </div>
      )}

      {error && <p className="mt-4 text-red-400">{error}</p>}
    </main>
  );
}
