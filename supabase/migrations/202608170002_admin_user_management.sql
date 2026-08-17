create or replace function public.list_users_for_admin()
returns table (
  user_id uuid,
  email text,
  display_name text,
  is_admin boolean,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Administrator access is required.' using errcode = '42501';
  end if;

  return query
  select
    profiles.id,
    users.email::text,
    profiles.display_name,
    profiles.is_admin,
    profiles.created_at
  from public.profiles as profiles
  join auth.users as users on users.id = profiles.id
  order by profiles.created_at;
end;
$$;

revoke all on function public.list_users_for_admin() from public;
grant execute on function public.list_users_for_admin() to authenticated;

create or replace function public.set_user_admin(
  target_user_id uuid,
  target_is_admin boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_was_admin boolean;
  admin_count integer;
begin
  if not public.is_admin() then
    raise exception 'Administrator access is required.' using errcode = '42501';
  end if;

  -- Serialize role changes so concurrent requests cannot remove every admin.
  perform 1
  from public.profiles
  where is_admin = true
  for update;

  select profiles.is_admin
  into target_was_admin
  from public.profiles as profiles
  where profiles.id = target_user_id;

  if not found then
    raise exception 'User was not found.' using errcode = 'P0002';
  end if;

  if target_was_admin and not target_is_admin then
    select count(*)
    into admin_count
    from public.profiles
    where is_admin = true;

    if admin_count <= 1 then
      raise exception 'The last administrator cannot be removed.' using errcode = '23514';
    end if;
  end if;

  update public.profiles
  set is_admin = target_is_admin
  where id = target_user_id;
end;
$$;

revoke all on function public.set_user_admin(uuid, boolean) from public;
grant execute on function public.set_user_admin(uuid, boolean) to authenticated;
