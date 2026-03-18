export const dynamic = "force-dynamic"

import { query } from "@/lib/supabase"
import type { SoftPost, SoftVote, User } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, ThumbsUp, CheckCircle, Clock, XCircle, Radio } from "lucide-react"
import { PostsTable } from "@/components/dashboard/posts-table"
import { VotesTable } from "@/components/dashboard/votes-table"

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

  const userMap: Record<string, Pick<User, "id" | "handle" | "display_name">> = {}
  for (const u of users) userMap[u.id] = u

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
          <PostsTable posts={posts} userMap={userMap} />
        </TabsContent>

        <TabsContent value="votes" className="mt-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            {Object.entries(voteStatusCounts).map(([status, count]) => (
              <Badge key={status} variant="outline" className="gap-1.5 px-2.5 py-1">{statusIcon(status)}{count} {status}</Badge>
            ))}
          </div>
          <VotesTable votes={votes} userMap={userMap} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
