export const dynamic = "force-dynamic"

import { query } from "@/lib/supabase"
import type { SoftPost, SoftVote, User } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { FileText, ThumbsUp, ExternalLink, CheckCircle, Clock, XCircle, Radio } from "lucide-react"

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

export default async function ActivityPage() {
  const [posts, votes, users] = await Promise.all([
    query<SoftPost>("userbase_soft_posts", { order: "created_at.desc" }),
    query<SoftVote>("userbase_soft_votes", { order: "created_at.desc" }),
    query<Pick<User, "id" | "handle" | "display_name">>("userbase_users", { select: "id,handle,display_name" }),
  ])

  const userMap = new Map<string, Pick<User, "id" | "handle" | "display_name">>()
  for (const u of users) userMap.set(u.id, u)

  const postStatusCounts = posts.reduce((acc, p) => { acc[p.status] = (acc[p.status] ?? 0) + 1; return acc }, {} as Record<string, number>)
  const voteStatusCounts = votes.reduce((acc, v) => { acc[v.status] = (acc[v.status] ?? 0) + 1; return acc }, {} as Record<string, number>)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">Activity</h1>
        <p className="text-sm text-muted-foreground">Soft content — {posts.length} posts · {votes.length} votes</p>
      </div>

      <Tabs defaultValue="posts">
        <TabsList>
          <TabsTrigger value="posts" className="gap-1.5"><FileText className="size-3.5" />Posts<Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">{posts.length}</Badge></TabsTrigger>
          <TabsTrigger value="votes" className="gap-1.5"><ThumbsUp className="size-3.5" />Votes<Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">{votes.length}</Badge></TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            {Object.entries(postStatusCounts).map(([status, count]) => (
              <Badge key={status} variant="outline" className="gap-1.5 px-2.5 py-1">{statusIcon(status)}{count} {status}</Badge>
            ))}
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Author</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Permlink</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="pr-6 text-right">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posts.map((post, i) => {
                    const user = userMap.get(post.user_id)
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
        </TabsContent>

        <TabsContent value="votes" className="mt-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            {Object.entries(voteStatusCounts).map(([status, count]) => (
              <Badge key={status} variant="outline" className="gap-1.5 px-2.5 py-1">{statusIcon(status)}{count} {status}</Badge>
            ))}
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Voter</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Permlink</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="pr-6 text-right">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {votes.map((vote, i) => {
                    const user = userMap.get(vote.user_id)
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
