import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import { createHash, timingSafeEqual } from "node:crypto";
import { z } from "zod";

import type { Database } from "@/integrations/supabase/types";

const rsvpSchema = z.object({
  guestName: z.string().trim().min(2).max(100),
  phone: z.string().trim().max(30).optional(),
  companionCount: z.number().int().min(0).max(10),
  companionNames: z.array(z.string().trim().min(2).max(100)).max(10),
}).superRefine((data, context) => {
  if (data.companionNames.length !== data.companionCount) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Informe o nome de todos os acompanhantes." });
  }
});

const adminPasswordSchema = z.object({ password: z.string().min(1).max(200) });

function passwordMatches(input: string, expected: string) {
  const received = createHash("sha256").update(input, "utf8").digest();
  const stored = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(received, stored);
}

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
      companion_names: data.companionNames,
      party_size: data.companionCount + 1,
    });
    if (error) throw new Error("Não foi possível registrar sua presença agora.");
    return { ok: true as const };
  });

export const unlockAdminRsvps = createServerFn({ method: "POST" })
  .validator((input) => adminPasswordSchema.parse(input))
  .handler(async ({ data }) => {
    const expected = process.env["SITE_PASSWORD"];
    const sessionSecret = process.env["SESSION_SECRET"];
    if (!expected || !sessionSecret) throw new Error("Acesso temporariamente indisponível.");
    if (!passwordMatches(data.password, expected)) return { ok: false as const };

    const session = await useSession<{ adminUnlocked?: boolean }>({
      password: sessionSecret,
      name: "mercia-admin",
      maxAge: 60 * 60 * 24 * 7,
      cookie: { httpOnly: true, secure: true, sameSite: "lax", path: "/" },
    });
    await session.update({ adminUnlocked: true });
    return { ok: true as const };
  });

export const getAdminRsvps = createServerFn({ method: "GET" })
  .handler(async () => {
    const sessionSecret = process.env["SESSION_SECRET"];
    if (!sessionSecret) throw new Error("Acesso temporariamente indisponível.");
    const session = await useSession<{ adminUnlocked?: boolean }>({
      password: sessionSecret,
      name: "mercia-admin",
      maxAge: 60 * 60 * 24 * 7,
      cookie: { httpOnly: true, secure: true, sameSite: "lax", path: "/" },
    });
    if (!session.data.adminUnlocked) throw new Error("Acesso restrito.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("rsvps")
      .select("id, guest_name, phone, companion_names, party_size, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error("Não foi possível carregar as confirmações.");

    return {
      guests: data,
      totalPeople: data.reduce((total, item) => total + item.party_size, 0),
    };
  });