const AuthSkeleton = () => (
  <div className="flex w-full max-w-sm animate-pulse flex-col gap-5">
    <div className="flex flex-col gap-2">
      <div className="h-7 w-24 rounded bg-neutral-200 dark:bg-neutral-700" />
      <div className="h-4 w-48 rounded bg-neutral-200 dark:bg-neutral-700" />
    </div>
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <div className="h-4 w-16 rounded bg-neutral-200 dark:bg-neutral-700" />
        <div className="h-10 w-full rounded-xl bg-neutral-200 dark:bg-neutral-700" />
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="h-4 w-12 rounded bg-neutral-200 dark:bg-neutral-700" />
        <div className="h-10 w-full rounded-xl bg-neutral-200 dark:bg-neutral-700" />
      </div>
    </div>
    <div className="h-10 w-full rounded-xl bg-neutral-200 dark:bg-neutral-700" />
  </div>
)

export default AuthSkeleton
