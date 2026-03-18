const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY!

type QueryOptions = {
  select?: string
  order?: string
  limit?: number
  filters?: string[]
  count?: boolean
}

export async function query<T>(table: string, opts: QueryOptions = {}): Promise<T[]> {
  const params = new URLSearchParams()
  params.set("select", opts.select ?? "*")
  if (opts.order) params.set("order", opts.order)
  if (opts.limit) params.set("limit", String(opts.limit))

  let url = `${SUPABASE_URL}/rest/v1/${table}?${params}`
  if (opts.filters) {
    for (const f of opts.filters) {
      url += `&${f}`
    }
  }

  const headers: Record<string, string> = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
  }
  if (opts.count) {
    headers["Prefer"] = "count=exact"
    headers["Range"] = "0-0"
  }

  const res = await fetch(url, {
    headers,
    cache: "no-store",
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Supabase ${table}: ${res.status} ${text}`)
  }

  return res.json()
}
