import {
  CARD_ANCHOR_OFFSET,
  CARD_HEIGHT_ESTIMATE,
  STACK_SLOP,
  WEEK_MS,
} from './constants'
import {
  type DurationSpan,
  type ItemCluster,
  type MultiLineTimelineItem,
  type MultiLineTimelineTrack,
  type PositionedItem,
  type PositionedItemWithBounds,
} from './types'

export function clampNumber(value: number, min: number, max: number) {
  if (Number.isNaN(value)) return min
  return Math.min(max, Math.max(min, value))
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
    const position = clampedWeeks * weekHeight - offsetTop
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

export function buildItemClusters(positionedItems: PositionedItem[]): ItemCluster[] {
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
