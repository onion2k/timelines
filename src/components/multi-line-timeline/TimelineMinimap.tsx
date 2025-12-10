import { useEffect, useMemo, useState } from 'react'
import { clampNumber, getTopForWeekOffset, getTrackOrderIndex } from './utils'
import { type MultiLineTimelineTrack } from './types'

type TimelineMinimapProps = {
  tracks: MultiLineTimelineTrack[]
  weeks: number
}

export function TimelineMinimap({ tracks, weeks }: TimelineMinimapProps) {
  const [minimapHeight, setMinimapHeight] = useState(() => Math.round((typeof window !== 'undefined' ? window.innerHeight : 720) / 6))
  const [viewportBox, setViewportBox] = useState({ top: 0, height: 0 })

  const orderedTracks = useMemo(() => {
    return [...tracks].sort((a, b) => {
      const orderA = getTrackOrderIndex(a.name)
      const orderB = getTrackOrderIndex(b.name)
      if (orderA !== orderB) return orderA - orderB
      return a.name.localeCompare(b.name)
    })
  }, [tracks])

  const timelineMeta = useMemo(() => {
    const DAY_MS = 1000 * 60 * 60 * 24
    const WEEK_MS = DAY_MS * 7
    const normalizeDateToUTC = (date: Date) =>
      new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
    const getStartOfWeek = (date: Date) => {
      const start = normalizeDateToUTC(date)
      const day = start.getUTCDay()
      const diff = (day + 6) % 7 // Monday start
      start.setUTCDate(start.getUTCDate() - diff)
      return start
    }
    const getEndOfWeek = (date: Date) => {
      const start = normalizeDateToUTC(date)
      const day = start.getUTCDay()
      const diff = (day + 6) % 7
      start.setUTCDate(start.getUTCDate() - diff + 6)
      return start
    }
    const parseAtDate = (at?: string): Date | null => {
      if (!at) return null
      const parsed = new Date(at)
      return Number.isNaN(parsed.getTime()) ? null : normalizeDateToUTC(parsed)
    }

    const allDates = orderedTracks
      .flatMap((track) =>
        track.items.flatMap((item) => [parseAtDate(item.at), parseAtDate(item.endAt)].filter(Boolean)),
      )
      .filter(Boolean) as Date[]
    if (!allDates.length) return null
    const rawStartDate = new Date(Math.min(...allDates.map((d) => d.getTime())))
    const rawEndDate = new Date(Math.max(...allDates.map((d) => d.getTime())))
    const originDate = getStartOfWeek(rawStartDate)
    const endWeekDate = getEndOfWeek(rawEndDate)
    const dataWeeks = Math.max(1, Math.floor((endWeekDate.getTime() - originDate.getTime()) / WEEK_MS) + 1)
    const totalWeeks = Math.max(weeks ?? dataWeeks, dataWeeks)
    return { startWeekDate: originDate, totalWeeks }
  }, [orderedTracks, weeks])

  useEffect(() => {
    const measure = () => {
      const timelineBody = document.querySelector('[data-timeline-body]')
      if (!timelineBody) return
      const rect = timelineBody.getBoundingClientRect()
      const bodyTop = rect.top + window.scrollY
      const bodyHeight = rect.height
      const viewportTop = window.scrollY
      const viewportHeight = window.innerHeight
      const visibleStart = Math.max(viewportTop, bodyTop)
      const visibleEnd = Math.min(viewportTop + viewportHeight, bodyTop + bodyHeight)
      const visibleHeight = Math.max(0, visibleEnd - visibleStart)
      const ratio = bodyHeight ? minimapHeight / bodyHeight : 0
      setViewportBox({
        top: (visibleStart - bodyTop) * ratio,
        height: visibleHeight * ratio,
      })
    }

    const handleResize = () => {
      setMinimapHeight(Math.round(window.innerHeight / 6))
    }

    measure()
    const timelineBody = document.querySelector('[data-timeline-body]')
    const resizeObserver =
      timelineBody && 'ResizeObserver' in window
        ? new ResizeObserver(() => {
            measure()
          })
        : null
    resizeObserver?.observe(timelineBody as Element)
    window.addEventListener('scroll', measure, { passive: true })
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('scroll', measure)
      window.removeEventListener('resize', handleResize)
      resizeObserver?.disconnect()
    }
  }, [minimapHeight])

  const markers = useMemo(() => {
    if (!timelineMeta) return []
    const { startWeekDate, totalWeeks } = timelineMeta
    const DAY_MS = 1000 * 60 * 60 * 24
    const WEEK_MS = DAY_MS * 7
    const parseAtDate = (at?: string): Date | null => {
      if (!at) return null
      const parsed = new Date(at)
      if (Number.isNaN(parsed.getTime())) return null
      return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()))
    }
    const width = 220
    const columnWidth = width / Math.max(1, orderedTracks.length)
    const scaleY = totalWeeks ? minimapHeight / totalWeeks : 0
    return orderedTracks.flatMap((track, trackIdx) =>
      track.items
        .map((item) => {
          const atDate = parseAtDate(item.at)
          if (!atDate || !startWeekDate) return null
          const diffWeeks = (atDate.getTime() - startWeekDate.getTime()) / WEEK_MS
          const clamped = clampNumber(diffWeeks, 0, Math.max(totalWeeks, 1))
          return {
            id: item.id,
            top: getTopForWeekOffset({ weekOffset: clamped, totalWeeks, weekHeight: scaleY }),
            left: trackIdx * columnWidth + columnWidth / 2,
            color: track.color,
          }
        })
        .filter(Boolean),
    ) as { id: string; top: number; left: number; color: string }[]
  }, [minimapHeight, orderedTracks, timelineMeta])

  if (!timelineMeta) return null

  const width = 220

  return (
    <div
      className="fixed bottom-4 right-4 z-40 rounded-xl bg-white/80 shadow-lg backdrop-blur"
      style={{ width, height: minimapHeight }}
    >
      <div className="relative h-full w-full overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #eef2f7 0%, #ffffff 100%)' }} />
        <div className="absolute inset-0">
          {markers.map((marker) => (
            <span
              key={marker.id}
              className="absolute h-1 w-1 rounded-full"
              style={{
                left: marker.left - 5,
                top: marker.top,
                backgroundColor: marker.color
              }}
              aria-hidden
            />
          ))}
        </div>
        <div
          className="absolute left-0 right-0 rounded-md border-2 border-sky-400/70 bg-sky-200/20"
          style={{ top: viewportBox.top, height: Math.max(24, viewportBox.height || minimapHeight / 4) }}
        />
      </div>
    </div>
  )
}
