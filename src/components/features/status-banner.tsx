'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, CheckCircle2, Info, Loader2 } from 'lucide-react'

type BannerState = 'loading' | 'success' | 'error' | 'info'

type StatusBannerProps = {
  state: BannerState
  title: string
  message?: string
}

export function StatusBanner({ state, title, message }: StatusBannerProps) {
  const icon =
    state === 'loading' ? (
      <Loader2 className="h-4 w-4 animate-spin" />
    ) : state === 'success' ? (
      <CheckCircle2 className="h-4 w-4" />
    ) : state === 'error' ? (
      <AlertCircle className="h-4 w-4" />
    ) : (
      <Info className="h-4 w-4" />
    )

  const className =
    state === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200'
      : state === 'error'
        ? 'border-red-200 bg-red-50 text-red-900 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200'
        : state === 'loading'
          ? 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-200'
          : 'border-zinc-200 bg-zinc-50 text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-200'

  return (
    <Alert className={className}>
      {icon}
      <AlertTitle>{title}</AlertTitle>
      {message ? <AlertDescription>{message}</AlertDescription> : null}
    </Alert>
  )
}

