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
  milestones?: Milestone[]
}

export type Milestone = { title: string; at: string }
type WeekLabelMode = 'weeks' | 'dates'
type ScaleOption = 'small' | 'medium' | 'large'

const DAY_MS = 1000 * 60 * 60 * 24
const WEEK_MS = DAY_MS * 7
const CARD_HEIGHT_ESTIMATE = 70
const CARD_ANCHOR_OFFSET = 14
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

function TimelineSettingsDrawer({
  open,
  onClose,
  labelMode,
  onLabelModeChange,
  startWeekDate,
  scale,
  onScaleChange,
}: {
  open: boolean
  onClose: () => void
  labelMode: WeekLabelMode
  onLabelModeChange: (mode: WeekLabelMode) => void
  startWeekDate: Date | null
  scale: ScaleOption
  onScaleChange: (scale: ScaleOption) => void
}) {
  if (!open) return null

  const canShowDates = Boolean(startWeekDate)

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close settings"
        className="absolute inset-0 bg-gray-dark/30 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <div className="absolute right-0 top-0 flex h-full w-[320px] flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-gray-dark">Timeline settings</p>
            <p className="text-xs text-gray">Adjust how the scale is displayed.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border px-3 py-1 text-xs font-semibold text-gray-dark hover:bg-gray-light/50"
          >
            Close
          </button>
        </div>
        <div className="flex-1 overflow-auto px-5 py-4">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-dark/80">Timeline scale</p>
            <div className="mt-3 inline-flex rounded-full bg-gray-light/60 p-1 text-[0.75rem] font-semibold text-gray-dark shadow-sm">
              <button
                type="button"
                className={`rounded-full px-3 py-1 transition ${labelMode === 'weeks' ? 'bg-white shadow-sm' : 'hover:bg-white/60'}`}
                aria-pressed={labelMode === 'weeks'}
                onClick={() => onLabelModeChange('weeks')}
              >
                Weeks
              </button>
              <button
                type="button"
                className={`rounded-full px-3 py-1 transition ${labelMode === 'dates' ? 'bg-white shadow-sm' : 'hover:bg-white/60'} ${!canShowDates ? 'cursor-not-allowed opacity-50' : ''}`}
                aria-pressed={labelMode === 'dates'}
                onClick={() => canShowDates && onLabelModeChange('dates')}
                disabled={!canShowDates}
              >
                Dates
              </button>
            </div>
            {!canShowDates ? (
              <p className="mt-2 text-xs text-gray">
                Dates become available once a valid start date is detected.
              </p>
            ) : null}
          </div>
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-dark/80">Scale</p>
            <div className="mt-3 flex flex-col gap-2 text-sm font-semibold text-gray-dark">
              {([
                { value: 'small', label: 'Small' },
                { value: 'medium', label: 'Medium' },
                { value: 'large', label: 'Large' },
              ] as const).map((option) => (
                <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="timeline-scale"
                    value={option.value}
                    checked={scale === option.value}
                    onChange={() => onScaleChange(option.value)}
                    className="h-4 w-4 border-gray-light text-gray-dark focus:ring-1 focus:ring-offset-1 focus:ring-gray-dark"
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function WeekRail({
  totalWeeks,
  height,
  sprintLength,
  weekHeight,
  padding,
  startWeekDate,
  labelMode,
}: {
  totalWeeks: number
  height: number
  sprintLength: number
  weekHeight: number
  padding: number
  startWeekDate: Date | null
  labelMode: WeekLabelMode
}) {
  const markers = Array.from({ length: totalWeeks }, (_, i) => i + 1)
  const labelBaseDate = startWeekDate ? new Date(Date.UTC(startWeekDate.getUTCFullYear(), 0, 1)) : null
  const formatLabel = (week: number) => {
    if (labelMode === 'dates' && labelBaseDate) {
      const weekStartDate = new Date(labelBaseDate.getTime() + (week - 1) * WEEK_MS)
      return weekStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
    }
    return `Week ${week}`
  }

  return (
    <div className="min-w-[200px] pl-4">
      <div className="mb-4 text-sm font-semibold text-gray-dark pr-3">Weeks</div>
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
                    <span className="text-xs font-semibold text-gray-dark">{formatLabel(week)}</span>
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

function MilestoneLines({
  milestones,
  startWeekDate,
  totalWeeks,
  weekHeight,
  padding,
  topOffset,
  selectedId,
  onSelect,
}: {
  milestones: Milestone[]
  startWeekDate: Date | null
  totalWeeks: number
  weekHeight: number
  padding: number
  topOffset: number
  selectedId: string | null
  onSelect: (id: string | null) => void
}) {
  if (!milestones.length || !startWeekDate || totalWeeks < 1) return null

  const lines = milestones
    .map((m) => {
      const atDate = parseAtDate(m.at)
      if (!atDate) return null
      const diffWeeks = (atDate.getTime() - startWeekDate.getTime()) / WEEK_MS
      const top = clampNumber(diffWeeks * weekHeight, 0, totalWeeks * weekHeight)
      return { ...m, top }
    })
    .filter(Boolean) as { title: string; at: string; top: number }[]

  if (!lines.length) return null

  return (
    <div
      className="absolute inset-0"
      style={{ top: topOffset, left: 0, right: 0, pointerEvents: 'none', zIndex: 20 }}
    >
      <div
        className="relative"
        style={{ height: totalWeeks * weekHeight, paddingTop: padding, paddingBottom: padding }}
      >
        {lines.map((line) => (
          <div
            key={`milestone-${line.title}-${line.at}`}
            className="absolute left-0 right-0 flex items-center"
            style={{ top: line.top }}
          >
            <div
              className="h-px flex-1"
              style={{
                background:
                  selectedId === `${line.title}-${line.at}`
                    ? 'linear-gradient(90deg, rgba(31,182,255,1) 0%, rgba(31,182,255,0.4) 100%)'
                    : 'linear-gradient(90deg, rgba(132,146,166,0.4) 0%, rgba(132,146,166,0.2) 100%)',
                height: selectedId === `${line.title}-${line.at}` ? 2 : 1,
              }}
            />
            <button
              type="button"
              onClick={() => onSelect(selectedId === `${line.title}-${line.at}` ? null : `${line.title}-${line.at}`)}
              className="relative ml-3 mr-4 flex items-center gap-2 text-xs font-semibold text-gray-dark focus:outline-none"
              style={{ pointerEvents: 'auto' }}
            >
              <span
                className="h-2.5 w-2.5 rounded-full border"
                style={{
                  backgroundColor: selectedId === `${line.title}-${line.at}` ? '#1fb6ff' : '#f7fafc',
                  borderColor: selectedId === `${line.title}-${line.at}` ? '#1fb6ff' : '#cfd6e1',
                  boxShadow: selectedId === `${line.title}-${line.at}` ? '0 0 0 4px rgba(31,182,255,0.15)' : 'none',
                }}
              />
              <span>{line.title}</span>
            </button>
          </div>
        ))}
      </div>
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
      className="absolute text-left w-full focus:outline-none"
      style={{
        left: 0,
        top: `${topOffset}px`,
        zIndex,
        transform: `translateX(${leftOffset}px)`,
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
            leftOffset={0}
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

export function MultiLineTimeline({
  tracks,
  weeks,
  sprintLength = 2,
  weekHeight = 90,
  milestones = [],
}: MultiLineTimelineProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null)
  const [weekLabelMode, setWeekLabelMode] = useState<WeekLabelMode>('weeks')
  const [scale, setScale] = useState<ScaleOption>('medium')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const allDates = tracks.flatMap((track) => track.items.map((item) => parseAtDate(item.at))).filter(Boolean) as Date[]
  const rawStartDate = allDates.length ? new Date(Math.min(...allDates.map((d) => d.getTime()))) : null
  const rawEndDate = allDates.length ? new Date(Math.max(...allDates.map((d) => d.getTime()))) : null
  const originDate = rawStartDate ? normalizeDateToUTC(new Date(Date.UTC(rawStartDate.getUTCFullYear(), 0, 1))) : null
  const endWeekDate = rawEndDate ? getEndOfWeek(rawEndDate) : null
  const timelineStartDate = originDate
  const dataWeeks =
    timelineStartDate && endWeekDate
      ? Math.max(1, Math.floor((endWeekDate.getTime() - timelineStartDate.getTime()) / WEEK_MS) + 1)
      : 1
  const totalWeeks = Math.max(weeks ?? dataWeeks, dataWeeks)
  const weekHeightByScale: Record<ScaleOption, number> = {
    small: Math.round(weekHeight * 0.8),
    medium: weekHeight,
    large: Math.round(weekHeight * 1.2),
  }
  const effectiveWeekHeight = weekHeightByScale[scale]
  const computedHeight = Math.max(1, totalWeeks) * effectiveWeekHeight
  const guidePadding = 14
  const headerOffset = 36 // approx height of track/week label + margin
  const guideTopOffset = headerOffset + guidePadding
  const contentBlurClass = settingsOpen ? 'blur-[2px]' : ''

  return (
    <div className="relative pt-2">
      <div className="absolute right-0 top-0 z-30 flex items-center gap-2 pr-1 pointer-events-auto">
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          aria-expanded={settingsOpen}
          className="flex items-center gap-2 rounded-full border border-gray-light bg-white px-3 py-1.5 text-xs font-semibold text-gray-dark shadow-sm hover:bg-gray-light/60 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-light"
        >
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-gray-dark shadow-[0_0_0_2px_#e2e8f0,_0_0_0_4px_rgba(0,0,0,0.04)]" aria-hidden />
          Settings
        </button>
      </div>
      <div className={`relative ${contentBlurClass} transition filter`} data-timeline-body>
        <SprintGuides
          totalWeeks={totalWeeks}
          weekHeight={effectiveWeekHeight}
          sprintLength={sprintLength}
          padding={guidePadding}
          topOffset={guideTopOffset}
        />
        <MilestoneLines
          milestones={milestones}
          startWeekDate={timelineStartDate}
          totalWeeks={totalWeeks}
          weekHeight={effectiveWeekHeight}
          padding={guidePadding}
          topOffset={guideTopOffset}
          selectedId={selectedMilestoneId}
          onSelect={setSelectedMilestoneId}
        />
        <div className="flex gap-8 relative">
          <WeekRail
            totalWeeks={totalWeeks}
            height={computedHeight}
            sprintLength={sprintLength}
            weekHeight={effectiveWeekHeight}
            padding={guidePadding}
            startWeekDate={timelineStartDate}
            labelMode={weekLabelMode}
          />
          <div className="flex gap-10">
            {tracks.map((track) => {
              const clampedStartWeek = timelineStartDate
                ? Math.max(1, Math.min(totalWeeks, Math.floor(track.startWeek ?? 1)))
                : 1
              const clampedEndWeek = timelineStartDate
                ? Math.max(clampedStartWeek, Math.min(totalWeeks, Math.floor(track.endWeek ?? totalWeeks)))
                : totalWeeks
              const trackWeeks = Math.max(1, clampedEndWeek - clampedStartWeek + 1)
              const trackHeight = trackWeeks * effectiveWeekHeight
              const offsetTop = (clampedStartWeek - 1) * effectiveWeekHeight

              return (
                <MultiLineTimelineTrack
                  key={track.id}
                  track={track}
                  trackHeight={trackHeight}
                  startWeekDate={timelineStartDate}
                  totalWeeks={totalWeeks}
                  offsetTop={offsetTop}
                  guidePadding={guidePadding}
                  weekHeight={effectiveWeekHeight}
                  selectedId={selectedId}
                  onSelect={(id) => setSelectedId(id)}
                />
              )
            })}
          </div>
        </div>
      </div>
      <TimelineSettingsDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        labelMode={weekLabelMode}
        onLabelModeChange={setWeekLabelMode}
        startWeekDate={timelineStartDate}
        scale={scale}
        onScaleChange={setScale}
      />
    </div>
  )
}
