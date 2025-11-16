import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Buat 'browser' client untuk digunakan di komponen Client
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}