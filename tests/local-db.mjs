import { PGlite } from "@electric-sql/pglite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const db = new PGlite();
await db.exec(`
create role anon; create role authenticated; create role service_role bypassrls;
create schema auth; create schema storage;
create table auth.users(id uuid primary key, email text, raw_user_meta_data jsonb default '{}', last_sign_in_at timestamptz);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
create table storage.buckets(id text primary key,name text,public boolean);
create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
alter table storage.objects enable row level security;
create function storage.foldername(text) returns text[] language sql as $$ select string_to_array($1, '/') $$;
grant usage on schema public,auth,storage to anon,authenticated,service_role;
alter default privileges in schema public grant all on tables to anon,authenticated,service_role;
alter default privileges in schema public grant all on sequences to anon,authenticated,service_role;
create publication supabase_realtime;
`);
for (const file of fs
  .readdirSync(path.join(root, "supabase/migrations"))
  .filter((f) => f.endsWith(".sql"))
  .sort()) {
  if (file.startsWith("20260930000001"))
    await db.exec(
      `insert into auth.users(id,email) values('50ec9fec-ffd6-43a9-b585-c89f14c3ddd1','sunlightsnow123@gmail.com');`,
    );
  try {
    await db.exec(
      fs.readFileSync(path.join(root, "supabase/migrations", file), "utf8"),
    );
  } catch (error) {
    console.error("MIGRATION FAILED", file, error.message);
    process.exit(1);
  }
}
console.log(
  "PASS: all repository migrations applied to isolated local PostgreSQL.",
);
try {
  const results = await db.exec(
    "begin;\n" +
      fs.readFileSync(
        new URL("./backoffice-security.sql", import.meta.url),
        "utf8",
      ),
  );
  console.log(results.flatMap((r) => r.rows).filter((r) => r.result));
} catch (error) {
  console.error(
    "SECURITY TEST FAILED",
    error.message,
    error.detail ?? "",
    error.where ?? "",
  );
  process.exit(1);
}
try {
  const results = await db.exec(fs.readFileSync(new URL("./character-completion.sql", import.meta.url), "utf8"));
  console.log(results.flatMap((r) => r.rows).filter((r) => r.result));
} catch (error) {
  console.error("CHARACTER COMPLETION TEST FAILED", error.message, error.detail ?? "", error.where ?? "");
  process.exit(1);
}
await db.close();
