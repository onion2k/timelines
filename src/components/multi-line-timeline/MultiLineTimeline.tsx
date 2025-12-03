import { useState } from 'react'
import { WEEK_MS } from './constants'
import { MilestoneLines } from './MilestoneLines'
import { SprintGuides } from './SprintGuides'
import { TimelineSettingsDrawer } from './TimelineSettingsDrawer'
import { MultiLineTimelineTrack } from './MultiLineTimelineTrack'
import { WeekRail } from './WeekRail'
import { getEndOfWeek, normalizeDateToUTC, parseAtDate } from './utils'
import { type MultiLineTimelineProps, type ScaleOption, type WeekLabelMode } from './types'

export function MultiLineTimeline({
  tracks,
  weeks,
  sprintLength = 2,
  weekHeight = 90,
  milestones = [],
}: MultiLineTimelineProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null)
  const [weekLabelMode, setWeekLabelMode] = useState<WeekLabelMode>('weeks')
  const [scale, setScale] = useState<ScaleOption>('medium')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const allDates = tracks.flatMap((track) => track.items.map((item) => parseAtDate(item.at))).filter(Boolean) as Date[]
  const rawStartDate = allDates.length ? new Date(Math.min(...allDates.map((d) => d.getTime()))) : null
  const rawEndDate = allDates.length ? new Date(Math.max(...allDates.map((d) => d.getTime()))) : null
  const originDate = rawStartDate ? normalizeDateToUTC(new Date(Date.UTC(rawStartDate.getUTCFullYear(), 0, 1))) : null
  const endWeekDate = rawEndDate ? getEndOfWeek(rawEndDate) : null
  const timelineStartDate = originDate
  const dataWeeks =
    timelineStartDate && endWeekDate
      ? Math.max(1, Math.floor((endWeekDate.getTime() - timelineStartDate.getTime()) / WEEK_MS) + 1)
      : 1
  const totalWeeks = Math.max(weeks ?? dataWeeks, dataWeeks)
  const weekHeightByScale: Record<ScaleOption, number> = {
    small: Math.round(weekHeight * 0.8),
    medium: weekHeight,
    large: Math.round(weekHeight * 1.2),
  }
  const effectiveWeekHeight = weekHeightByScale[scale]
  const computedHeight = Math.max(1, totalWeeks) * effectiveWeekHeight
  const guidePadding = 14
  const headerOffset = 36 // approx height of track/week label + margin
  const guideTopOffset = headerOffset + guidePadding
  const contentBlurClass = settingsOpen ? 'blur-[2px]' : ''

  return (
    <div className="relative pt-2">
      <div className="absolute right-0 top-0 z-30 flex items-center gap-2 pr-1 pointer-events-auto">
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
      <div className={`relative ${contentBlurClass} transition filter`} data-timeline-body>
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
            height={computedHeight}
            sprintLength={sprintLength}
            weekHeight={effectiveWeekHeight}
            padding={guidePadding}
            startWeekDate={timelineStartDate}
            labelMode={weekLabelMode}
          />
          <div className="flex gap-10">
            {tracks.map((track) => {
              const clampedStartWeek = timelineStartDate
                ? Math.max(1, Math.min(totalWeeks, Math.floor(track.startWeek ?? 1)))
                : 1
              const clampedEndWeek = timelineStartDate
                ? Math.max(clampedStartWeek, Math.min(totalWeeks, Math.floor(track.endWeek ?? totalWeeks)))
                : totalWeeks
              const trackWeeks = Math.max(1, clampedEndWeek - clampedStartWeek + 1)
              const trackHeight = trackWeeks * effectiveWeekHeight
              const offsetTop = (clampedStartWeek - 1) * effectiveWeekHeight

              return (
                <MultiLineTimelineTrack
                  key={track.id}
                  track={track}
                  trackHeight={trackHeight}
                  startWeekDate={timelineStartDate}
                  totalWeeks={totalWeeks}
                  offsetTop={offsetTop}
                  guidePadding={guidePadding}
                  weekHeight={effectiveWeekHeight}
                  selectedId={selectedId}
                  onSelect={(id) => setSelectedId(id)}
                />
              )
            })}
          </div>
        </div>
      </div>
      <TimelineSettingsDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        labelMode={weekLabelMode}
        onLabelModeChange={setWeekLabelMode}
        startWeekDate={timelineStartDate}
        scale={scale}
        onScaleChange={setScale}
      />
    </div>
  )
}
