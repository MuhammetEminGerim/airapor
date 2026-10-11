type TimingMeta = Record<string, string | number | boolean | null | undefined>

type DevTimer = {
  mark: (label: string, meta?: TimingMeta) => void
  end: (meta?: TimingMeta) => void
}

const isDevBrowser = () => process.env.NODE_ENV === 'development' && typeof window !== 'undefined'

export function createDevTimer(scope: string): DevTimer {
  const enabled = isDevBrowser()
  const startedAt = enabled ? performance.now() : 0

  const print = (kind: 'mark' | 'end', label: string, meta?: TimingMeta) => {
    if (!enabled) return
    const elapsedMs = Math.round(performance.now() - startedAt)
    if (meta) {
      console.info(`[perf:${scope}] ${kind}:${label} +${elapsedMs}ms`, meta)
      return
    }
    console.info(`[perf:${scope}] ${kind}:${label} +${elapsedMs}ms`)
  }

  return {
    mark: (label, meta) => print('mark', label, meta),
    end: (meta) => print('end', 'done', meta),
  }
}
