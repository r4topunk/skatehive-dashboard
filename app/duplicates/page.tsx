export const dynamic = "force-dynamic"

import { query } from "@/lib/supabase"
import type { User, Identity, AuthMethod } from "@/lib/types"
import { getUserTier } from "@/lib/tiers"
import { DuplicatesView } from "@/components/dashboard/duplicates-view"

export type DuplicateGroup = {
  key: string
  type: "evm_address" | "hive_handle" | "email"
  value: string
  users: {
    user: User
    tier: string
    identities: Identity[]
    email: string | null
    createdAt: string
  }[]
}

export default async function DuplicatesPage() {
  const [users, identities, authMethods] = await Promise.all([
    query<User>("userbase_users", { order: "created_at.desc" }),
    query<Identity>("userbase_identities"),
    query<AuthMethod>("userbase_auth_methods", {
      select: "id,user_id,type,identifier",
    }),
  ])

  const userMap = new Map<string, User>()
  for (const u of users) userMap.set(u.id, u)

  const identityMap = new Map<string, Identity[]>()
  for (const id of identities) {
    const arr = identityMap.get(id.user_id) ?? []
    arr.push(id)
    identityMap.set(id.user_id, arr)
  }

  const emailMap = new Map<string, string>()
  for (const a of authMethods) {
    if (a.type === "email_magic" && a.identifier) {
      emailMap.set(a.user_id, a.identifier)
    }
  }

  const groups: DuplicateGroup[] = []

  // 1. Same EVM address across different users
  const evmIndex = new Map<string, string[]>()
  for (const id of identities) {
    if (id.type === "evm" && id.address) {
      const addr = id.address.toLowerCase()
      const arr = evmIndex.get(addr) ?? []
      if (!arr.includes(id.user_id)) arr.push(id.user_id)
      evmIndex.set(addr, arr)
    }
  }
  for (const [addr, userIds] of evmIndex) {
    if (userIds.length > 1) {
      groups.push({
        key: `evm:${addr}`,
        type: "evm_address",
        value: addr,
        users: userIds.map((uid) => {
          const user = userMap.get(uid)!
          const ids = identityMap.get(uid) ?? []
          return {
            user,
            tier: getUserTier(ids),
            identities: ids,
            email: emailMap.get(uid) ?? null,
            createdAt: user.created_at,
          }
        }),
      })
    }
  }

  // 2. Same Hive handle across different users
  const hiveIndex = new Map<string, string[]>()
  for (const id of identities) {
    if (id.type === "hive" && id.handle) {
      const handle = id.handle.toLowerCase()
      const arr = hiveIndex.get(handle) ?? []
      if (!arr.includes(id.user_id)) arr.push(id.user_id)
      hiveIndex.set(handle, arr)
    }
  }
  for (const [handle, userIds] of hiveIndex) {
    if (userIds.length > 1) {
      groups.push({
        key: `hive:${handle}`,
        type: "hive_handle",
        value: handle,
        users: userIds.map((uid) => {
          const user = userMap.get(uid)!
          const ids = identityMap.get(uid) ?? []
          return {
            user,
            tier: getUserTier(ids),
            identities: ids,
            email: emailMap.get(uid) ?? null,
            createdAt: user.created_at,
          }
        }),
      })
    }
  }

  // 3. Same email across different users
  const emailIndex = new Map<string, string[]>()
  for (const a of authMethods) {
    if (a.type === "email_magic" && a.identifier) {
      const email = a.identifier.toLowerCase()
      const arr = emailIndex.get(email) ?? []
      if (!arr.includes(a.user_id)) arr.push(a.user_id)
      emailIndex.set(email, arr)
    }
  }
  for (const [email, userIds] of emailIndex) {
    if (userIds.length > 1) {
      groups.push({
        key: `email:${email}`,
        type: "email",
        value: email,
        users: userIds.map((uid) => {
          const user = userMap.get(uid)!
          const ids = identityMap.get(uid) ?? []
          return {
            user,
            tier: getUserTier(ids),
            identities: ids,
            email: emailMap.get(uid) ?? null,
            createdAt: user.created_at,
          }
        }),
      })
    }
  }

  // Sort: most duplicates first
  groups.sort((a, b) => b.users.length - a.users.length)

  const totalAffectedUsers = new Set(groups.flatMap((g) => g.users.map((u) => u.user.id))).size

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Duplicate Accounts
        </h1>
        <p className="text-sm text-muted-foreground">
          {groups.length} duplicate groups · {totalAffectedUsers} affected users
        </p>
      </div>
      <DuplicatesView groups={groups} />
    </div>
  )
}
