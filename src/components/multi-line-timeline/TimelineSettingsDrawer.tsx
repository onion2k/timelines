import { type ScaleOption, type WeekLabelMode } from './types'

type TimelineSettingsDrawerProps = {
  open: boolean
  onClose: () => void
  labelMode: WeekLabelMode
  onLabelModeChange: (mode: WeekLabelMode) => void
  startWeekDate: Date | null
  scale: ScaleOption
  onScaleChange: (scale: ScaleOption) => void
}

export function TimelineSettingsDrawer({
  open,
  onClose,
  labelMode,
  onLabelModeChange,
  startWeekDate,
  scale,
  onScaleChange,
}: TimelineSettingsDrawerProps) {
  if (!open) return null

  const canShowDates = Boolean(startWeekDate)

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
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-dark/80">Timeline scale</p>
            <div className="mt-3 inline-flex rounded-full bg-gray-light/60 p-1 text-[0.75rem] font-semibold text-gray-dark shadow-sm">
              <button
                type="button"
                className={`rounded-full px-3 py-1 transition ${labelMode === 'weeks' ? 'bg-white shadow-sm' : 'hover:bg-white/60'}`}
                aria-pressed={labelMode === 'weeks'}
                onClick={() => onLabelModeChange('weeks')}
              >
                Weeks
              </button>
              <button
                type="button"
                className={`rounded-full px-3 py-1 transition ${labelMode === 'dates' ? 'bg-white shadow-sm' : 'hover:bg-white/60'} ${!canShowDates ? 'cursor-not-allowed opacity-50' : ''}`}
                aria-pressed={labelMode === 'dates'}
                onClick={() => canShowDates && onLabelModeChange('dates')}
                disabled={!canShowDates}
              >
                Dates
              </button>
            </div>
            {!canShowDates ? (
              <p className="mt-2 text-xs text-gray">Dates become available once a valid start date is detected.</p>
            ) : null}
          </div>
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
        </div>
      </div>
    </div>
  )
}
