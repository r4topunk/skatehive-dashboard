import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-4 w-56" />
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-24 rounded-full" />
        ))}
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="space-y-0">
            <div className="flex gap-4 border-b px-6 py-3">
              {["w-[280px]", "w-40", "w-28", "w-16", "w-10", "w-32"].map((w, i) => (
                <Skeleton key={i} className={`h-3 ${w}`} />
              ))}
            </div>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 border-b px-6 py-3">
                <div className="flex items-center gap-3 w-[280px]">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-3.5 w-28" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-3 w-14" />
                <Skeleton className="h-3 w-8" />
                <Skeleton className="ml-auto h-3 w-28" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
