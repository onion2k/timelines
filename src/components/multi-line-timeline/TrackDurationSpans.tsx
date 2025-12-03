import { type DurationSpan } from './types'

export function TrackDurationSpans({ spans, color }: { spans: DurationSpan[]; color: string }) {
  return (
    <>
      {spans.map((span) => (
        <div
          key={`${span.id}-span`}
          className="absolute w-[12px]"
          style={{
            left: '0.6rem',
            transform: 'translateX(-50%)',
            top: span.topPx,
            height: span.heightPx,
            backgroundColor: `${color}`,
            opacity: 0.25,
            clipPath: 'polygon(0 0, 100% 6px, 100% calc(100% - 6px), 0 100%)',
          }}
          aria-hidden
        />
      ))}
    </>
  )
}
