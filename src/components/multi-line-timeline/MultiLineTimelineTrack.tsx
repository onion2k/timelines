import { buildDurationSpans, buildItemLines } from './utils'
import { type MultiLineTimelineTrack } from './types'
import { TrackDurationSpans } from './TrackDurationSpans'
import { TrackHeader } from './TrackHeader'
import { TrackItemLine } from './TrackItemLine'

type MultiLineTimelineTrackProps = {
  track: MultiLineTimelineTrack
  trackHeight: number
  startWeekDate: Date | null
  totalWeeks: number
  offsetTop: number
  guidePadding: number
  weekHeight: number
  lineWidth: number
  lineSpacing: number
}

export function MultiLineTimelineTrack({
  track,
  trackHeight,
  startWeekDate,
  totalWeeks,
  offsetTop,
  guidePadding,
  weekHeight,
  lineWidth,
  lineSpacing,
}: MultiLineTimelineTrackProps) {
  const lines = buildItemLines({
    items: track.items,
    trackHeight,
    startWeekDate,
    totalWeeks,
    weekHeight,
    offsetTop,
  })
  const durationSpans = buildDurationSpans({
    track,
    trackHeight,
    startWeekDate,
    totalWeeks,
    weekHeight,
    offsetTop,
  })

  return (
    <div className="min-w-[260px]" style={{ marginTop: offsetTop }}>
      <TrackHeader track={track} />
      <div className="relative rounded-2xl" style={{ background: 'linear-gradient(180deg, rgba(211,220,230,0.5) 0%, rgba(211,220,230,0.1) 100%)', padding: guidePadding }}>
        <div className="relative" style={{ height: trackHeight }}>
          <TrackDurationSpans spans={durationSpans} color={track.color} />
          <div
            className="absolute left-0.5 top-0 h-full w-1 rounded-full"
            style={{ backgroundColor: track.color, boxShadow: `0 0 0 6px ${track.color}1a` }}
            aria-hidden
          />
          {lines.map((line) => (
            <TrackItemLine
              key={line.id}
              line={line}
              color={track.color}
              laneWidth={lineSpacing}
              lineWidth={lineWidth}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
