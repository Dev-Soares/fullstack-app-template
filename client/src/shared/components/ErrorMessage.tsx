interface ErrorMessageProps {
  message?: string
}

export const ErrorMessage = ({ message = 'Algo deu errado.' }: ErrorMessageProps) => (
  <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
    {message}
  </div>
)
