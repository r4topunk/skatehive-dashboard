export type User = {
  id: string
  handle: string | null
  display_name: string | null
  avatar_url: string | null
  cover_url: string | null
  bio: string | null
  location: string | null
  status: string
  onboarding_step: number
  created_at: string
  updated_at: string
}

export type Identity = {
  id: string
  user_id: string
  type: string
  handle: string | null
  address: string | null
  is_primary: boolean
  verified_at: string | null
  metadata: Record<string, unknown>
  created_at: string
  is_sponsored: boolean
  sponsor_user_id: string | null
}

export type Session = {
  id: string
  user_id: string
  refresh_token_hash: string
  device_id: string | null
  user_agent: string | null
  created_at: string
  expires_at: string
  revoked_at: string | null
}

export type HiveKey = {
  id: string
  user_id: string
  hive_username: string
  encrypted_posting_key: string
  encryption_iv: string
  encryption_auth_tag: string
  key_type: string
  created_at: string
  updated_at: string
  last_used_at: string | null
}

export type Sponsorship = {
  id: string
  lite_user_id: string
  sponsor_user_id: string
  hive_username: string
  cost_type: string
  cost_amount: number | null
  hive_tx_id: string | null
  status: string
  error_message: string | null
  created_at: string
  completed_at: string | null
}

export type SoftPost = {
  id: string
  user_id: string
  author: string
  permlink: string
  title: string | null
  type: string
  status: string
  tx_id: string | null
  error: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
  broadcasted_at: string | null
  safe_user: string | null
}

export type SoftVote = {
  id: string
  user_id: string
  author: string
  permlink: string
  weight: number
  status: string
  error: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
  broadcasted_at: string | null
}

export type AuthMethod = {
  id: string
  user_id: string
  type: string
  identifier: string | null
  secret_hash: string | null
  verified_at: string | null
  created_at: string
  last_used_at: string | null
}

export type UserWithIdentities = User & {
  identities: Identity[]
}
