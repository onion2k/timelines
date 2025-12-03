import { WEEK_MS } from './constants'
import { clampNumber, parseAtDate } from './utils'
import { type Milestone } from './types'

type MilestoneLinesProps = {
  milestones: Milestone[]
  startWeekDate: Date | null
  totalWeeks: number
  weekHeight: number
  padding: number
  topOffset: number
  selectedId: string | null
  onSelect: (id: string | null) => void
}

export function MilestoneLines({
  milestones,
  startWeekDate,
  totalWeeks,
  weekHeight,
  padding,
  topOffset,
  selectedId,
  onSelect,
}: MilestoneLinesProps) {
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
    <div className="absolute inset-0" style={{ top: topOffset, left: 0, right: 0, pointerEvents: 'none', zIndex: 20 }}>
      <div className="relative" style={{ height: totalWeeks * weekHeight, paddingTop: padding, paddingBottom: padding }}>
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
