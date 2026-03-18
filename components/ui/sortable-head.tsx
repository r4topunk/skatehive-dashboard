"use client"

import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

export type SortDirection = "asc" | "desc" | null

type Props = {
  children: React.ReactNode
  active: boolean
  direction: SortDirection
  onClick: () => void
  className?: string
}

export function SortableHead({ children, active, direction, onClick, className }: Props) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground [&:has([role=checkbox])]:pr-0 cursor-pointer select-none group/sort",
        className
      )}
      onClick={onClick}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {active && direction === "asc" ? (
          <ArrowUp className="size-3 text-foreground" />
        ) : active && direction === "desc" ? (
          <ArrowDown className="size-3 text-foreground" />
        ) : (
          <ArrowUpDown className="size-3 text-muted-foreground/40 group-hover/sort:text-muted-foreground transition-colors" />
        )}
      </span>
    </th>
  )
}

export function useSortToggle<T extends string>(
  sortKey: T | null,
  sortDir: SortDirection,
  setSortKey: (key: T | null) => void,
  setSortDir: (dir: SortDirection) => void,
) {
  return (key: T) => {
    if (sortKey === key) {
      if (sortDir === "desc") setSortDir("asc")
      else if (sortDir === "asc") { setSortKey(null); setSortDir(null) }
    } else {
      setSortKey(key)
      setSortDir("desc")
    }
  }
}
