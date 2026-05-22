import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-6 py-16">
      <div className="max-w-lg text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">404</p>
        <h1 className="mt-3 text-4xl font-bold text-neutral-900">Page not found</h1>
        <p className="mt-4 text-neutral-600">
          The page may have moved, or the link may be incomplete. Continue from a known workspace or product page.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/dashboard" className="btn btn-primary">
            Dashboard
          </Link>
          <Link href="/free-valuation" className="btn btn-secondary">
            Free valuation
          </Link>
          <Link href="/pricing" className="btn btn-secondary">
            Pricing
          </Link>
        </div>
      </div>
    </main>
  );
}
