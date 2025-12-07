import { type ReactNode } from 'react'

export type MultiLineTimelineItem = {
  id: string
  title: string
  annotation: string
  at?: string
  endAt?: string
  icon?: ReactNode
}

export type MultiLineTimelineTrack = {
  id: string
  name: string
  color: string
  items: MultiLineTimelineItem[]
  startWeek?: number
  endWeek?: number
}

export type MultiLineTimelineProps = {
  tracks: MultiLineTimelineTrack[]
  weeks?: number
  sprintLength?: number
  weekHeight?: number
  milestones?: Milestone[]
}

export type Milestone = { project: string; title: string; at: string }
export type ScaleOption = 'small' | 'medium' | 'large'

export type ItemLine = {
  id: string
  topPx: number
  heightPx: number
  lane: number
  title: string
  at?: string
  endAt?: string
  annotation?: string
}

export type DurationSpan = { id: string; topPx: number; heightPx: number }
