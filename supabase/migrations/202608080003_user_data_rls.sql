alter table public.profiles enable row level security;
alter table public.estimates enable row level security;
alter table public.estimate_equipments enable row level security;
alter table public.estimate_drinks enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles for select to authenticated using ((select auth.uid()) = id);
drop policy if exists "Users can create own profile" on public.profiles;
create policy "Users can create own profile" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
drop policy if exists "Users can delete own profile" on public.profiles;
create policy "Users can delete own profile" on public.profiles for delete to authenticated using ((select auth.uid()) = id);

drop policy if exists "Users can view own estimates" on public.estimates;
create policy "Users can view own estimates" on public.estimates for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Users can create own estimates" on public.estimates;
create policy "Users can create own estimates" on public.estimates for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Users can update own estimates" on public.estimates;
create policy "Users can update own estimates" on public.estimates for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "Users can delete own estimates" on public.estimates;
create policy "Users can delete own estimates" on public.estimates for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Users can view equipment lines from own estimates" on public.estimate_equipments;
create policy "Users can view equipment lines from own estimates" on public.estimate_equipments for select to authenticated
using (exists (select 1 from public.estimates where estimates.id = estimate_equipments.estimate_id and estimates.user_id = (select auth.uid())));
drop policy if exists "Users can create equipment lines for own estimates" on public.estimate_equipments;
create policy "Users can create equipment lines for own estimates" on public.estimate_equipments for insert to authenticated
with check (exists (select 1 from public.estimates where estimates.id = estimate_equipments.estimate_id and estimates.user_id = (select auth.uid())));
drop policy if exists "Users can update equipment lines from own estimates" on public.estimate_equipments;
create policy "Users can update equipment lines from own estimates" on public.estimate_equipments for update to authenticated
using (exists (select 1 from public.estimates where estimates.id = estimate_equipments.estimate_id and estimates.user_id = (select auth.uid())))
with check (exists (select 1 from public.estimates where estimates.id = estimate_equipments.estimate_id and estimates.user_id = (select auth.uid())));
drop policy if exists "Users can delete equipment lines from own estimates" on public.estimate_equipments;
create policy "Users can delete equipment lines from own estimates" on public.estimate_equipments for delete to authenticated
using (exists (select 1 from public.estimates where estimates.id = estimate_equipments.estimate_id and estimates.user_id = (select auth.uid())));

drop policy if exists "Users can view drink lines from own estimates" on public.estimate_drinks;
create policy "Users can view drink lines from own estimates" on public.estimate_drinks for select to authenticated
using (exists (select 1 from public.estimates where estimates.id = estimate_drinks.estimate_id and estimates.user_id = (select auth.uid())));
drop policy if exists "Users can create drink lines for own estimates" on public.estimate_drinks;
create policy "Users can create drink lines for own estimates" on public.estimate_drinks for insert to authenticated
with check (exists (select 1 from public.estimates where estimates.id = estimate_drinks.estimate_id and estimates.user_id = (select auth.uid())));
drop policy if exists "Users can update drink lines from own estimates" on public.estimate_drinks;
create policy "Users can update drink lines from own estimates" on public.estimate_drinks for update to authenticated
using (exists (select 1 from public.estimates where estimates.id = estimate_drinks.estimate_id and estimates.user_id = (select auth.uid())))
with check (exists (select 1 from public.estimates where estimates.id = estimate_drinks.estimate_id and estimates.user_id = (select auth.uid())));
drop policy if exists "Users can delete drink lines from own estimates" on public.estimate_drinks;
create policy "Users can delete drink lines from own estimates" on public.estimate_drinks for delete to authenticated
using (exists (select 1 from public.estimates where estimates.id = estimate_drinks.estimate_id and estimates.user_id = (select auth.uid())));

grant select, insert, update, delete on public.profiles, public.estimates, public.estimate_equipments, public.estimate_drinks to authenticated;
grant usage, select on all sequences in schema public to authenticated;

