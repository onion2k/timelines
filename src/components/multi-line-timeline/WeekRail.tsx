import { useRef, useState, type MouseEvent } from 'react'
import { WEEK_MS } from './constants'
import { clampNumber, getTopForWeekNumber } from './utils'

type WeekRailProps = {
  totalWeeks: number
  height: number
  sprintLength: number
  weekHeight: number
  padding: number
  startWeekDate: Date | null
  viewRange: { start: number; end: number } | null
  onRangeSelect: (range: { start: number; end: number } | null) => void
}

export function WeekRail({
  totalWeeks,
  height,
  sprintLength,
  weekHeight,
  padding,
  startWeekDate,
  viewRange,
  onRangeSelect,
}: WeekRailProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [dragRange, setDragRange] = useState<{ start: number; end: number } | null>(null)
  const markers = Array.from({ length: totalWeeks }, (_, i) => i + 1)
  const labelBaseDate = startWeekDate ? new Date(Date.UTC(startWeekDate.getUTCFullYear(), 0, 1)) : null
  const formatLabel = (week: number) => {
    if (!labelBaseDate) return `Week ${week}`
    const weekStartDate = new Date(labelBaseDate.getTime() + (week - 1) * WEEK_MS)
    return weekStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
  }

  const toWeekFromEvent = (clientY: number) => {
    const container = containerRef.current
    if (!container) return null
    const rect = container.getBoundingClientRect()
    const offsetY = clientY - rect.top - padding
    const rawWeek = totalWeeks - offsetY / weekHeight
    const week = Math.floor(rawWeek)
    return clampNumber(week, 1, totalWeeks)
  }

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    const startWeek = toWeekFromEvent(e.clientY)
    if (!startWeek) return
    const range = { start: startWeek, end: startWeek }
    setDragRange(range)
  }

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!dragRange) return
    const currentWeek = toWeekFromEvent(e.clientY)
    if (!currentWeek) return
    setDragRange({
      start: Math.min(dragRange.start, currentWeek),
      end: Math.max(dragRange.start, currentWeek),
    })
  }

  const finalizeRange = () => {
    if (dragRange) {
      if (dragRange.start === dragRange.end) {
        onRangeSelect(null)
      } else {
        onRangeSelect(dragRange)
      }
      setDragRange(null)
    }
  }

  const selection = dragRange ?? viewRange
  const selectionTop = selection
    ? getTopForWeekNumber({ weekNumber: selection.end, totalWeeks, weekHeight }) + 2
    : 0
  const selectionBottom = selection
    ? getTopForWeekNumber({ weekNumber: selection.start, totalWeeks, weekHeight }) + weekHeight - 2
    : 0
  const selectionHeight = selection ? Math.max(weekHeight, selectionBottom - selectionTop) : 0

  return (
    <div className="min-w-[200px] pl-4 select-none">
      <div className="mb-4 text-sm font-semibold text-gray-dark pr-3">Weeks</div>
      <div
        className="relative overflow-hidden"
        style={{ padding }}
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={finalizeRange}
        onMouseLeave={finalizeRange}
      >
        <div className="relative" style={{ height }}>
          <div
            className="absolute left-4 top-0 h-full w-0.5"
            style={{ background: 'linear-gradient(180deg, #d3dce6 0%, #e6ebf2 100%)' }}
            aria-hidden
          />
          {selection ? (
            <div
              className="absolute left-0 right-0 bg-sky-200/30 border border-sky-400/50"
              style={{
                top: selectionTop,
                height: selectionHeight,
              }}
              aria-hidden
            />
          ) : null}
          {markers.map((week) => {
            const topPx = getTopForWeekNumber({ weekNumber: week, totalWeeks, weekHeight })
            const isSprintBoundary = sprintLength > 0 && (week - 1) % sprintLength === 0
            return (
              <div key={week} className="absolute left-0 right-0" style={{ top: topPx }}>
                <div className="flex items-center gap-5 pl-6">
                  <span
                    className="h-3 w-3 rounded-full absolute -translate-x-1/2"
                    style={{
                      backgroundColor: isSprintBoundary ? '#ff7849' : '#8492a6',
                      left: 'calc(1rem + 1px)', // align dot center with the week line center
                    }}
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
