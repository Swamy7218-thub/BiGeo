import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-4xl font-bold">
        Ship anywhere in rural India, <span className="text-accent-500">tracked end to end</span>
      </h1>
      <p className="max-w-xl text-white/70">
        Get an instant price, book a pickup, and track delivery down to the village — even
        where Google Maps gives up.
      </p>
      <div className="flex gap-4">
        <Link href="/quote" className="rounded-lg bg-accent-500 px-6 py-3 font-semibold hover:bg-accent-600">
          Get a Quote
        </Link>
        <Link href="/book" className="rounded-lg border border-border px-6 py-3 font-semibold hover:bg-white/5">
          Book a Shipment
        </Link>
      </div>
    </main>
  );
}
