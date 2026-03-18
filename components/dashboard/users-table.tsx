"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import type { User, Identity, HiveKey, Sponsorship } from "@/lib/types"
import type { AccountTier } from "@/lib/tiers"
import { tierConfig } from "@/lib/tiers"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { SortableHead, type SortDirection, useSortToggle } from "@/components/ui/sortable-head"
import { Shield, Wallet, Mail, Key, Sparkles, Search, ChevronRight } from "lucide-react"

const tierIcons: Record<AccountTier, typeof Shield> = { full: Shield, evm: Wallet, lite: Mail }

function truncateAddr(addr: string) {
  return addr.length <= 14 ? addr : `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d`
  return `${Math.floor(days / 30)}mo`
}

type Engagement = { posts: number; votes: number }

export type UserRow = {
  user: User
  tier: AccountTier
  identities: Identity[]
  hiveKey: HiveKey | null
  engagement: Engagement | null
  sponsorship: Sponsorship | null
  sponsorName: string | null
  lastActive: string | null
  authMethods: string[]
  email: string | null
}

type Props = {
  rows: UserRow[]
  tierCounts: Record<AccountTier, number>
  sponsoredCount: number
}

const tierOrder: AccountTier[] = ["full", "evm", "lite"]

export function UsersTable({ rows, tierCounts, sponsoredCount }: Props) {
  const [search, setSearch] = useState("")
  const [tierFilter, setTierFilter] = useState<AccountTier | "all" | "candidates">("all")
  const [sortBy, setSortBy] = useState<"created" | "activity" | "engagement">("created")

  type ColSortKey = "user" | "tier" | "email" | "engagement" | "lastActive" | "joined"
  const [colSortKey, setColSortKey] = useState<ColSortKey | null>(null)
  const [colSortDir, setColSortDir] = useState<SortDirection>(null)
  const toggleCol = useSortToggle(colSortKey, colSortDir, setColSortKey, setColSortDir)

  const filtered = useMemo(() => {
    let result = rows

    // Search
    if (search) {
      const q = search.toLowerCase()
      result = result.filter((r) => {
        const handle = r.user.handle?.toLowerCase() ?? ""
        const name = r.user.display_name?.toLowerCase() ?? ""
        const email = r.email?.toLowerCase() ?? ""
        const addrs = r.identities.map((id) => (id.address ?? id.handle ?? "").toLowerCase())
        return handle.includes(q) || name.includes(q) || email.includes(q) || addrs.some((a) => a.includes(q))
      })
    }

    // Tier filter
    if (tierFilter === "candidates") {
      result = result.filter((r) => r.tier !== "full" && r.engagement && (r.engagement.posts > 0 || r.engagement.votes > 0))
    } else if (tierFilter !== "all") {
      result = result.filter((r) => r.tier === tierFilter)
    }

    // Sort — column header takes priority over toolbar sort
    if (colSortKey && colSortDir) {
      result = [...result].sort((a, b) => {
        let cmp = 0
        switch (colSortKey) {
          case "user": cmp = (a.user.display_name ?? a.user.handle ?? "").localeCompare(b.user.display_name ?? b.user.handle ?? ""); break
          case "tier": cmp = tierOrder.indexOf(a.tier) - tierOrder.indexOf(b.tier); break
          case "email": cmp = (a.email ?? "").localeCompare(b.email ?? ""); break
          case "engagement": {
            const aEng = (a.engagement?.posts ?? 0) + (a.engagement?.votes ?? 0)
            const bEng = (b.engagement?.posts ?? 0) + (b.engagement?.votes ?? 0)
            cmp = aEng - bEng; break
          }
          case "lastActive": {
            const aTime = a.lastActive ? new Date(a.lastActive).getTime() : 0
            const bTime = b.lastActive ? new Date(b.lastActive).getTime() : 0
            cmp = aTime - bTime; break
          }
          case "joined": cmp = new Date(a.user.created_at).getTime() - new Date(b.user.created_at).getTime(); break
        }
        return colSortDir === "asc" ? cmp : -cmp
      })
    } else if (sortBy === "activity") {
      result = [...result].sort((a, b) => {
        const aTime = a.lastActive ? new Date(a.lastActive).getTime() : 0
        const bTime = b.lastActive ? new Date(b.lastActive).getTime() : 0
        return bTime - aTime
      })
    } else if (sortBy === "engagement") {
      result = [...result].sort((a, b) => {
        const aEng = (a.engagement?.posts ?? 0) + (a.engagement?.votes ?? 0)
        const bEng = (b.engagement?.posts ?? 0) + (b.engagement?.votes ?? 0)
        return bEng - aEng
      })
    }

    return result
  }, [rows, search, tierFilter, sortBy, colSortKey, colSortDir])

  return (
    <div className="space-y-4">
      {/* Search + Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search handle, name, address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {/* Tier filters */}
          <button
            onClick={() => setTierFilter("all")}
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
              tierFilter === "all" ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            All ({rows.length})
          </button>
          {tierOrder.map((tier) => {
            const config = tierConfig[tier]
            const Icon = tierIcons[tier]
            return (
              <button
                key={tier}
                onClick={() => setTierFilter(tierFilter === tier ? "all" : tier)}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  tierFilter === tier ? `${config.bg} ${config.color}` : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="size-3" />
                {config.label} ({tierCounts[tier]})
              </button>
            )
          })}
          <button
            onClick={() => setTierFilter(tierFilter === "candidates" ? "all" : "candidates")}
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
              tierFilter === "candidates" ? "bg-chart-4/20 text-chart-4" : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sparkles className="size-3" />
            Candidates
          </button>

          <span className="self-center text-muted-foreground/30">|</span>

          {/* Sort */}
          {(["created", "activity", "engagement"] as const).map((s) => (
            <button
              key={s}
              onClick={() => { setSortBy(s); setColSortKey(null); setColSortDir(null) }}
              className={`rounded-full px-2 py-1 text-[10px] font-medium transition-colors ${
                sortBy === s && !colSortKey ? "bg-foreground/10 text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {s === "created" ? "Newest" : s === "activity" ? "Last Active" : "Most Active"}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <div className="text-[11px] text-muted-foreground">
        {filtered.length} user{filtered.length !== 1 ? "s" : ""}
        {search && ` matching "${search}"`}
      </div>

      {/* Tier bar */}
      <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-muted">
        {tierOrder.map((tier) => (
          <div key={tier} className={`h-full ${tierConfig[tier].dot} transition-all`} style={{ width: `${(tierCounts[tier] / rows.length) * 100}%` }} />
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHead className="pl-6 w-[220px]" active={colSortKey === "user"} direction={colSortDir} onClick={() => { toggleCol("user"); setSortBy("created") }}>User</SortableHead>
                <SortableHead className="w-[65px]" active={colSortKey === "tier"} direction={colSortDir} onClick={() => { toggleCol("tier"); setSortBy("created") }}>Tier</SortableHead>
                <SortableHead active={colSortKey === "email"} direction={colSortDir} onClick={() => { toggleCol("email"); setSortBy("created") }}>Email</SortableHead>
                <TableHead>Identities</TableHead>
                <SortableHead className="text-center w-[80px]" active={colSortKey === "engagement"} direction={colSortDir} onClick={() => { toggleCol("engagement"); setSortBy("created") }}>Engagement</SortableHead>
                <SortableHead className="w-[80px]" active={colSortKey === "lastActive"} direction={colSortDir} onClick={() => { toggleCol("lastActive"); setSortBy("created") }}>Last Active</SortableHead>
                <TableHead className="w-[90px]">Sponsored</TableHead>
                <SortableHead className="w-[60px]" active={colSortKey === "joined"} direction={colSortDir} onClick={() => { toggleCol("joined"); setSortBy("created") }}>Joined</SortableHead>
                <TableHead className="pr-6 w-[30px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((row) => {
                const config = tierConfig[row.tier]
                const TierIcon = tierIcons[row.tier]
                const totalEng = (row.engagement?.posts ?? 0) + (row.engagement?.votes ?? 0)

                return (
                  <TableRow key={row.user.id} className="table-row-hover group">
                    <TableCell className="pl-6">
                      <Link href={`/users/${row.user.id}`} className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold uppercase ${config.bg} ${config.color}`}>
                          {(row.user.display_name ?? row.user.handle ?? "?").slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">{row.user.display_name ?? "—"}</div>
                          <div className="truncate text-[11px] text-muted-foreground font-mono-data">
                            {row.user.handle ? `@${row.user.handle}` : row.user.id.slice(0, 8)}
                          </div>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${config.bg} ${config.color}`}>
                        <TierIcon className="size-2.5" />
                        {config.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      {row.email ? (
                        <span className="font-mono-data text-[11px] text-muted-foreground">{row.email}</span>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {row.identities.map((id) => (
                          <Badge key={id.id} variant={id.type === "hive" ? "default" : "secondary"} className="text-[10px] px-1.5 py-0 gap-0.5">
                            {id.type === "evm" ? <span className="font-mono-data">{truncateAddr(id.address ?? "")}</span> : <>{id.handle ?? id.type}</>}
                            {id.is_sponsored && <Sparkles className="size-2 text-primary" />}
                          </Badge>
                        ))}
                        {row.hiveKey && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-0.5">
                            <Key className="size-2.5 text-primary" />@{row.hiveKey.hive_username}
                          </Badge>
                        )}
                        {row.identities.length === 0 && !row.hiveKey && (
                          <span className="text-[11px] text-muted-foreground italic">no identity</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {totalEng > 0 ? (
                        <div>
                          <div className="flex items-center justify-center gap-0.5 mb-0.5">
                            <div className="h-1 rounded-full bg-primary/60" style={{ width: `${Math.min(totalEng * 2, 40)}px` }} />
                          </div>
                          <span className="font-mono-data text-[10px] text-muted-foreground">
                            {row.engagement!.posts}p · {row.engagement!.votes}v
                          </span>
                        </div>
                      ) : <span className="text-[11px] text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      {row.lastActive ? (
                        <span className="font-mono-data text-[11px] text-muted-foreground">{timeAgo(row.lastActive)} ago</span>
                      ) : <span className="text-[11px] text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      {row.sponsorship ? (
                        <div>
                          <Badge variant={row.sponsorship.status === "completed" ? "default" : "secondary"} className="text-[10px]">
                            {row.sponsorship.status}
                          </Badge>
                          {row.sponsorName && <div className="mt-0.5 text-[10px] text-muted-foreground">by {row.sponsorName}</div>}
                        </div>
                      ) : row.tier !== "full" && totalEng > 0 ? (
                        <span className="text-[10px] text-chart-4/70 italic">candidate</span>
                      ) : <span className="text-[11px] text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono-data text-[11px] text-muted-foreground">{timeAgo(row.user.created_at)}</span>
                    </TableCell>
                    <TableCell className="pr-6">
                      <Link href={`/users/${row.user.id}`}>
                        <ChevronRight className="size-3.5 text-muted-foreground/40 group-hover:text-foreground transition-colors" />
                      </Link>
                    </TableCell>
                  </TableRow>
                )
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="py-12 text-center text-sm text-muted-foreground">
                    No users found{search ? ` matching "${search}"` : ""}.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
