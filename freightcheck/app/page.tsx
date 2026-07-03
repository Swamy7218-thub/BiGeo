import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-2xl flex-1 flex-col justify-center gap-8 px-6 py-24">
        <div className="flex flex-col gap-4">
          <p className="text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            FreightCheck
          </p>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight text-black dark:text-zinc-50">
            Your transporters&apos; bills have errors. We find them.
          </h1>
          <p className="text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Upload your freight bills and rate contracts. Our AI checks every trip against your
            contracted rates, catches duplicates, and flags detention claims with no proof. Most
            companies recover 2&ndash;5% of freight spend in the first audit.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="flex h-12 w-fit items-center justify-center rounded-full bg-black px-6 text-base font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          Get a free audit of your last 3 months
        </Link>

        <ol className="flex flex-col gap-2 text-base text-zinc-600 dark:text-zinc-400">
          <li>1. Upload your bills and rate contracts.</li>
          <li>2. Get a trip-by-trip audit report in minutes.</li>
          <li>3. Recover the money. Pay us only if we find something.</li>
        </ol>
      </main>
    </div>
  );
}
