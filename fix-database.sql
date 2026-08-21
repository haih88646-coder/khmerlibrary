-- ============================================================
-- FIX FOR "Can't add book" - Khmer Digital Library
-- Run this in: Supabase Dashboard -> SQL Editor -> New query
-- ============================================================

-- 1. Add missing columns to the books table
alter table public.books
  add column if not exists "authorId" uuid references public.authors(id) on delete set null,
  add column if not exists "authorName" text,
  add column if not exists "categoryId" uuid references public.categories(id) on delete set null,
  add column if not exists "publicationYear" int,
  add column if not exists "isFeatured" boolean not null default false,
  add column if not exists "isPublished" boolean not null default true,
  add column if not exists "fileUrl" text,
  add column if not exists "fileType" text,
  add column if not exists "fileSize" bigint,
  add column if not exists "coverUrl" text,
  add column if not exists created_at timestamptz not null default now();

-- 2. Create the storage bucket used by the app
insert into storage.buckets (id, name, public)
values ('khmer-library', 'khmer-library', true)
on conflict (id) do nothing;

-- Storage policies
drop policy if exists "khmer_library_public_read" on storage.objects;
create policy "khmer_library_public_read"
  on storage.objects for select
  using (bucket_id = 'khmer-library');

drop policy if exists "khmer_library_auth_upload" on storage.objects;
create policy "khmer_library_auth_upload"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'khmer-library');

drop policy if exists "khmer_library_auth_update" on storage.objects;
create policy "khmer_library_auth_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'khmer-library');

drop policy if exists "khmer_library_auth_delete" on storage.objects;
create policy "khmer_library_auth_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'khmer-library');

-- 3. Admin check helper (reads role from your users table)
create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from users
    where uid = auth.uid()::text and role = 'admin'
  );
$$;

-- 4. Row Level Security on books
alter table public.books enable row level security;

drop policy if exists "books_public_read" on public.books;
create policy "books_public_read"
  on public.books for select
  using (true);

drop policy if exists "books_admin_insert" on public.books;
create policy "books_admin_insert"
  on public.books for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "books_admin_update" on public.books;
create policy "books_admin_update"
  on public.books for update
  to authenticated
  using (public.is_admin());

drop policy if exists "books_admin_delete" on public.books;
create policy "books_admin_delete"
  on public.books for delete
  to authenticated
  using (public.is_admin());

-- 5. View/download counter functions (called by the app)
create or replace function public.increment_views(book_id uuid)
returns void language sql security definer
set search_path = public
as $$
  update books set views = coalesce(views, 0) + 1 where id = book_id;
$$;

create or replace function public.increment_downloads(book_id uuid)
returns void language sql security definer
set search_path = public
as $$
  update books set downloads = coalesce(downloads, 0) + 1 where id = book_id;
$$;

grant execute on function public.increment_views(uuid) to anon, authenticated;
grant execute on function public.increment_downloads(uuid) to anon, authenticated;

-- 6. Fix users table (missing columns prevented profile creation,
--    which blocked the admin check and therefore book inserts)
alter table public.users
  add column if not exists "displayName" text,
  add column if not exists "isActive" boolean default true,
  add column if not exists created_at timestamptz not null default now();

-- 7. Row Level Security on users
alter table public.users enable row level security;

drop policy if exists "users_select_own_or_admin" on public.users;
create policy "users_select_own_or_admin"
  on public.users for select
  using (uid = auth.uid()::text or public.is_admin());

drop policy if exists "users_insert_self_or_admin" on public.users;
create policy "users_insert_self_or_admin"
  on public.users for insert
  to authenticated
  with check (uid = auth.uid()::text or public.is_admin());

drop policy if exists "users_update_own_or_admin" on public.users;
create policy "users_update_own_or_admin"
  on public.users for update
  to authenticated
  using (uid = auth.uid()::text or public.is_admin());

-- 8. Fix settings table + create the default row
alter table public.settings
  add column if not exists "logoUrl" text;

insert into public.settings (id, name_km, name_en, tagline_km, tagline_en)
values (
  'site',
  'បណ្ណាល័យឌីជីថលខ្មែរ',
  'Khmer Digital Library',
  'ស្វែងរក អាន និងរក្សាទុកសៀវភៅខ្មែរ',
  'Discover, Read, and Save Khmer Books'
)
on conflict (id) do nothing;

-- 9. Row Level Security on categories and authors
--    (RLS was enabled here with no policies -> everything was blocked)

-- categories
drop policy if exists "categories_public_read" on public.categories;
create policy "categories_public_read"
  on public.categories for select
  using (true);

drop policy if exists "categories_admin_insert" on public.categories;
create policy "categories_admin_insert"
  on public.categories for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "categories_admin_update" on public.categories;
create policy "categories_admin_update"
  on public.categories for update
  to authenticated
  using (public.is_admin());

drop policy if exists "categories_admin_delete" on public.categories;
create policy "categories_admin_delete"
  on public.categories for delete
  to authenticated
  using (public.is_admin());

-- authors
drop policy if exists "authors_public_read" on public.authors;
create policy "authors_public_read"
  on public.authors for select
  using (true);

drop policy if exists "authors_admin_insert" on public.authors;
create policy "authors_admin_insert"
  on public.authors for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "authors_admin_update" on public.authors;
create policy "authors_admin_update"
  on public.authors for update
  to authenticated
  using (public.is_admin());

drop policy if exists "authors_admin_delete" on public.authors;
create policy "authors_admin_delete"
  on public.authors for delete
  to authenticated
  using (public.is_admin());
