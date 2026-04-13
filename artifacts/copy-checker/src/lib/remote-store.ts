import { supabase, isSupabaseConfigured } from "./supabase";

// To use this remote store, create a Supabase table named `app_data`
// with columns: id TEXT PRIMARY KEY, payload JSONB.
const STORAGE_TABLE = "app_data";

interface AppDataRow {
  id: string;
  payload: unknown;
}

export async function loadRemoteStore<T>(key: string): Promise<T | null> {
  if (!isSupabaseConfigured || !supabase) return null;

  const { data, error } = await supabase
    .from<AppDataRow>(STORAGE_TABLE)
    .select("payload")
    .eq("id", key)
    .single();

  if (error) {
    console.error("Supabase load error:", error.message);
    return null;
  }

  return data?.payload as T | null;
}

export async function saveRemoteStore<T>(key: string, value: T) {
  if (!isSupabaseConfigured || !supabase) return;

  const { error } = await supabase
    .from<AppDataRow>(STORAGE_TABLE)
    .upsert({ id: key, payload: value }, { onConflict: ["id"] });

  if (error) {
    console.error("Supabase save error:", error.message);
  }
}
