import { type ItemLine } from './types'

type TrackItemLineProps = {
  line: ItemLine
  color: string
  laneWidth?: number
  baseLeft?: number
  lineWidth?: number
  selected?: boolean
  onClick?: () => void
}

const LINE_PADDING = 6
const DEFAULT_LANE_WIDTH = 18
const DEFAULT_BASE_LEFT = 14

export function TrackItemLine({
  line,
  color,
  laneWidth = DEFAULT_LANE_WIDTH,
  baseLeft = DEFAULT_BASE_LEFT,
  lineWidth = 6,
  selected = false,
  onClick,
}: TrackItemLineProps) {
  const svgHeight = line.heightPx + LINE_PADDING * 2
  const startY = LINE_PADDING
  const endY = svgHeight - LINE_PADDING
  const x = baseLeft + line.lane * laneWidth
  const containerTop = Math.max(0, line.topPx - LINE_PADDING)
  const stroke = Math.max(2, lineWidth)
  const nodeRadius = Math.max(3, Math.round(stroke * 0.7))
  const strokeColor = selected ? '#1fb6ff' : color
  const strokeOpacity = selected ? 1 : 0.85

  return (
    <div
      className="absolute"
      style={{ top: containerTop, left: x, cursor: 'pointer' }}
      role="button"
      tabIndex={-1}
      onClick={onClick}
    >
      <svg width={22} height={svgHeight} viewBox={`0 0 22 ${svgHeight}`}>
        <title>{`${line.title} (${line.at ?? 'start'}${line.endAt ? ` → ${line.endAt}` : ''})`}</title>
        <g filter="url(#line-glow)">
          <line
            x1="11"
            y1={startY}
            x2="11"
            y2={endY}
            stroke={strokeColor}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeOpacity={strokeOpacity}
          />
          <circle cx="11" cy={startY} r={nodeRadius} fill={strokeColor} fillOpacity={0.95} />
          <circle cx="11" cy={endY} r={nodeRadius} fill={strokeColor} fillOpacity={0.95} />
        </g>
        <defs>
          <filter id="line-glow" x="-12" y="0" width="46" height={svgHeight} colorInterpolationFilters="sRGB">
            <feDropShadow dx="0" dy="0" stdDeviation={selected ? '3' : '2'} floodColor={strokeColor} floodOpacity="0.3" />
          </filter>
        </defs>
      </svg>
    </div>
  )
}
