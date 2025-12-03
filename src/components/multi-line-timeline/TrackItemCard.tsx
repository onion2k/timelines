import { type MultiLineTimelineItem } from './types'

export function TrackItemCard({ item, selected }: { item: MultiLineTimelineItem; selected: boolean }) {
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
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[0.625rem] text-gray">
            {item.at}
            {item.endAt ? ` → ${item.endAt}` : ''}
          </p>
          <p className="text-sm font-semibold text-gray-dark">{item.title}</p>
        </div>
      </div>
      <p className="text-sm text-gray-dark">{item.annotation}</p>
    </div>
  )
}
