export const dynamic = "force-dynamic"

import { query } from "@/lib/supabase"
import type { User, Identity, Sponsorship, SoftPost, SoftVote } from "@/lib/types"
import { getUserTier, tierConfig, type AccountTier } from "@/lib/tiers"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Users, Wallet, Shield, Mail, ArrowUpRight, Sparkles } from "lucide-react"
import Link from "next/link"

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function truncateAddr(addr: string) {
  return addr.length <= 12 ? addr : `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

export default async function OverviewPage() {
  const [users, identities, sponsorships, softPosts, softVotes] = await Promise.all([
    query<User>("userbase_users", { order: "created_at.desc" }),
    query<Identity>("userbase_identities"),
    query<Sponsorship>("userbase_sponsorships", { order: "created_at.desc" }),
    query<Pick<SoftPost, "id" | "user_id" | "status">>("userbase_soft_posts", { select: "id,user_id,status" }),
    query<Pick<SoftVote, "id" | "user_id" | "status">>("userbase_soft_votes", { select: "id,user_id,status" }),
  ])

  const identityMap = new Map<string, Identity[]>()
  for (const id of identities) {
    const arr = identityMap.get(id.user_id) ?? []
    arr.push(id)
    identityMap.set(id.user_id, arr)
  }

  const engagementMap = new Map<string, { posts: number; votes: number }>()
  for (const p of softPosts) {
    const e = engagementMap.get(p.user_id) ?? { posts: 0, votes: 0 }
    e.posts++
    engagementMap.set(p.user_id, e)
  }
  for (const v of softVotes) {
    const e = engagementMap.get(v.user_id) ?? { posts: 0, votes: 0 }
    e.votes++
    engagementMap.set(v.user_id, e)
  }

  const tierCounts: Record<AccountTier, number> = { full: 0, evm: 0, lite: 0 }
  const userTiers = new Map<string, AccountTier>()
  for (const user of users) {
    const tier = getUserTier(identityMap.get(user.id) ?? [])
    tierCounts[tier]++
    userTiers.set(user.id, tier)
  }

  const completedSponsorships = sponsorships.filter((s) => s.status === "completed").length
  const pendingSponsorships = sponsorships.filter((s) => s.status === "pending" || s.status === "processing").length
  const totalHiveSpent = sponsorships
    .filter((s) => s.status === "completed" && s.cost_amount)
    .reduce((sum, s) => sum + (s.cost_amount ?? 0), 0)

  const candidates = users
    .filter((u) => {
      const tier = userTiers.get(u.id)
      if (tier === "full") return false
      const eng = engagementMap.get(u.id)
      return eng && (eng.posts > 0 || eng.votes > 0)
    })
    .slice(0, 8)

  const recentUsers = users.slice(0, 10)

  const tierStats = [
    { key: "full" as const, icon: Shield, count: tierCounts.full },
    { key: "evm" as const, icon: Wallet, count: tierCounts.evm },
    { key: "lite" as const, icon: Mail, count: tierCounts.lite },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">Overview</h1>
        <p className="text-sm text-muted-foreground">
          {users.length} accounts across {identities.length} linked identities
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="group relative overflow-hidden animate-fade-up">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              Total Accounts
            </CardTitle>
            <Users className="size-4 text-foreground/60" />
          </CardHeader>
          <CardContent>
            <div className="font-heading text-3xl font-bold">{users.length}</div>
            <div className="mt-2 flex gap-1.5">
              {tierStats.map((t) => (
                <span
                  key={t.key}
                  className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${tierConfig[t.key].bg} ${tierConfig[t.key].color}`}
                >
                  <span className={`size-1 rounded-full ${tierConfig[t.key].dot}`} />
                  {t.count}
                </span>
              ))}
            </div>
            <Link href="/users" className="absolute inset-0 z-10" />
            <ArrowUpRight className="absolute right-3 top-3 size-3.5 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </CardContent>
        </Card>

        {tierStats.map((t, i) => {
          const config = tierConfig[t.key]
          return (
            <Card key={t.key} className="animate-fade-up" style={{ animationDelay: `${(i + 1) * 80}ms` }}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                  {config.label} Accounts
                </CardTitle>
                <t.icon className={`size-4 ${config.color}`} />
              </CardHeader>
              <CardContent>
                <div className="font-heading text-3xl font-bold">{t.count}</div>
                <p className="mt-1 text-[11px] text-muted-foreground">{config.description}</p>
                <div className="mt-2 h-1 w-full rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${config.dot}`}
                    style={{ width: `${(t.count / users.length) * 100}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 animate-fade-up" style={{ animationDelay: "320ms" }}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-heading text-base font-semibold">Recent Signups</CardTitle>
            <Link href="/users" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              View all →
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">User</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Identity</TableHead>
                  <TableHead className="text-center">Activity</TableHead>
                  <TableHead className="pr-6 text-right">Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentUsers.map((user) => {
                  const userIdentities = identityMap.get(user.id) ?? []
                  const tier = userTiers.get(user.id) ?? "lite"
                  const config = tierConfig[tier]
                  const eng = engagementMap.get(user.id)
                  return (
                    <TableRow key={user.id} className="table-row-hover">
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold uppercase">
                            {(user.display_name ?? user.handle ?? "?").slice(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">
                              {user.display_name ?? user.handle ?? "—"}
                            </div>
                            {user.handle && (
                              <div className="truncate text-[11px] text-muted-foreground">@{user.handle}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${config.bg} ${config.color}`}>
                          <span className={`size-1.5 rounded-full ${config.dot}`} />
                          {config.label}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {userIdentities.map((id) => (
                            <Badge key={id.id} variant={id.type === "hive" ? "default" : "secondary"} className="text-[10px] px-1.5 py-0 gap-0.5">
                              {id.type === "evm" ? truncateAddr(id.address ?? "") : id.handle ?? id.type}
                              {id.is_sponsored && <Sparkles className="size-2 text-primary" />}
                            </Badge>
                          ))}
                          {userIdentities.length === 0 && (
                            <span className="text-[11px] text-muted-foreground">no identity</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {eng ? (
                          <span className="font-mono-data text-[11px] text-muted-foreground">
                            {eng.posts}p · {eng.votes}v
                          </span>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <span className="font-mono-data text-xs text-muted-foreground">{timeAgo(user.created_at)}</span>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="animate-fade-up" style={{ animationDelay: "400ms" }}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-heading text-base font-semibold">Sponsorship Pipeline</CardTitle>
              <Link href="/sponsorships" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Details →
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-primary/10 p-2">
                  <div className="font-heading text-xl font-bold text-primary">{completedSponsorships}</div>
                  <div className="text-[10px] text-muted-foreground">Completed</div>
                </div>
                <div className="rounded-lg bg-chart-4/10 p-2">
                  <div className="font-heading text-xl font-bold text-chart-4">{pendingSponsorships}</div>
                  <div className="text-[10px] text-muted-foreground">Pending</div>
                </div>
                <div className="rounded-lg bg-muted p-2">
                  <div className="font-heading text-xl font-bold">{totalHiveSpent}</div>
                  <div className="text-[10px] text-muted-foreground">HIVE spent</div>
                </div>
              </div>
              <div className="space-y-2">
                {sponsorships.slice(0, 4).map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded-lg border p-2.5">
                    <div className="min-w-0">
                      <div className="font-mono-data text-sm font-medium">@{s.hive_username}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {s.cost_amount ? `${s.cost_amount} HIVE` : s.cost_type} · {timeAgo(s.created_at)}
                      </div>
                    </div>
                    <Badge
                      variant={s.status === "completed" ? "default" : s.status === "failed" ? "destructive" : "secondary"}
                      className="text-[10px] shrink-0"
                    >
                      {s.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {candidates.length > 0 && (
            <Card className="animate-fade-up border-dashed border-chart-4/30" style={{ animationDelay: "480ms" }}>
              <CardHeader>
                <CardTitle className="font-heading text-base font-semibold flex items-center gap-2">
                  <Sparkles className="size-4 text-chart-4" />
                  Sponsor Candidates
                </CardTitle>
                <p className="text-[11px] text-muted-foreground">
                  Active users without a Hive account
                </p>
              </CardHeader>
              <CardContent className="space-y-2">
                {candidates.map((user) => {
                  const tier = userTiers.get(user.id) ?? "lite"
                  const config = tierConfig[tier]
                  const eng = engagementMap.get(user.id)!
                  return (
                    <div key={user.id} className="flex items-center justify-between rounded-lg border border-dashed p-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[9px] font-bold uppercase">
                          {(user.display_name ?? user.handle ?? "?").slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">{user.display_name ?? user.handle ?? "—"}</div>
                          <div className="text-[10px] text-muted-foreground">
                            {eng.posts}p · {eng.votes}v · {timeAgo(user.created_at)}
                          </div>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${config.bg} ${config.color}`}>
                        {config.label}
                      </span>
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
