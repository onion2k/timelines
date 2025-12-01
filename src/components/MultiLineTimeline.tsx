import { type ReactNode, useState } from 'react'

export type MultiLineTimelineItem = {
  id: string
  title: string
  annotation: string
  at?: string
  endAt?: string
  icon?: ReactNode
}

export type MultiLineTimelineTrack = {
  id: string
  name: string
  color: string
  items: MultiLineTimelineItem[]
  startWeek?: number
  endWeek?: number
}

type MultiLineTimelineProps = {
  tracks: MultiLineTimelineTrack[]
  weeks?: number
  sprintLength?: number
  weekHeight?: number
}

const DAY_MS = 1000 * 60 * 60 * 24
const WEEK_MS = DAY_MS * 7
const CARD_HEIGHT_ESTIMATE = 70
const CARD_ANCHOR_OFFSET = 14
const STACK_X_OFFSET = 18
const STACK_SLOP = 4
const STACK_LEFT_BASE = 16
const BASE_Z_INDEX = 100
const SELECTED_Z_INDEX = 1000

function clampNumber(value: number, min: number, max: number) {
  if (Number.isNaN(value)) return min
  return Math.min(max, Math.max(min, value))
}

function normalizeDateToUTC(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

function getStartOfWeek(date: Date) {
  const d = normalizeDateToUTC(date)
  const day = d.getUTCDay()
  const diff = (day + 6) % 7 // Monday as start
  d.setUTCDate(d.getUTCDate() - diff)
  return d
}

function getEndOfWeek(date: Date) {
  const start = getStartOfWeek(date)
  start.setUTCDate(start.getUTCDate() + 6)
  return start
}

function parseAtDate(at?: string): Date | null {
  if (!at) return null
  const parsed = new Date(at)
  return Number.isNaN(parsed.getTime()) ? null : normalizeDateToUTC(parsed)
}

function computeTopPx({
  atDate,
  startWeekDate,
  totalWeeks,
  index,
  totalItems,
  weekHeight,
  trackHeight,
  offsetTop,
}: {
  atDate?: Date | null
  startWeekDate?: Date | null
  totalWeeks: number
  index: number
  totalItems: number
  weekHeight: number
  trackHeight: number
  offsetTop: number
}) {
  if (atDate && startWeekDate && totalWeeks > 0) {
    const diffWeeks = (atDate.getTime() - startWeekDate.getTime()) / WEEK_MS
    const clampedWeeks = clampNumber(diffWeeks, 0, Math.max(0, totalWeeks - 1))
    const position = clampedWeeks * weekHeight - offsetTop
    return clampNumber(position, 0, trackHeight)
  }
  if (totalItems <= 1) return trackHeight / 2
  return (index / (totalItems - 1)) * trackHeight
}

type PositionedItem = { item: MultiLineTimelineItem; topPx: number }
type PositionedItemWithBounds = PositionedItem & { cardTop: number; cardBottom: number }
type ItemCluster = {
  id: string
  items: PositionedItemWithBounds[]
  containerTop: number
  containerHeight: number
}

function WeekRail({
  totalWeeks,
  height,
  sprintLength,
  weekHeight,
  padding,
}: {
  totalWeeks: number
  height: number
  sprintLength: number
  weekHeight: number
  padding: number
}) {
  const markers = Array.from({ length: totalWeeks }, (_, i) => i + 1)
  return (
    <div className="min-w-[200px] pl-4">
      <div className="mb-4 text-sm font-semibold text-gray-dark">Weeks</div>
      <div className="relative overflow-hidden" style={{ padding }}>
        <div className="relative" style={{ height }}>
          <div
            className="absolute left-4 top-0 h-full w-[2px]"
            style={{ background: 'linear-gradient(180deg, #d3dce6 0%, #e6ebf2 100%)' }}
            aria-hidden
          />
          {markers.map((week) => {
            const topPx = (week - 1) * weekHeight
            const isSprintBoundary = sprintLength > 0 && (week - 1) % sprintLength === 0
            return (
              <div key={week} className="absolute left-0 right-0" style={{ top: topPx }}>
                <div className="flex items-center gap-3">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: isSprintBoundary ? '#ff7849' : '#8492a6' }}
                    aria-hidden
                  />
                  <div className="flex items-center gap-2 rounded-full bg-gray-light/30 px-2 py-1">
                    <span className="text-xs font-semibold text-gray-dark">Week {week}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function SprintGuides({
  totalWeeks,
  weekHeight,
  sprintLength,
  padding,
  topOffset,
}: {
  totalWeeks: number
  weekHeight: number
  sprintLength: number
  padding: number
  topOffset: number
}) {
  if (totalWeeks < 1) return null
  const sprints = Math.ceil(totalWeeks / Math.max(1, sprintLength))
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden style={{ top: topOffset, left: 0, right: 0 }}>
        <div className="relative" style={{ height: totalWeeks * weekHeight, paddingTop: padding, paddingBottom: padding }}>
        {Array.from({ length: sprints }, (_, idx) => {
          const sprintStartWeek = idx * sprintLength
          const sprintWeeks = Math.min(sprintLength, totalWeeks - sprintStartWeek)
          const top = sprintStartWeek * weekHeight
          const height = sprintWeeks * weekHeight
          const isEven = idx % 2 === 0
          return (
            <div key={`sprint-band-${idx}`} className="absolute left-0 right-0" style={{ top, height }}>
              <div
                className="h-full w-full"
                style={{
                  background: isEven ? 'rgba(132,146,166,0.06)' : 'transparent',
                  borderTop: '1px dashed rgba(132,146,166,0.25)',
                  borderBottom: '1px dashed rgba(132,146,166,0.25)',
                  position: 'relative',
                }}
              />
              <div
                className="absolute left-0 right-0"
                style={{
                  top: 0,
                  height: 1,
                  background: 'rgba(132,146,166,0.55)',
                }}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

type DurationSpan = { id: string; topPx: number; heightPx: number }

function buildDurationSpans({
  track,
  trackHeight,
  startWeekDate,
  totalWeeks,
  weekHeight,
  offsetTop,
}: {
  track: MultiLineTimelineTrack
  trackHeight: number
  startWeekDate: Date | null
  totalWeeks: number
  weekHeight: number
  offsetTop: number
}) {
  return track.items
    .map((item, index) => {
      const startDate = parseAtDate(item.at)
      const endDate = parseAtDate(item.endAt)
      if (!startDate || !endDate) return null
      const startPx = computeTopPx({
        atDate: startDate,
        startWeekDate,
        totalWeeks,
        index,
        totalItems: track.items.length,
        weekHeight,
        trackHeight,
        offsetTop,
      })
      const endPx = computeTopPx({
        atDate: endDate,
        startWeekDate,
        totalWeeks,
        index,
        totalItems: track.items.length,
        weekHeight,
        trackHeight,
        offsetTop,
      })
      const spanTopPx = clampNumber(Math.min(startPx, endPx), 0, trackHeight)
      const spanBottomPx = clampNumber(Math.max(startPx, endPx), 0, trackHeight)
      const spanHeightPx = Math.max(6, spanBottomPx - spanTopPx)
      return { id: item.id, topPx: spanTopPx, heightPx: spanHeightPx }
  })
    .filter(Boolean) as DurationSpan[]
}

function buildItemClusters(positionedItems: PositionedItem[]): ItemCluster[] {
  if (!positionedItems.length) return []

  const withBounds: PositionedItemWithBounds[] = positionedItems.map((p) => {
    const cardTop = Math.max(0, p.topPx - CARD_ANCHOR_OFFSET)
    const cardBottom = cardTop + CARD_HEIGHT_ESTIMATE
    return { ...p, cardTop, cardBottom }
  })

  const sorted = [...withBounds].sort((a, b) => a.cardTop - b.cardTop)
  const clusters: ItemCluster[] = []
  let current: PositionedItemWithBounds[] = []
  let currentEnd = -Infinity

  sorted.forEach((item) => {
    const overlaps = item.cardTop <= currentEnd + STACK_SLOP
    if (!overlaps && current.length) {
      const clusterTop = Math.min(...current.map((i) => i.cardTop))
      const clusterBottom = Math.max(...current.map((i) => i.cardBottom))
      clusters.push({
        id: current.map((i) => i.item.id).join('-'),
        items: current,
        containerTop: clusterTop,
        containerHeight: clusterBottom - clusterTop,
      })
      current = []
    }
    current.push(item)
    currentEnd = Math.max(currentEnd, item.cardBottom)
  })

  if (current.length) {
    const clusterTop = Math.min(...current.map((i) => i.cardTop))
    const clusterBottom = Math.max(...current.map((i) => i.cardBottom))
    clusters.push({
      id: current.map((i) => i.item.id).join('-'),
      items: current,
      containerTop: clusterTop,
      containerHeight: clusterBottom - clusterTop,
    })
  }

  return clusters
}

function TrackHeader({ track }: { track: MultiLineTimelineTrack }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: track.color }} aria-hidden />
      <span className="text-sm font-semibold text-gray-dark">{track.name}</span>
    </div>
  )
}

function TrackDurationSpans({ spans, color }: { spans: DurationSpan[]; color: string }) {
  return (
    <>
      {spans.map((span) => (
        <div
          key={`${span.id}-span`}
          className="absolute w-[12px]"
          style={{
            left: '0.6rem',
            transform: 'translateX(-50%)',
            top: span.topPx,
            height: span.heightPx,
            backgroundColor: `${color}`,
            opacity: 0.25,
            clipPath: 'polygon(0 0, 100% 6px, 100% calc(100% - 6px), 0 100%)',
          }}
          aria-hidden
        />
      ))}
    </>
  )
}

function StackBadge({ count, color }: { count: number; color: string }) {
  return (
    <div
      className="flex h-6 min-w-[24px] items-center justify-center rounded-full px-2 text-[10px] font-semibold text-white shadow"
      style={{ backgroundColor: color }}
    >
      {count}x
    </div>
  )
}

function TrackItemCard({ item, selected }: { item: MultiLineTimelineItem; selected: boolean }) {
  return (
    <div
      className="relative flex-1 rounded-xl border ml-1 px-3 py-2 shadow transition duration-150"
      style={{
        borderColor: selected ? '#1fb6ff' : '#d3dce6',
        background: 'rgba(255,255,255,0.97)',
        boxShadow: selected ? '0 10px 30px rgba(0,0,0,0.12), 0 0 0 2px rgba(31,182,255,0.25)' : '0 4px 12px rgba(0,0,0,0.05)',
        transform: selected ? 'translateY(-2px)' : 'translateY(0)',
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[0.625rem] text-gray">
            {item.at}
            {item.endAt ? ` → ${item.endAt}` : ''}
          </p>
          <p className="text-sm font-semibold text-gray-dark">{item.title}</p>
        </div>
      </div>
      <p className="text-sm text-gray-dark">{item.annotation}</p>
    </div>
  )
}

function TrackItemRow({
  item,
  leftOffset,
  topOffset,
  zIndex,
  selected,
  onSelect,
}: {
  item: MultiLineTimelineItem
  leftOffset: number
  topOffset: number
  zIndex: number
  selected: boolean
  onSelect: (id: string) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item.id)}
      className="absolute right-0 text-left focus:outline-none"
      style={{
        left: `${leftOffset}px`,
        top: `${topOffset}px`,
        zIndex,
      }}
    >
      <TrackItemCard item={item} selected={selected} />
    </button>
  )
}

function TrackItemCluster({
  cluster,
  color,
  selectedId,
  onSelect,
}: {
  cluster: ItemCluster
  color: string
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const hasStack = cluster.items.length > 1
  return (
    <div
      className="absolute right-0"
      style={{
        top: `${cluster.containerTop}px`,
        left: `${STACK_LEFT_BASE}px`,
        height: `${cluster.containerHeight}px`,
      }}
    >
      <div className="relative" style={{ height: cluster.containerHeight }}>
        {hasStack ? (
          <div className="absolute -left-6 -top-4">
            <StackBadge count={cluster.items.length} color={color} />
          </div>
        ) : null}
        {cluster.items.map((entry, idx) => (
          <TrackItemRow
            key={entry.item.id}
            item={entry.item}
            leftOffset={idx * STACK_X_OFFSET}
            topOffset={entry.cardTop - cluster.containerTop}
            zIndex={selectedId === entry.item.id ? SELECTED_Z_INDEX : BASE_Z_INDEX - idx}
            selected={selectedId === entry.item.id}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  )
}

function MultiLineTimelineTrack({
  track,
  trackHeight,
  startWeekDate,
  totalWeeks,
  offsetTop,
  guidePadding,
  weekHeight,
  selectedId,
  onSelect,
}: {
  track: MultiLineTimelineTrack
  trackHeight: number
  startWeekDate: Date | null
  totalWeeks: number
  offsetTop: number
  guidePadding: number
  weekHeight: number
  selectedId: string | null
  onSelect: (id: string) => void
}) {
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
  const clusters = buildItemClusters(positionedItems)
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

export function MultiLineTimeline({ tracks, weeks, sprintLength = 2, weekHeight = 90 }: MultiLineTimelineProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const allDates = tracks.flatMap((track) => track.items.map((item) => parseAtDate(item.at))).filter(Boolean) as Date[]
  const rawStartDate = allDates.length ? new Date(Math.min(...allDates.map((d) => d.getTime()))) : null
  const rawEndDate = allDates.length ? new Date(Math.max(...allDates.map((d) => d.getTime()))) : null
  const startWeekDate = rawStartDate ? getStartOfWeek(rawStartDate) : null
  const endWeekDate = rawEndDate ? getEndOfWeek(rawEndDate) : null
  const dataWeeks =
    startWeekDate && endWeekDate
      ? Math.max(1, Math.floor((endWeekDate.getTime() - startWeekDate.getTime()) / WEEK_MS) + 1)
      : 1
  const totalWeeks = Math.max(weeks ?? dataWeeks, dataWeeks)
  const computedHeight = Math.max(1, totalWeeks) * weekHeight
  const guidePadding = 14
  const headerOffset = 36 // approx height of track/week label + margin
  const guideTopOffset = headerOffset + guidePadding

  return (
    <div className="relative">
      <SprintGuides
        totalWeeks={totalWeeks}
        weekHeight={weekHeight}
        sprintLength={sprintLength}
        padding={guidePadding}
        topOffset={guideTopOffset}
      />
      <div className="flex gap-8 relative">
        <WeekRail
          totalWeeks={totalWeeks}
          height={computedHeight}
          sprintLength={sprintLength}
          weekHeight={weekHeight}
          padding={guidePadding}
        />
        <div className="flex gap-10">
          {tracks.map((track) => {
            const clampedStartWeek = startWeekDate
              ? Math.max(1, Math.min(totalWeeks, Math.floor(track.startWeek ?? 1)))
              : 1
            const clampedEndWeek = startWeekDate
              ? Math.max(clampedStartWeek, Math.min(totalWeeks, Math.floor(track.endWeek ?? totalWeeks)))
              : totalWeeks
            const trackWeeks = Math.max(1, clampedEndWeek - clampedStartWeek + 1)
            const trackHeight = trackWeeks * weekHeight
            const offsetTop = (clampedStartWeek - 1) * weekHeight

            return (
              <MultiLineTimelineTrack
                key={track.id}
                track={track}
                trackHeight={trackHeight}
                startWeekDate={startWeekDate}
                totalWeeks={totalWeeks}
                offsetTop={offsetTop}
                guidePadding={guidePadding}
                weekHeight={weekHeight}
                selectedId={selectedId}
                onSelect={(id) => setSelectedId(id)}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
