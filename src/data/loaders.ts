import tracksData from './branchTracks.json'
import milestonesData from './milestones.json'
import { type Milestone, type MultiLineTimelineItem, type MultiLineTimelineTrack } from '../components/MultiLineTimeline'

export type BranchTracksFieldMapping = {
  track: {
    id: string
    name: string
    color: string
    items?: string
    startWeek?: string
    endWeek?: string
  }
  item: {
    id: string
    title: string
    startDate: string
    endDate: string
    annotation?: string
  }
}

export const defaultBranchTracksFieldMapping: BranchTracksFieldMapping = {
  track: {
    id: 'id',
    name: 'name',
    color: 'colour',
    items: 'items',
    startWeek: 'startWeek',
    endWeek: 'endWeek',
  },
  item: {
    id: 'id',
    title: 'name',
    startDate: 'at',
    endDate: 'endAt',
    annotation: 'annotation',
  },
}

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

function pickStringField({
  source,
  fieldName,
  label,
}: {
  source: Record<string, unknown>
  fieldName: string
  label: string
}) {
  const value = source[fieldName]
  if (!isString(value)) throw new Error(`${label} must be a string (expected field: ${fieldName})`)
  return value
}

function validateItem(item: unknown, mapping: BranchTracksFieldMapping): MultiLineTimelineItem {
  if (typeof item !== 'object' || item === null) throw new Error('Item must be an object')
  const value = item as Record<string, unknown>
  const id = pickStringField({ source: value, fieldName: mapping.item.id, label: 'Item id' })
  const title = pickStringField({ source: value, fieldName: mapping.item.title, label: 'Item title' })
  const annotationField = mapping.item.annotation ?? 'annotation'
  const annotationValue =
    value[annotationField] ??
    // fallback to a common name if mapping points elsewhere
    (annotationField !== 'annotation' ? value.annotation : undefined)
  const annotation = isString(annotationValue) ? normalizeAnnotation(annotationValue) : ''
  const atValue = value[mapping.item.startDate]
  if (!isValidDateString(atValue)) throw new Error(`Invalid start date for item ${id} (expected field: ${mapping.item.startDate})`)
  const endAtField = mapping.item.endDate
  const endAtValue = value[endAtField]
  if (endAtValue !== undefined && !isValidDateString(endAtValue)) {
    throw new Error(`Invalid end date for item ${id} (expected field: ${endAtField})`)
  }
  return {
    id,
    title,
    annotation,
    at: atValue,
    endAt: endAtValue as string | undefined,
  }
}

function normalizeAnnotation(raw: string) {
  const cleaned = raw.trim()
  const withoutBrackets = cleaned.replace(/^\[/, '').replace(/\]$/, '')
  return withoutBrackets.trim().toLowerCase()
}

function validateTrack(track: unknown, mapping: BranchTracksFieldMapping): MultiLineTimelineTrack {
  if (typeof track !== 'object' || track === null) throw new Error('Track must be an object')
  const value = track as Record<string, unknown>
  const id = pickStringField({ source: value, fieldName: mapping.track.id, label: 'Track id' })
  const name = pickStringField({ source: value, fieldName: mapping.track.name, label: 'Track name' })
  const color = pickStringField({ source: value, fieldName: mapping.track.color, label: 'Track color' })
  const itemsField = mapping.track.items ?? 'items'
  const itemsSource = value[itemsField]
  if (!Array.isArray(itemsSource)) throw new Error(`Track ${id} items must be an array (expected field: ${itemsField})`)
  const itemIdCounts: Record<string, number> = {}
  const items = itemsSource.map((item) => {
    const validated = validateItem(item, mapping)
    const seenCount = itemIdCounts[validated.id] ?? 0
    itemIdCounts[validated.id] = seenCount + 1
    const uniqueId = seenCount === 0 ? validated.id : `${validated.id}__${seenCount + 1}`
    return { ...validated, id: uniqueId }
  })

  const startWeekField = mapping.track.startWeek
  const startWeekValue = startWeekField ? value[startWeekField] : undefined
  const startWeek = startWeekValue === undefined ? undefined : isNumber(startWeekValue) ? startWeekValue : undefined
  if (startWeekField && startWeekValue !== undefined && startWeek === undefined) {
    throw new Error(`Track ${id} has invalid startWeek (expected field: ${startWeekField})`)
  }

  const endWeekField = mapping.track.endWeek
  const endWeekValue = endWeekField ? value[endWeekField] : undefined
  const endWeek = endWeekValue === undefined ? undefined : isNumber(endWeekValue) ? endWeekValue : undefined
  if (endWeekField && endWeekValue !== undefined && endWeek === undefined) {
    throw new Error(`Track ${id} has invalid endWeek (expected field: ${endWeekField})`)
  }

  return { id, name, color, items, startWeek, endWeek }
}

function validateMilestone(milestone: unknown): Milestone {
  if (typeof milestone !== 'object' || milestone === null) throw new Error('Milestone must be an object')
  const value = milestone as Record<string, unknown>
  if (!isString(value.project_name)) throw new Error('Milestone missing project_name')
  if (!isString(value.title)) throw new Error('Milestone missing title')
  if (!isValidDateString(value.at)) throw new Error(`Milestone ${value.title} has invalid date`)
  return { project: value.project_name, title: value.title, at: value.at }
}

export function loadBranchTracks(
  data: unknown = tracksData,
  mapping: BranchTracksFieldMapping = defaultBranchTracksFieldMapping,
): MultiLineTimelineTrack[] {
  if (!Array.isArray(data)) throw new Error('Tracks data must be an array')
  return data.map((track) => validateTrack(track, mapping))
}

export function loadMilestones(): Milestone[] {
  if (!Array.isArray(milestonesData)) throw new Error('Milestones data must be an array')
  return milestonesData.map(validateMilestone)
}
