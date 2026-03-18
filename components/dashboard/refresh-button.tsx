"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export function RefreshButton() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => startTransition(() => router.refresh())}
      disabled={isPending}
      className="gap-1.5"
    >
      <RefreshCw className={`size-3.5 ${isPending ? "animate-spin" : ""}`} />
      <span className="hidden sm:inline">Refresh</span>
    </Button>
  )
}
