import { type ScaleOption } from './types'

type TimelineSettingsDrawerProps = {
  open: boolean
  onClose: () => void
  scale: ScaleOption
  onScaleChange: (scale: ScaleOption) => void
  lineWidth: number
  onLineWidthChange: (width: number) => void
  lineSpacing: number
  onLineSpacingChange: (spacing: number) => void
}

export function TimelineSettingsDrawer({
  open,
  onClose,
  scale,
  onScaleChange,
  lineWidth,
  onLineWidthChange,
  lineSpacing,
  onLineSpacingChange,
}: TimelineSettingsDrawerProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close settings"
        className="absolute inset-0 bg-gray-dark/30 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <div className="absolute right-0 top-0 flex h-full w-[320px] flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-gray-dark">Timeline settings</p>
            <p className="text-xs text-gray">Adjust how the scale is displayed.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border px-3 py-1 text-xs font-semibold text-gray-dark hover:bg-gray-light/50"
          >
            Close
          </button>
        </div>
        <div className="flex-1 overflow-auto px-5 py-4">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-dark/80">Scale</p>
            <div className="mt-3 flex flex-col gap-2 text-sm font-semibold text-gray-dark">
              {([
                { value: 'small', label: 'Small' },
                { value: 'medium', label: 'Medium' },
                { value: 'large', label: 'Large' },
              ] as const).map((option) => (
                <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="timeline-scale"
                    value={option.value}
                    checked={scale === option.value}
                    onChange={() => onScaleChange(option.value)}
                    className="h-4 w-4 border-gray-light text-gray-dark focus:ring-1 focus:ring-offset-1 focus:ring-gray-dark"
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-dark/80">Line width</p>
            <div className="mt-3 flex items-center gap-3">
              <input
                type="range"
                min={2}
                max={16}
                value={lineWidth}
                onChange={(e) => onLineWidthChange(Number(e.target.value))}
                className="flex-1 accent-gray-dark"
              />
              <span className="w-10 text-right text-sm font-semibold text-gray-dark">{lineWidth}px</span>
            </div>
          </div>
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-dark/80">Line spacing</p>
            <div className="mt-3 flex items-center gap-3">
              <input
                type="range"
                min={10}
                max={36}
                value={lineSpacing}
                onChange={(e) => onLineSpacingChange(Number(e.target.value))}
                className="flex-1 accent-gray-dark"
              />
              <span className="w-10 text-right text-sm font-semibold text-gray-dark">{lineSpacing}px</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
