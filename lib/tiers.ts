import type { Identity } from "./types"

export type AccountTier = "full" | "evm" | "lite"

export function getUserTier(identities: Identity[]): AccountTier {
  const hasHive = identities.some((id) => id.type === "hive")
  if (hasHive) return "full"
  const hasEvm = identities.some((id) => id.type === "evm")
  if (hasEvm) return "evm"
  return "lite"
}

export const tierConfig: Record<
  AccountTier,
  { label: string; description: string; color: string; bg: string; dot: string }
> = {
  full: {
    label: "Full",
    description: "Own Hive account",
    color: "text-primary",
    bg: "bg-primary/10",
    dot: "bg-primary",
  },
  evm: {
    label: "EVM",
    description: "Wallet connected, no Hive account",
    color: "text-chart-2",
    bg: "bg-chart-2/10",
    dot: "bg-chart-2",
  },
  lite: {
    label: "Lite",
    description: "Email only, posts via @skateuser",
    color: "text-chart-4",
    bg: "bg-chart-4/10",
    dot: "bg-chart-4",
  },
}
