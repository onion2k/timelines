export function StackBadge({ count, color }: { count: number; color: string }) {
  return (
    <div
      className="flex h-6 min-w-[24px] items-center justify-center rounded-full px-2 text-[10px] font-semibold text-white shadow"
      style={{ backgroundColor: color }}
    >
      {count}x
    </div>
  )
}
