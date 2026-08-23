-- Allow authenticated sessions to reach master mutations, then restrict every
-- affected row to administrators with RLS. Anonymous users remain read-only.
grant insert, update, delete
on public.companies,
   public.facilities,
   public.meeting_rooms,
   public.equipments,
   public.drinks
to authenticated;

drop policy if exists "Admins can view all companies" on public.companies;
create policy "Admins can view all companies"
on public.companies for select to authenticated
using (public.is_admin());

drop policy if exists "Admins can insert companies" on public.companies;
create policy "Admins can insert companies"
on public.companies for insert to authenticated
with check (public.is_admin());

drop policy if exists "Admins can update companies" on public.companies;
create policy "Admins can update companies"
on public.companies for update to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete companies" on public.companies;
create policy "Admins can delete companies"
on public.companies for delete to authenticated
using (public.is_admin());

drop policy if exists "Admins can view all facilities" on public.facilities;
create policy "Admins can view all facilities"
on public.facilities for select to authenticated
using (public.is_admin());

drop policy if exists "Admins can insert facilities" on public.facilities;
create policy "Admins can insert facilities"
on public.facilities for insert to authenticated
with check (public.is_admin());

drop policy if exists "Admins can update facilities" on public.facilities;
create policy "Admins can update facilities"
on public.facilities for update to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete facilities" on public.facilities;
create policy "Admins can delete facilities"
on public.facilities for delete to authenticated
using (public.is_admin());

-- The all-rows SELECT policy for meeting_rooms is created by the image
-- management migration. Recreate it here so this migration is self-contained.
drop policy if exists "Admins can view all meeting rooms" on public.meeting_rooms;
create policy "Admins can view all meeting rooms"
on public.meeting_rooms for select to authenticated
using (public.is_admin());

drop policy if exists "Admins can insert meeting rooms" on public.meeting_rooms;
create policy "Admins can insert meeting rooms"
on public.meeting_rooms for insert to authenticated
with check (public.is_admin());

drop policy if exists "Admins can update meeting rooms" on public.meeting_rooms;
create policy "Admins can update meeting rooms"
on public.meeting_rooms for update to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete meeting rooms" on public.meeting_rooms;
create policy "Admins can delete meeting rooms"
on public.meeting_rooms for delete to authenticated
using (public.is_admin());

drop policy if exists "Admins can view all equipments" on public.equipments;
create policy "Admins can view all equipments"
on public.equipments for select to authenticated
using (public.is_admin());

drop policy if exists "Admins can insert equipments" on public.equipments;
create policy "Admins can insert equipments"
on public.equipments for insert to authenticated
with check (public.is_admin());

drop policy if exists "Admins can update equipments" on public.equipments;
create policy "Admins can update equipments"
on public.equipments for update to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete equipments" on public.equipments;
create policy "Admins can delete equipments"
on public.equipments for delete to authenticated
using (public.is_admin());

drop policy if exists "Admins can view all drinks" on public.drinks;
create policy "Admins can view all drinks"
on public.drinks for select to authenticated
using (public.is_admin());

drop policy if exists "Admins can insert drinks" on public.drinks;
create policy "Admins can insert drinks"
on public.drinks for insert to authenticated
with check (public.is_admin());

drop policy if exists "Admins can update drinks" on public.drinks;
create policy "Admins can update drinks"
on public.drinks for update to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete drinks" on public.drinks;
create policy "Admins can delete drinks"
on public.drinks for delete to authenticated
using (public.is_admin());
