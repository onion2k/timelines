import { WEEK_MS, TRACK_NAME_ORDER } from './constants'
import { type DurationSpan, type ItemLine, type MultiLineTimelineItem, type MultiLineTimelineTrack } from './types'

export function clampNumber(value: number, min: number, max: number) {
  if (Number.isNaN(value)) return min
  return Math.min(max, Math.max(min, value))
}

export function getTrackOrderIndex(name: string) {
  const index = TRACK_NAME_ORDER.indexOf(name)
  return index === -1 ? Number.MAX_SAFE_INTEGER : index
}

export function getTopForWeekNumber({
  weekNumber,
  totalWeeks,
  weekHeight,
}: {
  weekNumber: number
  totalWeeks: number
  weekHeight: number
}) {
  return (totalWeeks - weekNumber) * weekHeight
}

export function getTopForWeekOffset({
  weekOffset,
  totalWeeks,
  weekHeight,
}: {
  weekOffset: number
  totalWeeks: number
  weekHeight: number
}) {
  return (totalWeeks - weekOffset - 1) * weekHeight
}

export function normalizeDateToUTC(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

export function getStartOfWeek(date: Date) {
  const d = normalizeDateToUTC(date)
  const day = d.getUTCDay()
  const diff = (day + 6) % 7 // Monday as start
  d.setUTCDate(d.getUTCDate() - diff)
  return d
}

export function getEndOfWeek(date: Date) {
  const start = getStartOfWeek(date)
  start.setUTCDate(start.getUTCDate() + 6)
  return start
}

export function parseAtDate(at?: string): Date | null {
  if (!at) return null
  const parsed = new Date(at)
  return Number.isNaN(parsed.getTime()) ? null : normalizeDateToUTC(parsed)
}

export function computeTopPx({
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
    const position = getTopForWeekOffset({ weekOffset: clampedWeeks, totalWeeks, weekHeight }) - offsetTop
    return clampNumber(position, 0, trackHeight)
  }
  if (totalItems <= 1) return trackHeight / 2
  return (index / (totalItems - 1)) * trackHeight
}

export function buildDurationSpans({
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

export function buildItemLines({
  items,
  trackHeight,
  startWeekDate,
  totalWeeks,
  weekHeight,
  offsetTop,
}: {
  items: MultiLineTimelineItem[]
  trackHeight: number
  startWeekDate: Date | null
  totalWeeks: number
  weekHeight: number
  offsetTop: number
}): ItemLine[] {
  if (!items.length) return []

  const MIN_LINE_HEIGHT = 10
  const VERTICAL_GAP = 6

  const positioned = items
    .map((item, index) => {
      const startDate = parseAtDate(item.at)
      if (!startDate) return null
      const endDate = parseAtDate(item.endAt)
      const startPx = computeTopPx({
        atDate: startDate,
        startWeekDate,
        totalWeeks,
        index,
        totalItems: items.length,
        weekHeight,
        trackHeight,
        offsetTop,
      })
      const endPx = endDate
        ? computeTopPx({
            atDate: endDate,
            startWeekDate,
            totalWeeks,
            index,
            totalItems: items.length,
            weekHeight,
            trackHeight,
            offsetTop,
          })
        : startPx
      const spanTopPx = clampNumber(Math.min(startPx, endPx), 0, trackHeight)
      const spanBottomPx = clampNumber(Math.max(startPx, endPx), 0, trackHeight)
      const spanHeightPx = Math.max(MIN_LINE_HEIGHT, spanBottomPx - spanTopPx)
      return { item, topPx: spanTopPx, bottomPx: spanTopPx + spanHeightPx, heightPx: spanHeightPx }
    })
    .filter(Boolean) as Array<{
      item: MultiLineTimelineItem
      topPx: number
      bottomPx: number
      heightPx: number
    }>

  const sorted = positioned.sort((a, b) => a.topPx - b.topPx)
  const laneEnds: number[] = []

  const withLanes: ItemLine[] = sorted.map((entry) => {
    let laneIndex = laneEnds.findIndex((laneEnd) => entry.topPx > laneEnd + VERTICAL_GAP)
    if (laneIndex === -1) {
      laneIndex = laneEnds.length
      laneEnds.push(entry.bottomPx)
    } else {
      laneEnds[laneIndex] = entry.bottomPx
    }

    return {
      id: entry.item.id,
      topPx: entry.topPx,
      heightPx: entry.heightPx,
      lane: laneIndex,
      title: entry.item.title,
      at: entry.item.at,
      endAt: entry.item.endAt,
      annotation: entry.item.annotation,
    }
  })

  return withLanes
}
