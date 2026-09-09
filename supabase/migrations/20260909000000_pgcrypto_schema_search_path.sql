-- pgcrypto resolves to the `extensions` schema on hosted Supabase (and to
-- `public` locally). Security definer functions that call crypt()/gen_salt()
-- must therefore resolve both schemas regardless of the caller's search_path.
-- seed.sql handles the same issue with `set search_path = public, extensions;`.

create extension if not exists pgcrypto;

alter function public.admin_create_user set search_path = public, extensions;