import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/*
 * Yönetim paneli: tek kişilik, şifreli. Şifre Vercel'de YONETIM_SIFRE olarak durur.
 * Yazma işlemleri Supabase service_role anahtarıyla (SUPABASE_SERVICE_KEY) yapılır;
 * bu anahtar sadece sunucuda kalır, tarayıcıya hiç gitmez.
 */
export const COOKIE = "pb_yonetim";

function secret(): string | null {
  const s = process.env.YONETIM_SIFRE;
  return s && s.length >= 8 ? s : null;
}

const token = (s: string) => createHmac("sha256", s).update("pb-yonetim-v1").digest("hex");

function safeEq(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function checkPassword(input: string): string | null {
  const s = secret();
  if (!s || !safeEq(input, s)) return null;
  return token(s);
}

export async function isAdmin(): Promise<boolean> {
  const s = secret();
  if (!s) return false;
  const v = (await cookies()).get(COOKIE)?.value;
  return !!v && safeEq(v, token(s));
}

export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect("/yonetim/giris");
}

let svc: SupabaseClient | null = null;
/** Cache'siz, yazma yetkili istemci. Yalnızca requireAdmin() sonrasında kullan. */
export function adminDb(): SupabaseClient {
  if (svc) return svc;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL ve SUPABASE_SERVICE_KEY eksik.");
  svc = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (i, init) => fetch(i, { ...init, cache: "no-store" }) },
  });
  return svc;
}

/** "a, b; c" → ["a","b","c"] */
export const splitList = (s: FormDataEntryValue | null): string[] =>
  String(s ?? "")
    .split(/[,;\n]/)
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 40);
