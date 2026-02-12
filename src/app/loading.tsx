export default function Loading() {
  return (
    <div className="flex h-screen w-full items-center justify-center p-6">
      <div className="w-full max-w-2xl space-y-3">
        <div className="h-6 w-48 rounded-md bg-muted animate-pulse" />
        <div className="h-24 w-full rounded-xl bg-muted/70 animate-pulse" />
        <div className="h-24 w-full rounded-xl bg-muted/70 animate-pulse" />
      </div>
    </div>
  )
}
