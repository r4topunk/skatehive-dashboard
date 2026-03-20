"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import type { DuplicateGroup } from "@/app/duplicates/page"
import { tierConfig, type AccountTier } from "@/lib/tiers"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Wallet, AtSign, Mail, Search, AlertTriangle, ChevronRight, Copy, Check, User, Ghost } from "lucide-react"

const typeConfig = {
  evm_address: { label: "EVM Address", icon: Wallet, color: "text-chart-2" },
  hive_handle: { label: "Hive Handle", icon: AtSign, color: "text-primary" },
  email: { label: "Email", icon: Mail, color: "text-chart-4" },
  display_name: { label: "Display Name", icon: User, color: "text-orange-400" },
  orphan: { label: "Orphan (no identity)", icon: Ghost, color: "text-red-400" },
} as const

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

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }}
      className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
      title="Copy"
    >
      {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
    </button>
  )
}

type FilterType = "all" | "evm_address" | "hive_handle" | "email" | "display_name" | "orphan"

export function DuplicatesView({ groups }: { groups: DuplicateGroup[] }) {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<FilterType>("all")

  const counts = useMemo(() => {
    const c = { evm_address: 0, hive_handle: 0, email: 0, display_name: 0, orphan: 0 }
    for (const g of groups) c[g.type]++
    return c
  }, [groups])

  const filtered = useMemo(() => {
    let result = groups
    if (filter !== "all") result = result.filter((g) => g.type === filter)
    if (search) {
      const q = search.toLowerCase()
      result = result.filter((g) =>
        g.value.toLowerCase().includes(q) ||
        g.users.some(
          (u) =>
            u.user.handle?.toLowerCase().includes(q) ||
            u.user.display_name?.toLowerCase().includes(q) ||
            u.user.id.toLowerCase().includes(q) ||
            u.email?.toLowerCase().includes(q)
        )
      )
    }
    return result
  }, [groups, filter, search])

  if (groups.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-primary/10 p-3 mb-3">
            <Check className="size-6 text-primary" />
          </div>
          <p className="font-medium">No duplicates found</p>
          <p className="text-sm text-muted-foreground mt-1">
            All accounts have unique identities
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        {(Object.entries(counts) as [keyof typeof counts, number][]).map(([type, count]) => {
          const cfg = typeConfig[type]
          const Icon = cfg.icon
          return (
            <Card
              key={type}
              className={`cursor-pointer transition-colors ${filter === type ? "ring-2 ring-primary" : ""}`}
              onClick={() => setFilter(filter === type ? "all" : type)}
            >
              <CardContent className="flex items-center gap-3 py-3">
                <Icon className={`size-4 ${cfg.color}`} />
                <div>
                  <p className="text-2xl font-bold tabular-nums">{count}</p>
                  <p className="text-xs text-muted-foreground">{cfg.label}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by address, handle, email, or user ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Results */}
      <div className="space-y-4">
        {filtered.map((group) => {
          const cfg = typeConfig[group.type]
          const Icon = cfg.icon
          return (
            <Card key={group.key}>
              <CardContent className="p-0">
                {/* Group header */}
                <div className="flex items-center gap-3 border-b px-4 py-3">
                  <AlertTriangle className="size-4 text-yellow-500" />
                  <Icon className={`size-4 ${cfg.color}`} />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-muted-foreground mr-2">
                      {cfg.label}:
                    </span>
                    <code className="text-sm font-mono">
                      {group.type === "evm_address"
                        ? truncateAddr(group.value)
                        : group.value}
                    </code>
                    {group.type !== "orphan" && <CopyButton text={group.value} />}
                  </div>
                  <Badge variant="outline" className="tabular-nums">
                    {group.users.length} accounts
                  </Badge>
                </div>

                {/* Users in this group */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Identities</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-8" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.users.map((entry) => {
                      const tc = tierConfig[entry.tier as AccountTier]
                      return (
                        <TableRow key={entry.user.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">
                                {entry.user.display_name || entry.user.handle || "—"}
                              </p>
                              <p className="text-xs text-muted-foreground font-mono">
                                {entry.user.id.slice(0, 8)}...
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`${tc.bg} ${tc.color} border-transparent text-[10px] uppercase tracking-wider`}
                            >
                              {tc.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {entry.identities.length === 0 && (
                                <span className="text-xs text-red-400 italic">no identity</span>
                              )}
                              {entry.identities.map((id) => (
                                <Badge
                                  key={id.id}
                                  variant="secondary"
                                  className="text-[10px] font-mono"
                                >
                                  {id.type}
                                  {id.handle && `: ${id.handle}`}
                                  {id.address && `: ${truncateAddr(id.address)}`}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {entry.email ?? "—"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground tabular-nums">
                            {timeAgo(entry.createdAt)} ago
                          </TableCell>
                          <TableCell>
                            <Link
                              href={`/users/${entry.user.id}`}
                              className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <ChevronRight className="size-4" />
                            </Link>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )
        })}

        {filtered.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No matches for current filter
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
