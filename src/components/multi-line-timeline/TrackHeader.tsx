import { type MultiLineTimelineTrack } from './types'

export function TrackHeader({ track }: { track: MultiLineTimelineTrack }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: track.color }} aria-hidden />
      <span className="text-sm font-semibold text-gray-dark">{track.name}</span>
    </div>
  )
}
