import { type MultiLineTimelineItem } from './types'

export function TrackItemCard({ item, selected }: { item: MultiLineTimelineItem; selected: boolean }) {
  const annotation = item.annotation?.trim()
  const annotationStyle = (() => {
    if (!annotation) {
      return null
    }
    const key = annotation.toLowerCase()
    const palette: Record<
      string,
      { bg: string; text: string; border: string; shadow: string }
    > = {
      bug: { bg: '#fef2f2', text: '#991b1b', border: '#fecdd3', shadow: 'rgba(185,28,28,0.25)' },
      epic: { bg: '#f3e8ff', text: '#5b21b6', border: '#e9d5ff', shadow: 'rgba(91,33,182,0.25)' },
      spike: { bg: '#fff7ed', text: '#9a3412', border: '#fed7aa', shadow: 'rgba(154,52,18,0.25)' },
      incident: { bg: '#fef3c7', text: '#92400e', border: '#fde68a', shadow: 'rgba(146,64,14,0.25)' },
      release: { bg: '#ecfeff', text: '#0e7490', border: '#a5f3fc', shadow: 'rgba(14,116,144,0.25)' },
    }
    const fallback = { bg: '#e2e8f0', text: '#273444', border: '#cbd5e1', shadow: 'rgba(39,52,68,0.18)' }
    return palette[key] ?? fallback
  })()

  return (
    <div
      className="relative flex-1 rounded-xl border ml-1 px-3 py-2 shadow transition duration-150"
      style={{
        borderColor: selected ? '#1fb6ff' : '#d3dce6',
        background: 'rgba(255,255,255,0.97)',
        boxShadow: selected ? '0 10px 30px rgba(0,0,0,0.12), 0 0 0 2px rgba(31,182,255,0.25)' : '0 4px 12px rgba(0,0,0,0.05)',
        transform: selected ? 'translateY(-2px)' : 'translateY(0)',
      }}
    >
      {annotationStyle ? (
        <span
          className="absolute right-2 top-2 inline-flex items-center rounded-full px-2 py-0.5 text-[0.625rem] leading-tight uppercase tracking-wide font-medium"
          style={{
            backgroundColor: annotationStyle.bg,
            color: annotationStyle.text,
            border: `1px solid ${annotationStyle.border}`,
          }}
        >
          {annotation}
        </span>
      ) : null}
      <div className="flex items-start justify-between gap-2">
        <div className="pr-12">
          <p className="text-[0.625rem] text-gray">
            {item.at}
            {item.endAt ? ` → ${item.endAt}` : ''}
          </p>
          <p className="text-sm font-semibold text-gray-dark">{item.title}</p>
        </div>
      </div>
    </div>
  )
}
