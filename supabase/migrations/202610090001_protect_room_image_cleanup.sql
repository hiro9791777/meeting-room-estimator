-- Storage remove() requires SELECT as well as DELETE. Public bucket delivery
-- alone does not grant SELECT access through the Storage API.
drop policy if exists "Admins can select meeting room images" on storage.objects;
create policy "Admins can select meeting room images"
on storage.objects for select to authenticated
using (bucket_id = 'meeting-room-images' and public.is_admin());

-- Defense in depth: other permissive policies must not allow cleanup to remove
-- seed/legacy images or images still referenced by ANY room (active or not).
-- Admins have an all-rows SELECT policy on meeting_rooms.
drop policy if exists "Protect referenced and seed meeting room images" on storage.objects;
create policy "Protect referenced and seed meeting room images"
on storage.objects as restrictive for delete to anon, authenticated
using (
  bucket_id <> 'meeting-room-images'
  or (
    public.is_admin()
    and name ~* '^rooms/[1-9][0-9]*/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|webp)$'
    and not exists (
      select 1 from public.meeting_rooms
      where meeting_rooms.image_path = storage.objects.name
    )
  )
);
