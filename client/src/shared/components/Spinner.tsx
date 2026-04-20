interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
}

const sizes = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-10 w-10',
}

export const Spinner = ({ size = 'md' }: SpinnerProps) => (
  <div
    className={`${sizes[size]} animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900 dark:border-neutral-600 dark:border-t-neutral-100`}
  />
)
