import { buildDurationSpans, buildItemClusters, computeTopPx, parseAtDate } from './utils'
import {
  type ItemCluster,
  type MultiLineTimelineTrack,
  type PositionedItem,
} from './types'
import { TrackDurationSpans } from './TrackDurationSpans'
import { TrackHeader } from './TrackHeader'
import { TrackItemCluster } from './TrackItemCluster'

type MultiLineTimelineTrackProps = {
  track: MultiLineTimelineTrack
  trackHeight: number
  startWeekDate: Date | null
  totalWeeks: number
  offsetTop: number
  guidePadding: number
  weekHeight: number
  selectedId: string | null
  onSelect: (id: string) => void
}

export function MultiLineTimelineTrack({
  track,
  trackHeight,
  startWeekDate,
  totalWeeks,
  offsetTop,
  guidePadding,
  weekHeight,
  selectedId,
  onSelect,
}: MultiLineTimelineTrackProps) {
  const positionedItems: PositionedItem[] = track.items.map((item, index) => {
    const atDate = parseAtDate(item.at)
    const topPx = computeTopPx({
      atDate,
      startWeekDate,
      totalWeeks,
      index,
      totalItems: track.items.length,
      weekHeight,
      trackHeight,
      offsetTop,
    })
    return { item, topPx }
  })
  const clusters: ItemCluster[] = buildItemClusters(positionedItems)
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
          {clusters.map((cluster) => (
            <TrackItemCluster
              key={`cluster-${cluster.id}`}
              cluster={cluster}
              color={track.color}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
