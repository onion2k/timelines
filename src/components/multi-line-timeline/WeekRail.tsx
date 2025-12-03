import { WEEK_MS } from './constants'
import { type WeekLabelMode } from './types'

type WeekRailProps = {
  totalWeeks: number
  height: number
  sprintLength: number
  weekHeight: number
  padding: number
  startWeekDate: Date | null
  labelMode: WeekLabelMode
}

export function WeekRail({
  totalWeeks,
  height,
  sprintLength,
  weekHeight,
  padding,
  startWeekDate,
  labelMode,
}: WeekRailProps) {
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
