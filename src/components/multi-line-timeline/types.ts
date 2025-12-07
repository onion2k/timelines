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

export type PositionedItem = { item: MultiLineTimelineItem; topPx: number }
export type PositionedItemWithBounds = PositionedItem & { cardTop: number; cardBottom: number }
export type ItemCluster = {
  id: string
  items: PositionedItemWithBounds[]
  containerTop: number
  containerHeight: number
}

export type DurationSpan = { id: string; topPx: number; heightPx: number }
