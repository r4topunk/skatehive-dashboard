"use client"

import { useState, useMemo } from "react"
import type { SoftVote, User } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { SortableHead, type SortDirection, useSortToggle } from "@/components/ui/sortable-head"
import { ExternalLink, CheckCircle, Clock, XCircle, Radio } from "lucide-react"

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
}

function statusIcon(status: string) {
  switch (status) {
    case "broadcasted": return <CheckCircle className="size-3 text-primary" />
    case "pending": return <Clock className="size-3 text-chart-4" />
    case "broadcasting": return <Radio className="size-3 text-chart-2" />
    case "failed": return <XCircle className="size-3 text-destructive" />
    default: return <Clock className="size-3 text-muted-foreground" />
  }
}

type SortKey = "voter" | "author" | "weight" | "status" | "created_at"

type Props = {
  votes: SoftVote[]
  userMap: Record<string, Pick<User, "id" | "handle" | "display_name">>
}

export function VotesTable({ votes, userMap }: Props) {
  const [sortKey, setSortKey] = useState<SortKey | null>(null)
  const [sortDir, setSortDir] = useState<SortDirection>(null)
  const toggle = useSortToggle(sortKey, sortDir, setSortKey, setSortDir)

  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return votes
    return [...votes].sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case "voter": {
          const aName = userMap[a.user_id]?.display_name ?? userMap[a.user_id]?.handle ?? a.user_id
          const bName = userMap[b.user_id]?.display_name ?? userMap[b.user_id]?.handle ?? b.user_id
          cmp = aName.localeCompare(bName); break
        }
        case "author": cmp = a.author.localeCompare(b.author); break
        case "weight": cmp = a.weight - b.weight; break
        case "status": cmp = a.status.localeCompare(b.status); break
        case "created_at": cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime(); break
      }
      return sortDir === "asc" ? cmp : -cmp
    })
  }, [votes, sortKey, sortDir, userMap])

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHead className="pl-6" active={sortKey === "voter"} direction={sortDir} onClick={() => toggle("voter")}>Voter</SortableHead>
              <SortableHead active={sortKey === "author"} direction={sortDir} onClick={() => toggle("author")}>Author</SortableHead>
              <TableHead>Permlink</TableHead>
              <SortableHead active={sortKey === "weight"} direction={sortDir} onClick={() => toggle("weight")}>Weight</SortableHead>
              <SortableHead active={sortKey === "status"} direction={sortDir} onClick={() => toggle("status")}>Status</SortableHead>
              <SortableHead className="pr-6 text-right" active={sortKey === "created_at"} direction={sortDir} onClick={() => toggle("created_at")}>Created</SortableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((vote, i) => {
              const user = userMap[vote.user_id]
              return (
                <TableRow key={vote.id} className="table-row-hover animate-fade-up" style={{ animationDelay: `${Math.min(i * 20, 300)}ms` }}>
                  <TableCell className="pl-6"><span className="text-sm">{user?.display_name ?? user?.handle ?? vote.user_id.slice(0, 8)}</span></TableCell>
                  <TableCell><span className="text-sm font-medium">@{vote.author}</span></TableCell>
                  <TableCell>
                    <a href={`https://peakd.com/@${vote.author}/${vote.permlink}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-mono-data text-xs text-muted-foreground hover:text-foreground transition-colors">
                      {vote.permlink.length > 24 ? `${vote.permlink.slice(0, 22)}...` : vote.permlink}<ExternalLink className="size-2.5" />
                    </a>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <div className="h-1.5 rounded-full bg-primary" style={{ width: `${Math.abs(vote.weight) / 100}px` }} />
                      <span className={`font-mono-data text-xs font-medium ${vote.weight > 0 ? "text-primary" : "text-destructive"}`}>
                        {vote.weight > 0 ? "+" : ""}{(vote.weight / 100).toFixed(0)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">{statusIcon(vote.status)}<span className="text-xs capitalize">{vote.status}</span></div>
                    {vote.error && <div className="mt-0.5 text-[10px] text-destructive truncate max-w-[160px]">{vote.error}</div>}
                  </TableCell>
                  <TableCell className="pr-6 text-right"><span className="font-mono-data text-xs text-muted-foreground">{formatDate(vote.created_at)}</span></TableCell>
                </TableRow>
              )
            })}
            {votes.length === 0 && <TableRow><TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">No soft votes yet.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
