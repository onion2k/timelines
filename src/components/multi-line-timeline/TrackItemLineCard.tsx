import { type ItemLine, type MultiLineTimelineTrack } from './types'

type TrackItemLineCardProps = {
  line: ItemLine
  track: MultiLineTimelineTrack
  top: number
  left: number
}

const DAY_MS = 1000 * 60 * 60 * 24

function formatDate(label: string, value?: string) {
  if (!value) return `${label}: —`
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return `${label}: —`
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' })
  const day = date.getUTCDate().toString().padStart(2, '0')
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0')
  const year = date.getUTCFullYear()
  return `${label}: ${weekday}, ${day}/${month}/${year}`
}

function formatDuration(at?: string, endAt?: string) {
  if (!at || !endAt) return 'Duration: —'
  const start = new Date(at)
  const end = new Date(endAt)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 'Duration: —'
  const diffDays = Math.max(0, Math.round((end.getTime() - start.getTime()) / DAY_MS) + 1)
  const unit = diffDays === 1 ? 'day' : 'days'
  return `Duration: ${diffDays} ${unit}`
}

export function TrackItemLineCard({ line, track, top, left }: TrackItemLineCardProps) {
  const startText = formatDate('Start', line.at)
  const endText = formatDate('Done', line.endAt)
  const durationText = formatDuration(line.at, line.endAt)

  return (
    <div
      className="fixed z-50 w-72 max-w-xs rounded-xl border shadow-lg bg-white"
      style={{ top, left }}
    >
      <div className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="text-[0.7rem] uppercase tracking-wide font-semibold text-gray-dark/70">{track.name}</p>
          <p className="text-[0.78rem] font-mono text-gray-dark/80">{line.id}</p>
          <p className="text-sm font-semibold text-gray-dark leading-tight">{line.title}</p>
        </div>
        {line.annotation ? (
          <span
            className="text-[0.7rem] uppercase tracking-wide font-semibold"
            style={{ color: track.color }}
          >
            {line.annotation}
          </span>
        ) : null}
      </div>
      <div className="flex flex-col gap-1 px-4 pb-4">
        <p className="text-xs text-gray-dark/80">{startText}</p>
        <p className="text-xs text-gray-dark/80">{endText}</p>
        <p className="text-xs font-semibold text-gray-dark">{durationText}</p>
      </div>
    </div>
  )
}
