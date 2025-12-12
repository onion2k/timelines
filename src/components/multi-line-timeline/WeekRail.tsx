import { useRef, useState, type MouseEvent } from 'react'
import { WEEK_MS } from './constants'
import { clampNumber, getTopForWeekNumber } from './utils'

const DAY_MS = 24 * 60 * 60 * 1000

type WeekRailProps = {
  totalWeeks: number
  height: number
  weekHeight: number
  padding: number
  startWeekDate: Date | null
  viewRange: { start: number; end: number } | null
  onRangeSelect: (range: { start: number; end: number } | null) => void
  getDayActiveCount?: (date: Date) => number
}

export function WeekRail({
  totalWeeks,
  height,
  weekHeight,
  padding,
  startWeekDate,
  viewRange,
  onRangeSelect,
  getDayActiveCount,
}: WeekRailProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [dragRange, setDragRange] = useState<{ start: number; end: number } | null>(null)
  const [hoverDay, setHoverDay] = useState<{ key: string; count: number } | null>(null)
  const markers = Array.from({ length: totalWeeks }, (_, i) => i + 1)

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
            const dayHeight = weekHeight / 7
            const weekStartDate = startWeekDate ? new Date(startWeekDate.getTime() + (week - 1) * WEEK_MS) : null
            return (
              <div key={week} className="absolute left-0 right-0" style={{ top: topPx }}>
                <div className="absolute left-4 top-0" style={{ height: weekHeight }} aria-hidden>
                  {Array.from({ length: 7 }, (_, visualIndex) => {
                    const dayOffset = 6 - visualIndex // render last day at the top, first at the bottom
                    const dayDate = weekStartDate ? new Date(weekStartDate.getTime() + dayOffset * DAY_MS) : null
                    const isMonday = dayDate ? dayDate.getUTCDay() === 1 : false
                    const markerTop = dayHeight * (visualIndex + 0.5)
                    const showLabel =
                      weekHeight < 100
                        ? dayDate
                          ? dayDate.getUTCDay() === 1 // only Mondays when compact
                          : false
                        : true
                    const dayKey = dayDate ? dayDate.toISOString().slice(0, 10) : `w${week}-d${visualIndex}`
                    const countText =
                      hoverDay?.key === dayKey ? ` · ${hoverDay.count} in progress` : ''
                    return (
                      <div
                        key={visualIndex}
                        className="absolute flex items-center gap-2"
                        style={{ top: markerTop, left: 0 }}
                        onMouseEnter={() => {
                          if (!dayDate || !getDayActiveCount) {
                            setHoverDay(null)
                            return
                          }
                          setHoverDay({ key: dayKey, count: getDayActiveCount(dayDate) })
                        }}
                        onMouseLeave={() => setHoverDay(null)}
                      >
                        <span
                          className="block rounded-full"
                          style={{
                            width: isMonday ? 12 : 8,
                            height: isMonday ? 2.5 : 2,
                            backgroundColor: isMonday ? '#0ea5e9' : '#a8b5c3',
                            boxShadow: isMonday ? '0 0 0 4px rgba(14,165,233,0.16)' : undefined,
                          }}
                        />
                        {dayDate && showLabel ? (
                          <span className="block text-[10px] font-semibold text-gray-dark/80 leading-none whitespace-nowrap">
                            {dayDate.toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              timeZone: 'UTC',
                            })}
                            {countText}
                          </span>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
