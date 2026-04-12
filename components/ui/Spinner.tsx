export function InlineSpinner() {
  return (
    <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
  );
}

export function PageSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
    </div>
  );
}

export function LoadingSpinner() {
  return (
    <div className="flex flex-1 items-center justify-center py-20">
      <div className="h-8 w-8 animate-spin rounded-full border-3 border-blue-600 border-t-transparent" />
    </div>
  );
}
