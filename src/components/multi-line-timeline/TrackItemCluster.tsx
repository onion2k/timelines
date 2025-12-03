import { BASE_Z_INDEX, SELECTED_Z_INDEX, STACK_LEFT_BASE } from './constants'
import { type ItemCluster } from './types'
import { StackBadge } from './StackBadge'
import { TrackItemRow } from './TrackItemRow'

type TrackItemClusterProps = {
  cluster: ItemCluster
  color: string
  selectedId: string | null
  onSelect: (id: string) => void
}

export function TrackItemCluster({ cluster, color, selectedId, onSelect }: TrackItemClusterProps) {
  const hasStack = cluster.items.length > 1
  return (
    <div
      className="absolute right-0"
      style={{
        top: `${cluster.containerTop}px`,
        left: `${STACK_LEFT_BASE}px`,
        height: `${cluster.containerHeight}px`,
      }}
    >
      <div className="relative" style={{ height: cluster.containerHeight }}>
        {hasStack ? (
          <div className="absolute -left-6 -top-4">
            <StackBadge count={cluster.items.length} color={color} />
          </div>
        ) : null}
        {cluster.items.map((entry, idx) => (
          <TrackItemRow
            key={entry.item.id}
            item={entry.item}
            leftOffset={0}
            topOffset={entry.cardTop - cluster.containerTop}
            zIndex={selectedId === entry.item.id ? SELECTED_Z_INDEX : BASE_Z_INDEX - idx}
            selected={selectedId === entry.item.id}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  )
}
