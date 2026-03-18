"use client"

import { useState, useMemo } from "react"
import type { SoftPost, User } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
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

type SortKey = "author" | "title" | "type" | "status" | "created_at"

type Props = {
  posts: SoftPost[]
  userMap: Record<string, Pick<User, "id" | "handle" | "display_name">>
}

export function PostsTable({ posts, userMap }: Props) {
  const [sortKey, setSortKey] = useState<SortKey | null>(null)
  const [sortDir, setSortDir] = useState<SortDirection>(null)
  const toggle = useSortToggle(sortKey, sortDir, setSortKey, setSortDir)

  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return posts
    return [...posts].sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case "author": cmp = a.author.localeCompare(b.author); break
        case "title": cmp = (a.title ?? "").localeCompare(b.title ?? ""); break
        case "type": cmp = a.type.localeCompare(b.type); break
        case "status": cmp = a.status.localeCompare(b.status); break
        case "created_at": cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime(); break
      }
      return sortDir === "asc" ? cmp : -cmp
    })
  }, [posts, sortKey, sortDir])

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHead className="pl-6" active={sortKey === "author"} direction={sortDir} onClick={() => toggle("author")}>Author</SortableHead>
              <SortableHead active={sortKey === "title"} direction={sortDir} onClick={() => toggle("title")}>Title</SortableHead>
              <SortableHead active={sortKey === "type"} direction={sortDir} onClick={() => toggle("type")}>Type</SortableHead>
              <TableHead>Permlink</TableHead>
              <SortableHead active={sortKey === "status"} direction={sortDir} onClick={() => toggle("status")}>Status</SortableHead>
              <SortableHead className="pr-6 text-right" active={sortKey === "created_at"} direction={sortDir} onClick={() => toggle("created_at")}>Created</SortableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((post, i) => {
              const user = userMap[post.user_id]
              return (
                <TableRow key={post.id} className="table-row-hover animate-fade-up" style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}>
                  <TableCell className="pl-6">
                    <div>
                      <div className="text-sm font-medium">@{post.author}</div>
                      {user && <div className="text-[10px] text-muted-foreground">{user.display_name ?? user.handle}</div>}
                    </div>
                  </TableCell>
                  <TableCell><span className="text-sm truncate max-w-[200px] block">{post.title || "—"}</span></TableCell>
                  <TableCell><Badge variant="secondary" className="text-[10px]">{post.type}</Badge></TableCell>
                  <TableCell>
                    <a href={`https://peakd.com/@${post.author}/${post.permlink}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-mono-data text-xs text-muted-foreground hover:text-foreground transition-colors">
                      {post.permlink.length > 20 ? `${post.permlink.slice(0, 18)}...` : post.permlink}<ExternalLink className="size-2.5" />
                    </a>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">{statusIcon(post.status)}<span className="text-xs capitalize">{post.status}</span></div>
                    {post.error && <div className="mt-0.5 text-[10px] text-destructive truncate max-w-[160px]">{post.error}</div>}
                  </TableCell>
                  <TableCell className="pr-6 text-right"><span className="font-mono-data text-xs text-muted-foreground">{formatDate(post.created_at)}</span></TableCell>
                </TableRow>
              )
            })}
            {posts.length === 0 && <TableRow><TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">No soft posts yet.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
