import { WEEK_MS } from './constants'
import { parseAtDate } from './utils'
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

  type Line = { title: string; at: string; top: number }

  const lines: Line[] = milestones
    .map((m) => {
      const atDate = parseAtDate(m.at)
      if (!atDate) return null
      const diffWeeksFromStart = (atDate.getTime() - startWeekDate.getTime()) / WEEK_MS
      const top = diffWeeksFromStart * weekHeight
      return { ...m, top }
    })
    .filter(Boolean)

  if (!lines.length) return null

  const groupedLines = Object.values(
    lines.reduce<Record<string, { top: number; items: Line[] }>>((acc, line) => {
      if (!acc[line.at]) {
        acc[line.at] = { top: line.top, items: [] }
      }
      acc[line.at].items.push(line)
      return acc
    }, {}),
  ).sort((a, b) => a.top - b.top)

  return (
    <div className="absolute inset-0" style={{ top: topOffset, left: 0, right: 0, pointerEvents: 'none', zIndex: 20 }}>
      <div className="relative" style={{ height: totalWeeks * weekHeight, paddingTop: padding, paddingBottom: padding }}>
        {groupedLines.map((group) => {
          const groupSelected = group.items.some((line) => selectedId === `${line.title}-${line.at}`)
          return (
            <div key={`milestone-group-${group.items[0].at}`} className="absolute left-0 right-0" style={{ top: group.top }}>
              <div className="flex items-center gap-3">
                <div
                  className="h-px flex-1"
                  style={{
                    background:
                      groupSelected
                        ? 'linear-gradient(90deg, rgba(31,182,255,1) 0%, rgba(31,182,255,0.4) 100%)'
                        : 'linear-gradient(90deg, rgba(132,146,166,0.4) 0%, rgba(132,146,166,0.2) 100%)',
                    height: groupSelected ? 2 : 1,
                  }}
                />
                <div className="flex flex-wrap items-center gap-2 pl-1 pr-3">
                  {group.items.map((line) => {
                    const milestoneId = `${line.title}-${line.at}`
                    const isSelected = selectedId === milestoneId
                    return (
                      <button
                        key={`milestone-${line.title}-${line.at}`}
                        type="button"
                        onClick={() => onSelect(isSelected ? null : milestoneId)}
                        className="relative flex items-center gap-2 text-xs font-semibold text-gray-dark focus:outline-none"
                        style={{ pointerEvents: 'auto' }}
                      >
                        <span
                          className="h-2.5 w-2.5 rounded-full border"
                          style={{
                            backgroundColor: isSelected ? '#1fb6ff' : '#f7fafc',
                            borderColor: isSelected ? '#1fb6ff' : '#cfd6e1',
                            boxShadow: isSelected ? '0 0 0 4px rgba(31,182,255,0.15)' : 'none',
                          }}
                        />
                        <span>{line.title}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
