alter table public.profiles
add column if not exists is_admin boolean not null default false;

-- Profiles are created by the auth trigger. Users may edit only their display
-- name, so an authenticated user cannot grant administrator access to themself.
revoke insert, update, delete on public.profiles from authenticated;
grant update (display_name) on public.profiles to authenticated;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select profiles.is_admin from public.profiles where profiles.id = auth.uid()),
    false
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

drop policy if exists "Admins can view all meeting rooms" on public.meeting_rooms;
create policy "Admins can view all meeting rooms"
on public.meeting_rooms
for select
to authenticated
using (public.is_admin());

-- Keep the bucket closed to general users while allowing administrators to
-- pass the restrictive policies and the corresponding permissive policies.
drop policy if exists "Block general uploads to meeting room images" on storage.objects;
create policy "Block general uploads to meeting room images"
on storage.objects
as restrictive
for insert
to anon, authenticated
with check (bucket_id <> 'meeting-room-images' or public.is_admin());

drop policy if exists "Block general updates to meeting room images" on storage.objects;
create policy "Block general updates to meeting room images"
on storage.objects
as restrictive
for update
to anon, authenticated
using (bucket_id <> 'meeting-room-images' or public.is_admin())
with check (bucket_id <> 'meeting-room-images' or public.is_admin());

drop policy if exists "Block general deletes from meeting room images" on storage.objects;
create policy "Block general deletes from meeting room images"
on storage.objects
as restrictive
for delete
to anon, authenticated
using (bucket_id <> 'meeting-room-images' or public.is_admin());

drop policy if exists "Admins can upload meeting room images" on storage.objects;
create policy "Admins can upload meeting room images"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'meeting-room-images' and public.is_admin());

drop policy if exists "Admins can update meeting room images" on storage.objects;
create policy "Admins can update meeting room images"
on storage.objects
for update
to authenticated
using (bucket_id = 'meeting-room-images' and public.is_admin())
with check (bucket_id = 'meeting-room-images' and public.is_admin());

drop policy if exists "Admins can delete meeting room images" on storage.objects;
create policy "Admins can delete meeting room images"
on storage.objects
for delete
to authenticated
using (bucket_id = 'meeting-room-images' and public.is_admin());

create or replace function public.set_meeting_room_image(
  target_room_id bigint,
  target_image_path text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_path text := trim(target_image_path);
begin
  if not public.is_admin() then
    raise exception 'Administrator access is required.' using errcode = '42501';
  end if;

  if normalized_path = ''
    or length(normalized_path) > 500
    or normalized_path like '/%'
    or normalized_path like '%..%'
    or normalized_path !~* '\.(png|jpe?g|webp)$'
  then
    raise exception 'Invalid meeting room image path.' using errcode = '22023';
  end if;

  update public.meeting_rooms
  set image_path = normalized_path
  where id = target_room_id;

  if not found then
    raise exception 'Meeting room was not found.' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.set_meeting_room_image(bigint, text) from public;
grant execute on function public.set_meeting_room_image(bigint, text) to authenticated;
