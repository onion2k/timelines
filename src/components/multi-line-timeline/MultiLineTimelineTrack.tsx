import { useRef } from 'react'
import { buildItemLines, getTopForWeekOffset, parseAtDate } from './utils'
import { type MultiLineTimelineTrack } from './types'
import { TrackHeader } from './TrackHeader'
import { TrackItemLine } from './TrackItemLine'
import { TrackItemLineCard } from './TrackItemLineCard'

type MultiLineTimelineTrackProps = {
  track: MultiLineTimelineTrack
  trackHeight: number
  startWeekDate: Date | null
  startWeekNumber: number
  endWeekNumber: number
  totalWeeks: number
  offsetTop: number
  guidePadding: number
  weekHeight: number
  lineWidth: number
  lineSpacing: number
  selectedLine: {
    trackId: string
    lineId: string
    anchor?: { x: number; y: number; clientX: number; clientY: number }
  } | null
  onHoverLine: (lineId: string, anchor?: { x: number; y: number; clientX: number; clientY: number }) => void
  onClearLine: () => void
}

const ANNOTATION_COLORS: Record<string, string> = {
  bug: '#f43f5e', // bright red
  epic: '#7c3aed', // bold purple
  task: '#2563eb', // vivid blue
  'sub-task': '#06b6d4', // crisp cyan
  spike: '#22c55e', // fresh green
  story: '#9ca3af', // warm gray
}

function getLineColor(annotation: string | undefined, fallback: string) {
  if (!annotation) return fallback
  const normalized = annotation.replace(/[\[\]]/g, '').trim().toLowerCase()
  return ANNOTATION_COLORS[normalized] ?? fallback
}

function hexToRgb(hex: string) {
  const normalized = hex.replace('#', '')
  if (normalized.length === 3) {
    const r = parseInt(normalized[0] + normalized[0], 16)
    const g = parseInt(normalized[1] + normalized[1], 16)
    const b = parseInt(normalized[2] + normalized[2], 16)
    if ([r, g, b].some((v) => Number.isNaN(v))) return null
    return { r, g, b }
  }
  if (normalized.length !== 6) return null
  const r = parseInt(normalized.slice(0, 2), 16)
  const g = parseInt(normalized.slice(2, 4), 16)
  const b = parseInt(normalized.slice(4, 6), 16)
  if ([r, g, b].some((v) => Number.isNaN(v))) return null
  return { r, g, b }
}

function rgbToHex(rgb: { r: number; g: number; b: number }) {
  const clamp = (value: number) => Math.max(0, Math.min(255, Math.round(value)))
  const toHex = (value: number) => clamp(value).toString(16).padStart(2, '0')
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`
}

function mixColor(hex: string, target: { r: number; g: number; b: number }, amount: number) {
  const base = hexToRgb(hex)
  if (!base) return hex
  const t = Math.min(1, Math.max(0, amount))
  const mixed = {
    r: base.r + (target.r - base.r) * t,
    g: base.g + (target.g - base.g) * t,
    b: base.b + (target.b - base.b) * t,
  }
  return rgbToHex(mixed)
}

function lightenColor(hex: string, amount = 0.35) {
  return mixColor(hex, { r: 255, g: 255, b: 255 }, amount)
}

function darkenColor(hex: string, amount = 0.18) {
  return mixColor(hex, { r: 0, g: 0, b: 0 }, amount)
}

function getColorWithAlpha(hex: string, alpha: number) {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  const clampedAlpha = Math.min(1, Math.max(0, alpha))
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${clampedAlpha})`
}

function getContrastingLineColor(annotation: string | undefined, fallback: string) {
  const base = getLineColor(annotation, fallback)
  return darkenColor(base, 0.2)
}

function buildDailyActivity({
  items,
  startWeekDate,
  startWeekNumber,
  endWeekNumber,
}: {
  items: MultiLineTimelineTrack['items']
  startWeekDate: Date | null
  startWeekNumber: number
  endWeekNumber: number
}) {
  if (!startWeekDate) return []
  const startDayOffset = Math.max(0, startWeekNumber - 1) * 7
  const totalDays = Math.max(0, endWeekNumber - startWeekNumber + 1) * 7
  const normalizedItems = items
    .map((item) => {
      const start = parseAtDate(item.at)
      if (!start) return null
      const end = parseAtDate(item.endAt) ?? start
      return { start, end }
    })
    .filter(Boolean) as Array<{ start: Date; end: Date }>

  return Array.from({ length: totalDays }, (_, index) => {
    const dayOffset = startDayOffset + index
    const dayDate = new Date(startWeekDate)
    dayDate.setUTCDate(startWeekDate.getUTCDate() + dayOffset)
    const activeCount = normalizedItems.reduce(
      (acc, span) => (dayDate >= span.start && dayDate <= span.end ? acc + 1 : acc),
      0,
    )
    return { dayIndex: dayOffset, count: activeCount }
  })
}

function getTopForDay({
  dayIndex,
  totalWeeks,
  weekHeight,
  offsetTop,
}: {
  dayIndex: number
  totalWeeks: number
  weekHeight: number
  offsetTop: number
}) {
  const weekOffset = Math.floor(dayIndex / 7)
  const dayInWeek = dayIndex % 7
  const weekTop = getTopForWeekOffset({ weekOffset, totalWeeks, weekHeight }) - offsetTop
  const dayHeight = weekHeight / 7
  const dayFromTop = 6 - dayInWeek
  return weekTop + dayFromTop * dayHeight
}

export function MultiLineTimelineTrack({
  track,
  trackHeight,
  startWeekDate,
  startWeekNumber,
  endWeekNumber,
  totalWeeks,
  offsetTop,
  guidePadding,
  weekHeight,
  lineWidth,
  lineSpacing,
  selectedLine,
  onHoverLine,
  onClearLine,
}: MultiLineTimelineTrackProps) {
  const linesContainerRef = useRef<HTMLDivElement | null>(null)
  const lines = buildItemLines({
    items: track.items,
    trackHeight,
    startWeekDate,
    totalWeeks,
    weekHeight,
    offsetTop,
  })
  const dayActivity = buildDailyActivity({
    items: track.items,
    startWeekDate,
    startWeekNumber,
    endWeekNumber,
  })
  const softTrackColor = lightenColor(track.color, 0.4)
  const dayHeight = weekHeight / 7

  return (
    <div className="min-w-[260px]" style={{ marginTop: offsetTop }}>
      <TrackHeader track={track} />
        <div className="relative rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(180deg, rgba(211,220,230,0.5) 0%, rgba(211,220,230,0.1) 100%)', padding: guidePadding }}>
        <div
          className="relative"
          style={{ height: trackHeight }}
          ref={linesContainerRef}
        >
          {dayActivity.map((day) => {
            if (day.count === 0) return null
            const dayTop = getTopForDay({
              dayIndex: day.dayIndex,
              totalWeeks,
              weekHeight,
              offsetTop,
            })
            const alpha = Math.min(1, day.count / 5)
            return (
              <div
                key={day.dayIndex}
                className="absolute left-0 right-0"
                style={{
                  top: dayTop,
                  height: dayHeight,
                  backgroundColor: getColorWithAlpha(softTrackColor, alpha),
                }}
                aria-hidden
              />
            )
          })}
          <div
            className="absolute left-0.5 top-0 h-full w-1 rounded-full"
            style={{
              backgroundColor: softTrackColor,
              boxShadow: `0 0 0 6px ${getColorWithAlpha(softTrackColor, 0.16)}`,
            }}
            aria-hidden
          />
          {lines.map((line) => (
            <TrackItemLine
              key={line.id}
              line={line}
              color={getContrastingLineColor(line.annotation, track.color)}
              laneWidth={lineSpacing}
              lineWidth={lineWidth}
              selected={selectedLine?.trackId === track.id && selectedLine?.lineId === line.id}
              onHover={(info) => {
                const container = linesContainerRef.current
                const containerRect = container?.getBoundingClientRect()
                const anchorY = containerRect ? info.clientY - containerRect.top : line.topPx
                const anchorX = containerRect ? info.clientX - containerRect.left : 0
                onHoverLine(line.id, { x: anchorX, y: anchorY, clientX: info.clientX, clientY: info.clientY })
              }}
              onLeave={onClearLine}
            />
          ))}
          {selectedLine?.trackId === track.id
            ? (() => {
                const activeLine = lines.find((l) => l.id === selectedLine.lineId)
                if (!activeLine) return null
                const baseLeft = 14
                const laneX = baseLeft + activeLine.lane * lineSpacing
                const fallbackLeft = laneX + lineSpacing + 14
                const fallbackTop = Math.max(4, activeLine.topPx - 20)
                const cardLeft = selectedLine.anchor
                  ? Math.max(8, selectedLine.anchor.clientX + 12)
                  : fallbackLeft
                const cardTop = selectedLine.anchor ? Math.max(4, selectedLine.anchor.clientY - 20) : fallbackTop
                return (
                  <TrackItemLineCard
                    line={activeLine}
                    track={track}
                    top={cardTop}
                    left={cardLeft}
                  />
                )
              })()
            : null}
        </div>
      </div>
    </div>
  )
}
