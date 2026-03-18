"use client"

import { useState, useMemo } from "react"
import type { Sponsorship, User } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { SortableHead, type SortDirection, useSortToggle } from "@/components/ui/sortable-head"
import { ExternalLink, CheckCircle, Clock, AlertTriangle, Loader2 } from "lucide-react"

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}
function truncateTx(tx: string) { return `${tx.slice(0, 8)}...${tx.slice(-6)}` }

const statusConfig: Record<string, { icon: typeof CheckCircle; color: string; bg: string }> = {
  completed: { icon: CheckCircle, color: "text-primary", bg: "bg-primary/10" },
  pending: { icon: Clock, color: "text-chart-4", bg: "bg-chart-4/10" },
  processing: { icon: Loader2, color: "text-chart-2", bg: "bg-chart-2/10" },
  failed: { icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10" },
}

type SortKey = "hive_username" | "lite_user" | "sponsor" | "cost" | "status" | "created_at"

type Props = {
  sponsorships: Sponsorship[]
  userMap: Record<string, User>
}

export function SponsorshipsTable({ sponsorships, userMap }: Props) {
  const [sortKey, setSortKey] = useState<SortKey | null>(null)
  const [sortDir, setSortDir] = useState<SortDirection>(null)
  const toggle = useSortToggle(sortKey, sortDir, setSortKey, setSortDir)

  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return sponsorships
    return [...sponsorships].sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case "hive_username": cmp = a.hive_username.localeCompare(b.hive_username); break
        case "lite_user": {
          const aName = userMap[a.lite_user_id]?.display_name ?? userMap[a.lite_user_id]?.handle ?? a.lite_user_id
          const bName = userMap[b.lite_user_id]?.display_name ?? userMap[b.lite_user_id]?.handle ?? b.lite_user_id
          cmp = aName.localeCompare(bName); break
        }
        case "sponsor": {
          const aName = userMap[a.sponsor_user_id]?.display_name ?? userMap[a.sponsor_user_id]?.handle ?? a.sponsor_user_id
          const bName = userMap[b.sponsor_user_id]?.display_name ?? userMap[b.sponsor_user_id]?.handle ?? b.sponsor_user_id
          cmp = aName.localeCompare(bName); break
        }
        case "cost": cmp = (a.cost_amount ?? 0) - (b.cost_amount ?? 0); break
        case "status": cmp = a.status.localeCompare(b.status); break
        case "created_at": cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime(); break
      }
      return sortDir === "asc" ? cmp : -cmp
    })
  }, [sponsorships, sortKey, sortDir, userMap])

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <SortableHead className="pl-6" active={sortKey === "hive_username"} direction={sortDir} onClick={() => toggle("hive_username")}>Hive Account</SortableHead>
          <SortableHead active={sortKey === "lite_user"} direction={sortDir} onClick={() => toggle("lite_user")}>Lite User</SortableHead>
          <SortableHead active={sortKey === "sponsor"} direction={sortDir} onClick={() => toggle("sponsor")}>Sponsor</SortableHead>
          <SortableHead active={sortKey === "cost"} direction={sortDir} onClick={() => toggle("cost")}>Cost</SortableHead>
          <SortableHead active={sortKey === "status"} direction={sortDir} onClick={() => toggle("status")}>Status</SortableHead>
          <SortableHead className="pr-6 text-right" active={sortKey === "created_at"} direction={sortDir} onClick={() => toggle("created_at")}>Date</SortableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((s) => {
          const liteUser = userMap[s.lite_user_id]; const sponsorUser = userMap[s.sponsor_user_id]
          const config = statusConfig[s.status] ?? statusConfig.pending
          return (
            <TableRow key={s.id} className="table-row-hover">
              <TableCell className="pl-6">
                <div>
                  <span className="font-mono-data text-sm font-medium">@{s.hive_username}</span>
                  {s.hive_tx_id && (
                    <a href={`https://hivehub.dev/tx/${s.hive_tx_id}`} target="_blank" rel="noopener noreferrer" className="mt-0.5 flex items-center gap-1 font-mono-data text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                      {truncateTx(s.hive_tx_id)}<ExternalLink className="size-2" />
                    </a>
                  )}
                </div>
              </TableCell>
              <TableCell><span className="text-sm">{liteUser?.display_name ?? liteUser?.handle ?? s.lite_user_id.slice(0, 8)}</span></TableCell>
              <TableCell><span className="text-sm font-medium">{sponsorUser?.display_name ?? sponsorUser?.handle ?? s.sponsor_user_id.slice(0, 8)}</span></TableCell>
              <TableCell><span className="font-mono-data text-sm">{s.cost_amount ? `${s.cost_amount} HIVE` : s.cost_type}</span></TableCell>
              <TableCell>
                <Badge variant={s.status === "completed" ? "default" : s.status === "failed" ? "destructive" : "secondary"} className="text-[10px] gap-1">
                  <config.icon className="size-2.5" />{s.status}
                </Badge>
              </TableCell>
              <TableCell className="pr-6 text-right"><span className="font-mono-data text-xs text-muted-foreground">{formatDate(s.created_at)}</span></TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
