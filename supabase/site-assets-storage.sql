-- TeamAlum site image uploads
-- Run this in Supabase SQL Editor for the shared TeamAlum project.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'site-assets',
  'site-assets',
  true,
  5242880,
  array[
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/svg+xml'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public site assets are readable" on storage.objects;
create policy "Public site assets are readable"
on storage.objects
for select
to public
using (bucket_id = 'site-assets');

drop policy if exists "Service role can manage site assets" on storage.objects;
create policy "Service role can manage site assets"
on storage.objects
for all
to service_role
using (bucket_id = 'site-assets')
with check (bucket_id = 'site-assets');
