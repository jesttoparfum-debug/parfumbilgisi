import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/**
 * Yalnızca sunucuda kullanılır. Anahtar tarayıcıya hiç gitmez.
 * Tüm istekler 1 saat cache'lenir; Supabase'e giden trafik minimumda kalır.
 */
export function db(): SupabaseClient {
  if (client) return client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL ve SUPABASE_ANON_KEY ortam değişkenleri eksik.");
  }
  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) =>
        fetch(input, { ...init, next: { revalidate: 3600 } } as RequestInit),
    },
  });
  return client;
}
