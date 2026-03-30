export default function LoadingSpinner() {
  return (
    <div className="flex flex-1 items-center justify-center py-20">
      <div className="h-8 w-8 animate-spin rounded-full border-3 border-blue-600 border-t-transparent" />
    </div>
  );
}