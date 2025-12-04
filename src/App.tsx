import './App.css'
import { useEffect, useMemo, useState } from 'react'
import { MultiLineTimeline } from './components/MultiLineTimeline'
import { loadBranchTracks, loadMilestones } from './data/loaders'

const branchTracks = loadBranchTracks()
const milestones = loadMilestones()

function TimelineMinimap({
  tracks,
  weeks,
}: {
  tracks: ReturnType<typeof loadBranchTracks>
  weeks: number
}) {
  const [minimapHeight, setMinimapHeight] = useState(() => Math.round((typeof window !== 'undefined' ? window.innerHeight : 720) / 6))
  const [viewportBox, setViewportBox] = useState({ top: 0, height: 0 })

  const timelineMeta = useMemo(() => {
    const DAY_MS = 1000 * 60 * 60 * 24
    const WEEK_MS = DAY_MS * 7
    const normalizeDateToUTC = (date: Date) =>
      new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
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

    const allDates = tracks.flatMap((track) => track.items.map((item) => parseAtDate(item.at))).filter(Boolean) as Date[]
    if (!allDates.length) return null
    const rawStartDate = new Date(Math.min(...allDates.map((d) => d.getTime())))
    const rawEndDate = new Date(Math.max(...allDates.map((d) => d.getTime())))
    const originDate = normalizeDateToUTC(new Date(Date.UTC(rawStartDate.getUTCFullYear(), 0, 1)))
    const endWeekDate = getEndOfWeek(rawEndDate)
    const dataWeeks = Math.max(1, Math.floor((endWeekDate.getTime() - originDate.getTime()) / WEEK_MS) + 1)
    const totalWeeks = Math.max(weeks ?? dataWeeks, dataWeeks)
    return { startWeekDate: originDate, totalWeeks }
  }, [tracks, weeks])

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
    const clampNumber = (value: number, min: number, max: number) => {
      if (Number.isNaN(value)) return min
      return Math.min(max, Math.max(min, value))
    }
    const width = 220
    const columnWidth = width / Math.max(1, tracks.length)
    const scaleY = totalWeeks ? minimapHeight / totalWeeks : 0
    return tracks.flatMap((track, trackIdx) =>
      track.items
        .map((item) => {
          const atDate = parseAtDate(item.at)
          if (!atDate || !startWeekDate) return null
          const diffWeeks = (atDate.getTime() - startWeekDate.getTime()) / WEEK_MS
          const clamped = clampNumber(diffWeeks, 0, Math.max(totalWeeks, 1))
          return {
            id: item.id,
            top: clamped * scaleY,
            left: trackIdx * columnWidth + columnWidth / 2,
            color: track.color,
          }
        })
        .filter(Boolean),
    ) as { id: string; top: number; left: number; color: string }[]
  }, [minimapHeight, timelineMeta, tracks])

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
          {tracks.map((track, idx) => {
            const columnWidth = width / Math.max(1, tracks.length)
            const left = idx * columnWidth
            return (
              <div
                key={track.id}
                className="absolute top-0 h-full border-l first:border-l-0 border-gray-200/70"
                style={{ left, width: columnWidth }}
              >
                <div className="absolute left-1 top-1 h-1 w-1 rounded-full" style={{ backgroundColor: track.color }} aria-hidden />
              </div>
            )
          })}
          {markers.map((marker) => (
            <span
              key={marker.id}
              className="absolute h-2 w-2 rounded-full"
              style={{
                left: marker.left - 4,
                top: marker.top,
                backgroundColor: marker.color,
                boxShadow: `0 0 0 2px ${marker.color}1a`,
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

function App() {
  return (
    <div
      className="min-h-screen"
      style={{
        background:
          'radial-gradient(circle at 10% 10%, rgba(31,182,255,0.12), transparent 35%), radial-gradient(circle at 80% 0%, rgba(255,120,73,0.08), transparent 30%), #f7f8fb',
      }}
    >
      <div className="mx-auto flex flex-col gap-10">
        <section>
          <h2 className="text-xl font-bold text-gray-dark p-4">Onboarding</h2>
          <MultiLineTimeline
            tracks={branchTracks}
            milestones={milestones}
            weeks={52}
            sprintLength={2}
            weekHeight={90}
          />
        </section>
      </div>
      <TimelineMinimap tracks={branchTracks} weeks={52} />
    </div>
  )
}

export default App
