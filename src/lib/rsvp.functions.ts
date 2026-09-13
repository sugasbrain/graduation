import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

const rsvpSchema = z.object({
  guestName: z.string().trim().min(2).max(100),
  phone: z.string().trim().max(30).optional(),
  message: z.string().trim().max(500).optional(),
  partySize: z.number().int().min(1).max(10),
});

function createPublicClient() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("O serviço de confirmações está indisponível.");

  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

export const submitRsvp = createServerFn({ method: "POST" })
  .validator((input) => rsvpSchema.parse(input))
  .handler(async ({ data }) => {
    const supabase = createPublicClient();
    const { error } = await supabase.from("rsvps").insert({
      guest_name: data.guestName,
      phone: data.phone || null,
      message: data.message || null,
      party_size: data.partySize,
    });
    if (error) throw new Error("Não foi possível registrar sua presença agora.");
    return { ok: true as const };
  });

export const getAdminRsvps = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: role } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!role) throw new Error("Acesso restrito à administração.");

    const { data, error } = await context.supabase
      .from("rsvps")
      .select("id, guest_name, phone, message, party_size, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error("Não foi possível carregar as confirmações.");

    return {
      guests: data,
      totalPeople: data.reduce((total, item) => total + item.party_size, 0),
    };
  });