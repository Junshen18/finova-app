// Minimal declaration to satisfy type checking without depending on @types/node in lints
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const process: any;
const getBase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
  if (!supabaseUrl || !serviceKey) {
    throw new Error("Missing Supabase URL or service role key for admin client");
  }
  return { supabaseUrl, serviceKey };
};

export async function adminListUsers(page = 1, perPage = 1000) {
  const { supabaseUrl, serviceKey } = getBase();
  const url = `${supabaseUrl}/auth/v1/admin/users?page=${page}&per_page=${perPage}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey },
    // Avoid Next caching
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to list users: ${res.status}`);
  const data = await res.json();
  return data as { users: any[] };
}

export async function adminCreateUser(payload: { email: string; password: string; email_confirm?: boolean; user_metadata?: any }) {
  const { supabaseUrl, serviceKey } = getBase();
  const url = `${supabaseUrl}/auth/v1/admin/users`;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Failed to create user: ${res.status}`);
  return (await res.json()) as { user: any };
}

export async function adminVerifyUser(userId: string) {
  const { supabaseUrl, serviceKey } = getBase();
  const url = `${supabaseUrl}/auth/v1/admin/users/${userId}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey, "Content-Type": "application/json" },
    body: JSON.stringify({ email_confirm: true }),
  });
  if (!res.ok) throw new Error(`Failed to verify user: ${res.status}`);
  return (await res.json()) as { user: any };
}

