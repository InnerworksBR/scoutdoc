import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";

// Carrega .env manualmente (sem dependência externa)
const env = Object.fromEntries(
  readFileSync(new URL("../.env", import.meta.url), "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

const email = process.argv[2] || "admin@escoteiros.org.br";
// Senha forte: 24 chars base64url + garante símbolo/maiúscula/dígito
const password =
  randomBytes(18).toString("base64url") + "A9!";

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// 1) Cria o usuário com email já confirmado
let userId;
const { data: created, error: createErr } = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});

if (createErr) {
  // Se já existe, localiza o usuário existente
  if (/already|exists|registered/i.test(createErr.message)) {
    const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
    const existing = list.users.find((u) => u.email === email);
    if (!existing) {
      console.error("Erro ao criar e não encontrei usuário existente:", createErr.message);
      process.exit(1);
    }
    userId = existing.id;
    // Reseta a senha do usuário existente para a nova senha gerada
    await admin.auth.admin.updateUserById(userId, { password, email_confirm: true });
    console.log("Usuário já existia — senha redefinida.");
  } else {
    console.error("Erro ao criar usuário:", createErr.message);
    process.exit(1);
  }
} else {
  userId = created.user.id;
  console.log("Usuário criado.");
}

// 2) Garante o profile com role=admin (o trigger cria como 'user')
const { error: upsertErr } = await admin
  .from("profiles")
  .upsert({ id: userId, role: "admin" }, { onConflict: "id" });

if (upsertErr) {
  console.error("Erro ao setar role admin:", upsertErr.message);
  process.exit(1);
}

// 3) Confirma
const { data: profile } = await admin
  .from("profiles")
  .select("id, role")
  .eq("id", userId)
  .single();

console.log("\n========================================");
console.log("  ADMIN CRIADO COM SUCESSO");
console.log("========================================");
console.log("  Email:    ", email);
console.log("  Senha:    ", password);
console.log("  User ID:  ", userId);
console.log("  Role:     ", profile?.role);
console.log("========================================");
