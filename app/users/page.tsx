export const dynamic = "force-dynamic"

import { query } from "@/lib/supabase"
import type { User, Identity, HiveKey, SoftPost, SoftVote, Sponsorship, Session, AuthMethod } from "@/lib/types"
import { getUserTier, type AccountTier } from "@/lib/tiers"
import { UsersTable, type UserRow } from "@/components/dashboard/users-table"

export default async function UsersPage() {
  const [users, identities, hiveKeys, softPosts, softVotes, sponsorships, sessions, authMethods] = await Promise.all([
    query<User>("userbase_users", { order: "created_at.desc" }),
    query<Identity>("userbase_identities"),
    query<HiveKey>("userbase_hive_keys", { select: "id,user_id,hive_username,key_type,last_used_at" }),
    query<Pick<SoftPost, "id" | "user_id">>("userbase_soft_posts", { select: "id,user_id" }),
    query<Pick<SoftVote, "id" | "user_id">>("userbase_soft_votes", { select: "id,user_id" }),
    query<Sponsorship>("userbase_sponsorships"),
    query<Pick<Session, "id" | "user_id" | "created_at">>("userbase_sessions", { select: "id,user_id,created_at", order: "created_at.desc" }),
    query<Pick<AuthMethod, "id" | "user_id" | "type" | "identifier">>("userbase_auth_methods", { select: "id,user_id,type,identifier" }),
  ])

  // Build maps
  const identityMap = new Map<string, Identity[]>()
  for (const id of identities) { const arr = identityMap.get(id.user_id) ?? []; arr.push(id); identityMap.set(id.user_id, arr) }

  const hiveKeyMap = new Map<string, HiveKey>()
  for (const k of hiveKeys) hiveKeyMap.set(k.user_id, k)

  const engagementMap = new Map<string, { posts: number; votes: number }>()
  for (const p of softPosts) { const e = engagementMap.get(p.user_id) ?? { posts: 0, votes: 0 }; e.posts++; engagementMap.set(p.user_id, e) }
  for (const v of softVotes) { const e = engagementMap.get(v.user_id) ?? { posts: 0, votes: 0 }; e.votes++; engagementMap.set(v.user_id, e) }

  const sponsorshipMap = new Map<string, Sponsorship>()
  for (const s of sponsorships) sponsorshipMap.set(s.lite_user_id, s)

  const userMap = new Map<string, User>()
  for (const u of users) userMap.set(u.id, u)

  // Last active per user (most recent session)
  const lastActiveMap = new Map<string, string>()
  for (const s of sessions) {
    if (!lastActiveMap.has(s.user_id)) lastActiveMap.set(s.user_id, s.created_at)
  }

  // Auth methods per user + email extraction
  const authMethodMap = new Map<string, string[]>()
  const emailMap = new Map<string, string>()
  for (const a of authMethods) {
    const arr = authMethodMap.get(a.user_id) ?? []
    arr.push(a.type)
    authMethodMap.set(a.user_id, arr)
    if (a.type === "email_magic" && a.identifier) {
      emailMap.set(a.user_id, a.identifier)
    }
  }

  // Build rows
  const tierCounts: Record<AccountTier, number> = { full: 0, evm: 0, lite: 0 }
  const rows: UserRow[] = users.map((user) => {
    const ids = identityMap.get(user.id) ?? []
    const tier = getUserTier(ids)
    tierCounts[tier]++
    const sponsorship = sponsorshipMap.get(user.id) ?? null
    const sponsor = sponsorship ? userMap.get(sponsorship.sponsor_user_id) : null

    return {
      user,
      tier,
      identities: ids,
      hiveKey: hiveKeyMap.get(user.id) ?? null,
      engagement: engagementMap.get(user.id) ?? null,
      sponsorship,
      sponsorName: sponsor?.display_name ?? sponsor?.handle ?? null,
      lastActive: lastActiveMap.get(user.id) ?? null,
      authMethods: authMethodMap.get(user.id) ?? [],
      email: emailMap.get(user.id) ?? null,
    }
  })

  const sponsoredCount = identities.filter((id) => id.is_sponsored).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">Users</h1>
        <p className="text-sm text-muted-foreground">
          {users.length} accounts · {identities.length} identities · {hiveKeys.length} posting keys · {sessions.length} sessions
        </p>
      </div>
      <UsersTable rows={rows} tierCounts={tierCounts} sponsoredCount={sponsoredCount} />
    </div>
  )
}
