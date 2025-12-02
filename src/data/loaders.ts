import tracksData from './branchTracks.json'
import milestonesData from './milestones.json'
import { type Milestone, type MultiLineTimelineItem, type MultiLineTimelineTrack } from '../components/MultiLineTimeline'

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isValidDateString(value: unknown): value is string {
  if (!isString(value)) return false
  const d = new Date(value)
  return !Number.isNaN(d.getTime())
}

function validateItem(item: unknown): MultiLineTimelineItem {
  if (typeof item !== 'object' || item === null) throw new Error('Item must be an object')
  const value = item as Record<string, unknown>
  if (!isString(value.id) || !isString(value.title) || !isString(value.annotation)) {
    throw new Error('Item missing required string fields')
  }
  if (value.at && !isValidDateString(value.at)) throw new Error(`Invalid at date for item ${value.id}`)
  if (value.endAt && !isValidDateString(value.endAt)) throw new Error(`Invalid endAt date for item ${value.id}`)
  return {
    id: value.id,
    title: value.title,
    annotation: value.annotation,
    at: value.at as string | undefined,
    endAt: value.endAt as string | undefined,
  }
}

function validateTrack(track: unknown): MultiLineTimelineTrack {
  if (typeof track !== 'object' || track === null) throw new Error('Track must be an object')
  const value = track as Record<string, unknown>
  if (!isString(value.id) || !isString(value.name) || !isString(value.color)) {
    throw new Error('Track missing required string fields')
  }
  if (!Array.isArray(value.items)) throw new Error(`Track ${value.id} items must be an array`)
  const items = value.items.map(validateItem)
  const startWeek = value.startWeek === undefined ? undefined : isNumber(value.startWeek) ? value.startWeek : undefined
  const endWeek = value.endWeek === undefined ? undefined : isNumber(value.endWeek) ? value.endWeek : undefined
  if (value.startWeek !== undefined && startWeek === undefined) throw new Error(`Track ${value.id} has invalid startWeek`)
  if (value.endWeek !== undefined && endWeek === undefined) throw new Error(`Track ${value.id} has invalid endWeek`)
  return { id: value.id, name: value.name, color: value.color, items, startWeek, endWeek }
}

function validateMilestone(milestone: unknown): Milestone {
  if (typeof milestone !== 'object' || milestone === null) throw new Error('Milestone must be an object')
  const value = milestone as Record<string, unknown>
  if (!isString(value.title)) throw new Error('Milestone missing title')
  if (!isValidDateString(value.at)) throw new Error(`Milestone ${value.title} has invalid date`)
  return { title: value.title, at: value.at }
}

export function loadBranchTracks(): MultiLineTimelineTrack[] {
  if (!Array.isArray(tracksData)) throw new Error('Tracks data must be an array')
  return tracksData.map(validateTrack)
}

export function loadMilestones(): Milestone[] {
  if (!Array.isArray(milestonesData)) throw new Error('Milestones data must be an array')
  return milestonesData.map(validateMilestone)
}
