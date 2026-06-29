export function UserAvatar({ name }: { name: string }) {
  const initial = name.charAt(0).toUpperCase()
  const firstName = name.split(' ')[0]
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-accent/25 bg-accent/10 py-1 pl-1 pr-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent font-display text-[13px] font-bold text-white">
        {initial}
      </div>
      <span className="max-w-[90px] truncate font-display text-[13px] font-semibold text-navy">
        {firstName}
      </span>
    </div>
  )
}
