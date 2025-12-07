import { type ItemLine, type MultiLineTimelineTrack } from './types'

type TrackItemLineCardProps = {
  line: ItemLine
  track: MultiLineTimelineTrack
  top: number
  left: number
  onClose: () => void
}

export function TrackItemLineCard({ line, track, top, left, onClose }: TrackItemLineCardProps) {
  const dateText = (() => {
    if (line.at && line.endAt) return `${line.at} → ${line.endAt}`
    if (line.at) return line.at
    return 'No date'
  })()

  return (
    <div
      className="absolute z-30 w-72 max-w-xs rounded-xl border shadow-lg bg-white"
      style={{ top, left }}
    >
      <div className="flex items-start gap-3 p-4">
        <div
          className="mt-0.5 h-10 w-10 flex-shrink-0 rounded-full"
          style={{ backgroundColor: `${track.color}22`, border: `1px solid ${track.color}55`, boxShadow: `0 0 0 4px ${track.color}12` }}
        />
        <div className="min-w-0">
          <p className="text-[0.7rem] uppercase tracking-wide font-semibold text-gray-dark/70">{track.name}</p>
          <p className="text-sm font-semibold text-gray-dark leading-tight">{line.title}</p>
          <p className="text-xs text-gray mt-1">{dateText}</p>
          {line.annotation ? (
            <p className="mt-1 inline-flex items-center rounded-full border px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-gray-dark/90">
              {line.annotation}
            </p>
          ) : null}
        </div>
      </div>
      <div className="flex justify-end px-4 pb-3">
        <button
          type="button"
          onClick={onClose}
          className="text-xs font-semibold text-gray-dark rounded-full border px-3 py-1 hover:bg-gray-light/60"
        >
          Close
        </button>
      </div>
    </div>
  )
}
