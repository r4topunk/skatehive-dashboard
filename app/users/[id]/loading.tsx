import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <div className="space-y-1.5">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <Card><CardHeader><Skeleton className="h-4 w-16" /></CardHeader><CardContent className="space-y-3"><Skeleton className="h-12 w-full" /><Skeleton className="h-20 w-full" /></CardContent></Card>
          <Card><CardHeader><Skeleton className="h-4 w-24" /></CardHeader><CardContent className="space-y-2">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</CardContent></Card>
        </div>
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-4 gap-3">{Array.from({ length: 4 }).map((_, i) => <Card key={i}><CardContent className="p-3"><Skeleton className="h-8 w-12" /><Skeleton className="mt-1 h-3 w-16" /></CardContent></Card>)}</div>
          <Card><CardContent className="p-0"><div className="space-y-0">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="flex gap-4 border-b px-6 py-3"><Skeleton className="h-4 w-24" /><Skeleton className="h-4 w-16" /><Skeleton className="h-4 w-32" /><Skeleton className="ml-auto h-4 w-28" /></div>)}</div></CardContent></Card>
        </div>
      </div>
    </div>
  )
}
