-- Public delivery is controlled by the bucket's `public` flag. Restrictive
-- policies below keep writes denied even if a permissive policy for another
-- bucket is added later. Service-role operations continue to bypass RLS.
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'meeting-room-images',
  'meeting-room-images',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Block general uploads to meeting room images" on storage.objects;
create policy "Block general uploads to meeting room images"
on storage.objects
as restrictive
for insert
to anon, authenticated
with check (bucket_id <> 'meeting-room-images');

drop policy if exists "Block general updates to meeting room images" on storage.objects;
create policy "Block general updates to meeting room images"
on storage.objects
as restrictive
for update
to anon, authenticated
using (bucket_id <> 'meeting-room-images')
with check (bucket_id <> 'meeting-room-images');

drop policy if exists "Block general deletes from meeting room images" on storage.objects;
create policy "Block general deletes from meeting room images"
on storage.objects
as restrictive
for delete
to anon, authenticated
using (bucket_id <> 'meeting-room-images');

update public.meeting_rooms
set image_path = 'focus-6.png'
where name = 'Focus 6'
  and image_path is distinct from 'focus-6.png';
