import { getTopForWeekNumber } from './utils'

type SprintGuidesProps = {
  totalWeeks: number
  weekHeight: number
  sprintLength: number
  padding: number
  topOffset: number
}

export function SprintGuides({ totalWeeks, weekHeight, sprintLength, padding, topOffset }: SprintGuidesProps) {
  if (totalWeeks < 1) return null
  const sprints = Math.ceil(totalWeeks / Math.max(1, sprintLength))
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden style={{ top: topOffset, left: 0, right: 0 }}>
      <div className="relative" style={{ height: totalWeeks * weekHeight, paddingTop: padding, paddingBottom: padding }}>
        {Array.from({ length: sprints }, (_, idx) => {
          const sprintStartWeek = idx * sprintLength
          const sprintWeeks = Math.min(sprintLength, totalWeeks - sprintStartWeek)
          const sprintEndWeekNumber = sprintStartWeek + sprintWeeks
          const top = getTopForWeekNumber({
            weekNumber: sprintEndWeekNumber,
            totalWeeks,
            weekHeight,
          })
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
