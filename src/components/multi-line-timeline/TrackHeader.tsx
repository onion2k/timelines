import { type MultiLineTimelineTrack } from './types'

export function TrackHeader({ track }: { track: MultiLineTimelineTrack }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: track.color }} aria-hidden />
      <span className="text-sm font-semibold text-gray-dark">{track.name}</span>
      <span className="rounded-full border border-gray-light/70 bg-white px-2 py-0.5 text-[10px] font-semibold text-gray-400">
        {track.items.length} items
      </span>
    </div>
  )
}
