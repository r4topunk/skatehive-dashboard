export const dynamic = "force-dynamic"

import { query } from "@/lib/supabase"
import type { User, Identity, HiveKey, Session, AuthMethod, SoftPost, SoftVote, Sponsorship } from "@/lib/types"
import { getUserTier, tierConfig } from "@/lib/tiers"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Shield, Wallet, Mail, Key, ArrowLeft, ExternalLink,
  Clock, Monitor, Smartphone, Globe, CheckCircle, XCircle,
  FileText, ThumbsUp, Sparkles, User as UserIcon,
} from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
  })
}

function formatDateShort(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return `${Math.floor(days / 30)}mo ago`
}

function truncateAddr(addr: string) {
  return addr.length <= 18 ? addr : `${addr.slice(0, 10)}...${addr.slice(-6)}`
}

function parseUserAgent(ua: string | null): { icon: typeof Monitor; label: string } {
  if (!ua) return { icon: Globe, label: "Unknown" }
  if (ua.includes("Mobile") || ua.includes("Android") || ua.includes("iPhone")) return { icon: Smartphone, label: "Mobile" }
  return { icon: Monitor, label: "Desktop" }
}

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [users, identities, hiveKeys, sessions, authMethods, softPosts, softVotes, sponsorships] = await Promise.all([
    query<User>("userbase_users", { filters: [`id=eq.${id}`] }),
    query<Identity>("userbase_identities", { filters: [`user_id=eq.${id}`], order: "created_at.asc" }),
    query<HiveKey>("userbase_hive_keys", { filters: [`user_id=eq.${id}`] }),
    query<Session>("userbase_sessions", { filters: [`user_id=eq.${id}`], order: "created_at.desc" }),
    query<AuthMethod>("userbase_auth_methods", { filters: [`user_id=eq.${id}`], order: "created_at.desc" }),
    query<SoftPost>("userbase_soft_posts", { filters: [`user_id=eq.${id}`], order: "created_at.desc" }),
    query<SoftVote>("userbase_soft_votes", { filters: [`user_id=eq.${id}`], order: "created_at.desc" }),
    query<Sponsorship>("userbase_sponsorships", { filters: [`lite_user_id=eq.${id}`] }),
  ])

  const user = users[0]
  if (!user) notFound()

  const tier = getUserTier(identities)
  const config = tierConfig[tier]
  const sponsorship = sponsorships[0] ?? null

  // Get sponsor name if sponsored
  let sponsorName: string | null = null
  if (sponsorship) {
    const sponsors = await query<User>("userbase_users", { select: "id,handle,display_name", filters: [`id=eq.${sponsorship.sponsor_user_id}`] })
    sponsorName = sponsors[0]?.display_name ?? sponsors[0]?.handle ?? null
  }

  const activeSessions = sessions.filter((s) => !s.revoked_at && new Date(s.expires_at) > new Date())
  const isSponsored = identities.some((id) => id.is_sponsored)

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div className="flex items-center gap-3">
        <Link href="/users" className="flex h-8 w-8 items-center justify-center rounded-lg border hover:bg-muted transition-colors">
          <ArrowLeft className="size-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl font-bold tracking-tight truncate">
              {user.display_name ?? user.handle ?? "Unknown User"}
            </h1>
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${config.bg} ${config.color}`}>
              {tier === "full" ? <Shield className="size-3" /> : tier === "evm" ? <Wallet className="size-3" /> : <Mail className="size-3" />}
              {config.label}
            </span>
            {isSponsored && (
              <Badge variant="outline" className="gap-1 text-[10px]">
                <Sparkles className="size-2.5 text-primary" />Sponsored
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground font-mono-data">
            {user.handle ? `@${user.handle}` : user.id}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: Profile + Identities */}
        <div className="space-y-6">
          {/* Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-sm font-semibold flex items-center gap-2">
                <UserIcon className="size-4" />Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold uppercase ${config.bg} ${config.color}`}>
                  {(user.display_name ?? user.handle ?? "?").slice(0, 2)}
                </div>
                <div>
                  <div className="font-medium">{user.display_name ?? "—"}</div>
                  <div className="text-sm text-muted-foreground font-mono-data">
                    {user.handle ? `@${user.handle}` : "no handle"}
                  </div>
                </div>
              </div>

              {user.bio && <p className="text-sm text-muted-foreground">{user.bio}</p>}

              <Separator />

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Status</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`size-2 rounded-full ${user.status === "active" ? "bg-primary status-pulse" : "bg-muted-foreground"}`} />
                    <span className="capitalize">{user.status}</span>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Onboarding</div>
                  <div className="mt-0.5">
                    <span className="font-mono-data">Step {user.onboarding_step}</span>
                    <div className="mt-1 h-1 w-full rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(user.onboarding_step * 25, 100)}%` }} />
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Joined</div>
                  <div className="font-mono-data text-sm mt-0.5">{formatDateShort(user.created_at)}</div>
                  <div className="text-[10px] text-muted-foreground">{timeAgo(user.created_at)}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Location</div>
                  <div className="mt-0.5">{user.location ?? "—"}</div>
                </div>
                {user.avatar_url && (
                  <div className="col-span-2">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Avatar</div>
                    <a href={user.avatar_url} target="_blank" rel="noopener noreferrer" className="mt-0.5 text-xs text-muted-foreground hover:text-foreground font-mono-data truncate block">
                      {user.avatar_url.slice(0, 50)}...
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Identities */}
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-sm font-semibold">
                Identities ({identities.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {identities.map((id) => (
                <div key={id.id} className="flex items-start justify-between rounded-lg border p-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={id.type === "hive" ? "default" : "secondary"} className="text-[10px] gap-1">
                        {id.type === "evm" ? <Wallet className="size-2.5" /> : <Shield className="size-2.5" />}
                        {id.type}
                      </Badge>
                      {id.is_primary && <Badge variant="outline" className="text-[9px]">primary</Badge>}
                      {id.is_sponsored && <Badge variant="outline" className="text-[9px] gap-0.5"><Sparkles className="size-2 text-primary" />sponsored</Badge>}
                    </div>
                    {id.handle && <div className="text-sm font-medium">{id.handle}</div>}
                    {id.address && (
                      <div className="font-mono-data text-xs text-muted-foreground">{id.address}</div>
                    )}
                    <div className="text-[10px] text-muted-foreground">
                      Created {formatDateShort(id.created_at)}
                      {id.verified_at && ` · Verified ${formatDateShort(id.verified_at)}`}
                    </div>
                  </div>
                </div>
              ))}
              {identities.length === 0 && (
                <p className="text-sm text-muted-foreground italic py-2">No identities linked.</p>
              )}
            </CardContent>
          </Card>

          {/* Sponsorship */}
          {sponsorship && (
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="font-heading text-sm font-semibold flex items-center gap-2">
                  <Sparkles className="size-4 text-primary" />Sponsorship
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Hive Account</div>
                    <div className="font-mono-data font-medium mt-0.5">@{sponsorship.hive_username}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Status</div>
                    <Badge variant={sponsorship.status === "completed" ? "default" : "secondary"} className="mt-0.5 text-[10px]">
                      {sponsorship.status}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Sponsor</div>
                    <div className="mt-0.5">{sponsorName ?? "unknown"}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Cost</div>
                    <div className="font-mono-data mt-0.5">{sponsorship.cost_amount ? `${sponsorship.cost_amount} HIVE` : sponsorship.cost_type}</div>
                  </div>
                </div>
                {sponsorship.hive_tx_id && (
                  <a href={`https://hivehub.dev/tx/${sponsorship.hive_tx_id}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-mono-data text-xs text-muted-foreground hover:text-foreground">
                    TX: {sponsorship.hive_tx_id.slice(0, 12)}...<ExternalLink className="size-2.5" />
                  </a>
                )}
              </CardContent>
            </Card>
          )}

          {/* Hive Keys */}
          {hiveKeys.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-sm font-semibold flex items-center gap-2">
                  <Key className="size-4 text-primary" />Hive Keys
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {hiveKeys.map((k) => (
                  <div key={k.id} className="rounded-lg border p-3 text-sm space-y-1">
                    <div className="font-mono-data font-medium">@{k.hive_username}</div>
                    <div className="flex gap-2 text-[10px] text-muted-foreground">
                      <span>Type: {k.key_type}</span>
                      <span>·</span>
                      <span>Created {formatDateShort(k.created_at)}</span>
                      {k.last_used_at && <><span>·</span><span>Used {timeAgo(k.last_used_at)}</span></>}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column: Sessions + Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick stats */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Sessions", value: sessions.length, sub: `${activeSessions.length} active` },
              { label: "Posts", value: softPosts.length, sub: `${softPosts.filter((p) => p.status === "broadcasted").length} broadcasted` },
              { label: "Votes", value: softVotes.length, sub: `${softVotes.filter((v) => v.status === "broadcasted").length} broadcasted` },
              { label: "Auth Methods", value: authMethods.length, sub: authMethods.map((a) => a.type).join(", ") || "none" },
            ].map((stat, i) => (
              <Card key={stat.label} className="animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
                <CardContent className="p-3">
                  <div className="font-heading text-2xl font-bold">{stat.value}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{stat.label}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{stat.sub}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Sessions */}
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-sm font-semibold">
                Sessions ({sessions.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Device</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="pr-6 text-right">Expires</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.slice(0, 15).map((session) => {
                    const isActive = !session.revoked_at && new Date(session.expires_at) > new Date()
                    const isExpired = new Date(session.expires_at) <= new Date()
                    const ua = parseUserAgent(session.user_agent)
                    const DeviceIcon = ua.icon
                    return (
                      <TableRow key={session.id} className="table-row-hover">
                        <TableCell className="pl-6">
                          <div className="flex items-center gap-2">
                            <DeviceIcon className="size-3.5 text-muted-foreground" />
                            <div>
                              <div className="text-sm">{ua.label}</div>
                              {session.device_id && <div className="font-mono-data text-[10px] text-muted-foreground">{session.device_id.slice(0, 12)}</div>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            {session.revoked_at ? (
                              <><XCircle className="size-3 text-destructive" /><span className="text-xs text-destructive">Revoked</span></>
                            ) : isExpired ? (
                              <><Clock className="size-3 text-muted-foreground" /><span className="text-xs text-muted-foreground">Expired</span></>
                            ) : (
                              <><CheckCircle className="size-3 text-primary" /><span className="text-xs text-primary">Active</span></>
                            )}
                          </div>
                        </TableCell>
                        <TableCell><span className="font-mono-data text-xs text-muted-foreground">{formatDate(session.created_at)}</span></TableCell>
                        <TableCell className="pr-6 text-right"><span className="font-mono-data text-xs text-muted-foreground">{formatDate(session.expires_at)}</span></TableCell>
                      </TableRow>
                    )
                  })}
                  {sessions.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="py-6 text-center text-sm text-muted-foreground">No sessions.</TableCell></TableRow>
                  )}
                  {sessions.length > 15 && (
                    <TableRow><TableCell colSpan={4} className="py-2 text-center text-[11px] text-muted-foreground">+{sessions.length - 15} more sessions</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Soft Posts */}
          {softPosts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-sm font-semibold flex items-center gap-2">
                  <FileText className="size-4" />Posts ({softPosts.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-6">Title</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="pr-6 text-right">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {softPosts.map((post) => (
                      <TableRow key={post.id} className="table-row-hover">
                        <TableCell className="pl-6">
                          <a href={`https://peakd.com/@${post.author}/${post.permlink}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm hover:text-foreground transition-colors">
                            {post.title || post.permlink.slice(0, 30)}<ExternalLink className="size-2.5 text-muted-foreground" />
                          </a>
                        </TableCell>
                        <TableCell><span className="font-mono-data text-xs">@{post.author}</span></TableCell>
                        <TableCell><Badge variant="secondary" className="text-[10px]">{post.type}</Badge></TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            {post.status === "broadcasted" ? <CheckCircle className="size-3 text-primary" /> : <Clock className="size-3 text-chart-4" />}
                            <span className="text-xs">{post.status}</span>
                          </div>
                        </TableCell>
                        <TableCell className="pr-6 text-right"><span className="font-mono-data text-xs text-muted-foreground">{formatDateShort(post.created_at)}</span></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Soft Votes */}
          {softVotes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-sm font-semibold flex items-center gap-2">
                  <ThumbsUp className="size-4" />Votes ({softVotes.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-6">Author</TableHead>
                      <TableHead>Permlink</TableHead>
                      <TableHead>Weight</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="pr-6 text-right">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {softVotes.slice(0, 20).map((vote) => (
                      <TableRow key={vote.id} className="table-row-hover">
                        <TableCell className="pl-6"><span className="text-sm font-medium">@{vote.author}</span></TableCell>
                        <TableCell>
                          <a href={`https://peakd.com/@${vote.author}/${vote.permlink}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-mono-data text-xs text-muted-foreground hover:text-foreground">
                            {vote.permlink.length > 28 ? `${vote.permlink.slice(0, 26)}...` : vote.permlink}<ExternalLink className="size-2" />
                          </a>
                        </TableCell>
                        <TableCell>
                          <span className={`font-mono-data text-xs font-medium ${vote.weight > 0 ? "text-primary" : "text-destructive"}`}>
                            {vote.weight > 0 ? "+" : ""}{(vote.weight / 100).toFixed(0)}%
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            {vote.status === "broadcasted" ? <CheckCircle className="size-3 text-primary" /> : <Clock className="size-3 text-chart-4" />}
                            <span className="text-xs">{vote.status}</span>
                          </div>
                        </TableCell>
                        <TableCell className="pr-6 text-right"><span className="font-mono-data text-xs text-muted-foreground">{formatDateShort(vote.created_at)}</span></TableCell>
                      </TableRow>
                    ))}
                    {softVotes.length > 20 && (
                      <TableRow><TableCell colSpan={5} className="py-2 text-center text-[11px] text-muted-foreground">+{softVotes.length - 20} more votes</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Auth Methods */}
          {authMethods.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-sm font-semibold">Auth Methods ({authMethods.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {authMethods.map((auth) => (
                  <div key={auth.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px]">{auth.type}</Badge>
                      {auth.identifier && <span className="font-mono-data text-xs text-muted-foreground">{auth.identifier}</span>}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {auth.verified_at ? `Verified ${formatDateShort(auth.verified_at)}` : "Unverified"}
                      {auth.last_used_at && ` · Used ${timeAgo(auth.last_used_at)}`}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
