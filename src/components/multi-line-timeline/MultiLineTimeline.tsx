import { useEffect, useRef, useState } from 'react'
import { WEEK_MS } from './constants'
import { MilestoneLines } from './MilestoneLines'
import { SprintGuides } from './SprintGuides'
import { TimelineSettingsDrawer } from './TimelineSettingsDrawer'
import { MultiLineTimelineTrack } from './MultiLineTimelineTrack'
import { WeekRail } from './WeekRail'
import { getEndOfWeek, getTopForWeekNumber, getTrackOrderIndex, getStartOfWeek, parseAtDate, normalizeDateToUTC } from './utils'
import { type MultiLineTimelineProps, type ScaleOption } from './types'

export function MultiLineTimeline({
  tracks,
  weeks,
  sprintLength = 2,
  weekHeight = 90,
  milestones = [],
}: MultiLineTimelineProps) {
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null)
  const [scale, setScale] = useState<ScaleOption>('medium')
  const [lineWidth, setLineWidth] = useState<number>(4)
  const [lineSpacing, setLineSpacing] = useState<number>(12)
  const [selectedLine, setSelectedLine] = useState<{
    trackId: string
    lineId: string
    anchor?: { x: number; y: number; clientX: number; clientY: number }
  } | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [viewRange, setViewRange] = useState<{ start: number; end: number } | null>(null)
  const [viewportHeight, setViewportHeight] = useState(() => (typeof window !== 'undefined' ? window.innerHeight : 900))
  const timelineBodyRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const handleResize = () => setViewportHeight(window.innerHeight)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  const allDates = tracks
    .flatMap((track) =>
      track.items.flatMap((item) => [parseAtDate(item.at), parseAtDate(item.endAt)].filter(Boolean)),
    )
    .filter(Boolean) as Date[]
  const rawStartDate = allDates.length ? new Date(Math.min(...allDates.map((d) => d.getTime()))) : null
  const rawEndDate = allDates.length ? new Date(Math.max(...allDates.map((d) => d.getTime()))) : null
  const originDate = rawStartDate ? getStartOfWeek(rawStartDate) : null
  const endWeekDate = rawEndDate ? getEndOfWeek(rawEndDate) : null
  const timelineStartDate = originDate
  const dataWeeks =
    timelineStartDate && endWeekDate
      ? Math.max(1, Math.floor((endWeekDate.getTime() - timelineStartDate.getTime()) / WEEK_MS) + 1)
      : 1
  const totalWeeks = Math.max(weeks ?? dataWeeks, dataWeeks)
  const viewStartWeek = viewRange ? Math.max(1, Math.min(totalWeeks, viewRange.start)) : 1
  const viewEndWeek = viewRange ? Math.max(viewStartWeek, Math.min(totalWeeks, viewRange.end)) : totalWeeks
  const visibleWeeks = Math.max(1, viewEndWeek - viewStartWeek + 1)
  const weekHeightByScale: Record<ScaleOption, number> = {
    small: Math.round(weekHeight * 0.8),
    medium: weekHeight,
    large: Math.round(weekHeight * 1.2),
  }
  const baseWeekHeight = weekHeightByScale[scale]
  const effectiveWeekHeight = viewRange ? viewportHeight / visibleWeeks : baseWeekHeight
  const guidePadding = 14
  const headerOffset = 36 // approx height of track/week label + margin
  const guideTopOffset = headerOffset + guidePadding
  const contentBlurClass = settingsOpen ? 'blur-[2px]' : ''

  useEffect(() => {
    if (!viewRange || typeof window === 'undefined') return
    const body = timelineBodyRef.current
    if (!body) return
    const rect = body.getBoundingClientRect()
    const pageTop = rect.top + window.scrollY
    const targetWeek = viewRange ? viewEndWeek : totalWeeks
    const target = pageTop + guideTopOffset + getTopForWeekNumber({
      weekNumber: targetWeek,
      totalWeeks,
      weekHeight: effectiveWeekHeight,
    })
    window.scrollTo({ top: Math.max(0, target - 24), behavior: 'smooth' })
  }, [viewRange, viewEndWeek, effectiveWeekHeight, guideTopOffset, totalWeeks])

  const orderedTracks = [...tracks].sort((a, b) => {
    const orderA = getTrackOrderIndex(a.name)
    const orderB = getTrackOrderIndex(b.name)
    if (orderA !== orderB) return orderA - orderB
    return a.name.localeCompare(b.name)
  })

  const itemRanges = tracks
    .flatMap((track) =>
      track.items
        .map((item) => {
          const startDate = parseAtDate(item.at)
          if (!startDate) return null
          const endDate = parseAtDate(item.endAt) ?? startDate
          const start = normalizeDateToUTC(startDate).getTime()
          const end = normalizeDateToUTC(endDate).getTime()
          return { start: Math.min(start, end), end: Math.max(start, end) }
        })
        .filter(Boolean),
    )
    .filter(Boolean) as Array<{ start: number; end: number }>

  const getDayActiveCount = (date: Date) => {
    const target = normalizeDateToUTC(date).getTime()
    return itemRanges.reduce((acc, range) => (target >= range.start && target <= range.end ? acc + 1 : acc), 0)
  }

  return (
    <div className="relative pt-2">
      <div className="absolute right-0 top-0 z-30 flex items-center gap-2 pr-1 pointer-events-auto">
        {viewRange ? (
          <button
            type="button"
            onClick={() => setViewRange(null)}
            className="rounded-full border border-gray-light bg-white px-3 py-1.5 text-xs font-semibold text-gray-dark shadow-sm hover:bg-gray-light/60 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-light"
          >
            Reset zoom
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          aria-expanded={settingsOpen}
          className="flex items-center gap-2 rounded-full border border-gray-light bg-white px-3 py-1.5 text-xs font-semibold text-gray-dark shadow-sm hover:bg-gray-light/60 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-light"
        >
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-gray-dark shadow-[0_0_0_2px_#e2e8f0,_0_0_0_4px_rgba(0,0,0,0.04)]" aria-hidden />
          Settings
        </button>
      </div>
      <div
        className={`relative ${contentBlurClass} transition filter`}
        data-timeline-body
        ref={timelineBodyRef}
      >
        <SprintGuides
          totalWeeks={totalWeeks}
          weekHeight={effectiveWeekHeight}
          sprintLength={sprintLength}
          padding={guidePadding}
          topOffset={guideTopOffset}
        />
        <MilestoneLines
          milestones={milestones}
          startWeekDate={timelineStartDate}
          totalWeeks={totalWeeks}
          weekHeight={effectiveWeekHeight}
          padding={guidePadding}
          topOffset={guideTopOffset}
          selectedId={selectedMilestoneId}
          onSelect={setSelectedMilestoneId}
        />
        <div className="flex gap-8 relative">
          <WeekRail
            totalWeeks={totalWeeks}
            height={totalWeeks * effectiveWeekHeight}
            sprintLength={sprintLength}
            weekHeight={effectiveWeekHeight}
            padding={guidePadding}
            startWeekDate={timelineStartDate}
            viewRange={viewRange}
            onRangeSelect={(range) => setViewRange(range)}
            getDayActiveCount={getDayActiveCount}
          />
          <div className="flex gap-10">
            {orderedTracks.map((track) => {
              const clampedStartWeekGlobal = timelineStartDate
                ? Math.max(1, Math.min(totalWeeks, Math.floor(track.startWeek ?? 1)))
                : 1
              const clampedEndWeekGlobal = timelineStartDate
                ? Math.max(clampedStartWeekGlobal, Math.min(totalWeeks, Math.floor(track.endWeek ?? totalWeeks)))
                : totalWeeks
              const clampedStartWeek = clampedStartWeekGlobal
              const clampedEndWeek = clampedEndWeekGlobal
              const trackWeeks = Math.max(1, clampedEndWeek - clampedStartWeek + 1)
              const trackHeight = trackWeeks * effectiveWeekHeight
              const offsetTop = getTopForWeekNumber({
                weekNumber: clampedEndWeek,
                totalWeeks,
                weekHeight: effectiveWeekHeight,
              })

              return (
                <MultiLineTimelineTrack
                  key={track.id}
                  track={track}
                trackHeight={trackHeight}
                startWeekDate={timelineStartDate}
                startWeekNumber={clampedStartWeek}
                endWeekNumber={clampedEndWeek}
                totalWeeks={totalWeeks}
                offsetTop={offsetTop}
                guidePadding={guidePadding}
              weekHeight={effectiveWeekHeight}
              lineWidth={lineWidth}
              lineSpacing={lineSpacing}
              selectedLine={selectedLine}
              onHoverLine={(lineId, anchor) => setSelectedLine({ trackId: track.id, lineId, anchor })}
              onClearLine={() => setSelectedLine(null)}
            />
          )
        })}
      </div>
      </div>
      </div>
      <TimelineSettingsDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        scale={scale}
        onScaleChange={setScale}
        lineWidth={lineWidth}
        onLineWidthChange={setLineWidth}
        lineSpacing={lineSpacing}
        onLineSpacingChange={setLineSpacing}
      />
    </div>
  )
}
