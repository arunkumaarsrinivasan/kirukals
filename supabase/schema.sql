-- ============================================================
-- Kirukal v2 – Supabase SQL Schema
-- Run this in: Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- Diary entries (physical diary pages + text notes)
create table if not exists diary_entries (
  id uuid primary key default gen_random_uuid(),
  title text,
  content jsonb,
  plain_text text,
  tags text[] default '{}',
  entry_type text default 'diary' check (entry_type in ('diary', 'case_study', 'sketch', 'note')),
  layout_mode text default 'single' check (layout_mode in ('single', 'double')),
  page_image_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Media items (images, sketches, links, videos, embeds, AI-detected sketch components)
create table if not exists media_items (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('image','video','link','sketch','embed','sketch_component')),
  url text not null,
  title text,
  description text,
  thumbnail_url text,
  og_data jsonb,
  parent_page_id uuid references diary_entries(id) on delete set null,
  bounding_box jsonb,
  created_at timestamptz default now()
);

-- Connections: links diary text snippets to media items
create table if not exists connections (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid references diary_entries(id) on delete cascade,
  media_id uuid references media_items(id) on delete cascade,
  span_text text,
  connection_type text default 'hover' check (connection_type in ('hover','click','sidebar')),
  position_hint text check (position_hint in ('left','right','float')),
  created_at timestamptz default now()
);

-- Updated_at trigger
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists diary_entries_updated_at on diary_entries;
create trigger diary_entries_updated_at
  before update on diary_entries
  for each row execute function set_updated_at();

-- Storage buckets (create in Supabase Dashboard → Storage)
-- Bucket name: "diary-pages"    (for scanned page images)
-- Bucket name: "sketch-components" (for AI-cropped sketch components)
-- Both should be set to PUBLIC so images are viewable without auth
