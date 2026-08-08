alter table public.companies enable row level security;
alter table public.facilities enable row level security;
alter table public.meeting_rooms enable row level security;
alter table public.equipments enable row level security;
alter table public.drinks enable row level security;

drop policy if exists "Anyone can view active companies" on public.companies;
create policy "Anyone can view active companies"
on public.companies for select to anon, authenticated
using (is_active = true);

drop policy if exists "Anyone can view active facilities" on public.facilities;
create policy "Anyone can view active facilities"
on public.facilities for select to anon, authenticated
using (is_active = true);

drop policy if exists "Anyone can view active meeting rooms" on public.meeting_rooms;
create policy "Anyone can view active meeting rooms"
on public.meeting_rooms for select to anon, authenticated
using (is_active = true);

drop policy if exists "Anyone can view active equipments" on public.equipments;
create policy "Anyone can view active equipments"
on public.equipments for select to anon, authenticated
using (is_active = true);

drop policy if exists "Anyone can view active drinks" on public.drinks;
create policy "Anyone can view active drinks"
on public.drinks for select to anon, authenticated
using (is_active = true);

grant usage on schema public to anon, authenticated;
grant select on public.companies, public.facilities, public.meeting_rooms, public.equipments, public.drinks to anon, authenticated;
revoke insert, update, delete on public.companies, public.facilities, public.meeting_rooms, public.equipments, public.drinks from anon, authenticated;

