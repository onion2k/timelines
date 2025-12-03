import { type MultiLineTimelineItem } from './types'
import { TrackItemCard } from './TrackItemCard'

type TrackItemRowProps = {
  item: MultiLineTimelineItem
  leftOffset: number
  topOffset: number
  zIndex: number
  selected: boolean
  onSelect: (id: string) => void
}

export function TrackItemRow({ item, leftOffset, topOffset, zIndex, selected, onSelect }: TrackItemRowProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item.id)}
      className="absolute text-left w-full focus:outline-none"
      style={{
        left: 0,
        top: `${topOffset}px`,
        zIndex,
        transform: `translateX(${leftOffset}px)`,
      }}
    >
      <TrackItemCard item={item} selected={selected} />
    </button>
  )
}
