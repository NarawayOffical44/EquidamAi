type PageLoaderProps = {
  message?: string;
  detail?: string;
};

export function PageLoader({
  message = "Preparing Evaldam",
  detail = "Loading your valuation workspace...",
}: PageLoaderProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div role="status" aria-live="polite" className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm font-bold text-gray-900">{message}</p>
        <p className="mt-1 text-xs text-gray-500">{detail}</p>
        <span className="sr-only">Loading</span>
      </div>
    </div>
  );
}
