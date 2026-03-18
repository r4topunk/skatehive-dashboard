export const dynamic = "force-dynamic"

import { query } from "@/lib/supabase"
import type { Sponsorship, User, Identity, SoftPost, SoftVote } from "@/lib/types"
import { getUserTier, tierConfig } from "@/lib/tiers"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { CheckCircle, Clock, AlertTriangle, Loader2, ExternalLink, Sparkles, Trophy } from "lucide-react"

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}
function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}
function truncateTx(tx: string) { return `${tx.slice(0, 8)}...${tx.slice(-6)}` }

const statusConfig: Record<string, { icon: typeof CheckCircle; color: string; bg: string }> = {
  completed: { icon: CheckCircle, color: "text-primary", bg: "bg-primary/10" },
  pending: { icon: Clock, color: "text-chart-4", bg: "bg-chart-4/10" },
  processing: { icon: Loader2, color: "text-chart-2", bg: "bg-chart-2/10" },
  failed: { icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10" },
}

export default async function SponsorshipsPage() {
  const [sponsorships, users, identities, softPosts, softVotes] = await Promise.all([
    query<Sponsorship>("userbase_sponsorships", { order: "created_at.desc" }),
    query<User>("userbase_users"),
    query<Identity>("userbase_identities"),
    query<Pick<SoftPost, "id" | "user_id">>("userbase_soft_posts", { select: "id,user_id" }),
    query<Pick<SoftVote, "id" | "user_id">>("userbase_soft_votes", { select: "id,user_id" }),
  ])

  const userMap = new Map<string, User>()
  for (const u of users) userMap.set(u.id, u)

  const identityMap = new Map<string, Identity[]>()
  for (const id of identities) {
    const arr = identityMap.get(id.user_id) ?? []
    arr.push(id)
    identityMap.set(id.user_id, arr)
  }

  const engagementMap = new Map<string, { posts: number; votes: number }>()
  for (const p of softPosts) { const e = engagementMap.get(p.user_id) ?? { posts: 0, votes: 0 }; e.posts++; engagementMap.set(p.user_id, e) }
  for (const v of softVotes) { const e = engagementMap.get(v.user_id) ?? { posts: 0, votes: 0 }; e.votes++; engagementMap.set(v.user_id, e) }

  const counts = sponsorships.reduce((acc, s) => { acc[s.status] = (acc[s.status] ?? 0) + 1; return acc }, {} as Record<string, number>)
  const totalCost = sponsorships.filter((s) => s.status === "completed" && s.cost_amount).reduce((sum, s) => sum + (s.cost_amount ?? 0), 0)

  const sponsorCounts = sponsorships.filter((s) => s.status === "completed").reduce((acc, s) => {
    acc.set(s.sponsor_user_id, (acc.get(s.sponsor_user_id) ?? 0) + 1); return acc
  }, new Map<string, number>())
  const leaderboard = Array.from(sponsorCounts.entries()).sort((a, b) => b[1] - a[1]).map(([userId, count]) => ({ user: userMap.get(userId), count }))

  const candidates = users
    .filter((u) => { const tier = getUserTier(identityMap.get(u.id) ?? []); if (tier === "full") return false; const eng = engagementMap.get(u.id); return eng && (eng.posts > 0 || eng.votes > 0) })
    .sort((a, b) => { const ea = engagementMap.get(a.id); const eb = engagementMap.get(b.id); return ((eb?.posts ?? 0) + (eb?.votes ?? 0)) - ((ea?.posts ?? 0) + (ea?.votes ?? 0)) })
    .slice(0, 6)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">Sponsorships</h1>
        <p className="text-sm text-muted-foreground">{sponsorships.length} sponsorships · {totalCost} HIVE spent · 3 HIVE per account</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {(["completed", "pending", "processing", "failed"] as const).map((status, i) => {
          const config = statusConfig[status]; const Icon = config.icon
          return (
            <Card key={status} className="animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
              <CardContent className="flex items-center gap-3 p-4">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${config.bg}`}><Icon className={`size-4 ${config.color}`} /></div>
                <div><div className="font-heading text-2xl font-bold">{counts[status] ?? 0}</div><div className="text-xs capitalize text-muted-foreground">{status}</div></div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 animate-fade-up" style={{ animationDelay: "320ms" }}>
          <CardHeader><CardTitle className="font-heading text-base font-semibold">All Sponsorships</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Hive Account</TableHead>
                  <TableHead>Lite User</TableHead>
                  <TableHead>Sponsor</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-6 text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sponsorships.map((s) => {
                  const liteUser = userMap.get(s.lite_user_id); const sponsorUser = userMap.get(s.sponsor_user_id)
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
          </CardContent>
        </Card>

        <div className="space-y-6">
          {leaderboard.length > 0 && (
            <Card className="animate-fade-up" style={{ animationDelay: "400ms" }}>
              <CardHeader><CardTitle className="font-heading text-base font-semibold flex items-center gap-2"><Trophy className="size-4 text-chart-4" />Sponsor Leaderboard</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {leaderboard.map(({ user, count }, i) => (
                  <div key={user?.id ?? i} className="flex items-center justify-between rounded-lg border p-2.5">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-chart-4/10 text-[10px] font-bold text-chart-4">#{i + 1}</span>
                      <span className="text-sm font-medium">{user?.display_name ?? user?.handle ?? "unknown"}</span>
                    </div>
                    <Badge variant="secondary" className="font-mono-data text-[10px]">{count} sponsored</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {candidates.length > 0 && (
            <Card className="animate-fade-up border-dashed border-chart-4/30" style={{ animationDelay: "480ms" }}>
              <CardHeader>
                <CardTitle className="font-heading text-base font-semibold flex items-center gap-2"><Sparkles className="size-4 text-chart-4" />Candidates</CardTitle>
                <p className="text-[11px] text-muted-foreground">Active non-Hive users ready for sponsorship</p>
              </CardHeader>
              <CardContent className="space-y-2">
                {candidates.map((user) => {
                  const tier = getUserTier(identityMap.get(user.id) ?? []); const config = tierConfig[tier]; const eng = engagementMap.get(user.id)!
                  return (
                    <div key={user.id} className="flex items-center justify-between rounded-lg border border-dashed p-2.5">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{user.display_name ?? user.handle ?? "—"}</div>
                        <div className="text-[10px] text-muted-foreground">{eng.posts} posts · {eng.votes} votes · joined {timeAgo(user.created_at)}</div>
                      </div>
                      <span className={`shrink-0 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${config.bg} ${config.color}`}>{config.label}</span>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
