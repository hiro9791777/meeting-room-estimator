-- Add three sample rooms and a development administrator. The statements are
-- idempotent because `npm run db:setup` executes every SQL file on each run.
insert into public.meeting_rooms (
  facility_id,
  name,
  capacity,
  hourly_rate,
  description,
  image_path
)
select
  facilities.id,
  'Huddle 4',
  4,
  2600,
  '短時間の相談やオンライン会議に使いやすい、落ち着いた少人数向け会議室です。',
  'huddle-4.png'
from public.facilities as facilities
where facilities.name = '新宿駅前店'
  and not exists (
    select 1 from public.meeting_rooms where name = 'Huddle 4'
  );

insert into public.meeting_rooms (
  facility_id,
  name,
  capacity,
  hourly_rate,
  description,
  image_path
)
select
  facilities.id,
  'Boardroom 10',
  10,
  7200,
  '大型モニターとWeb会議設備を備えた、重要な商談にも使える上質な会議室です。',
  'boardroom-10.png'
from public.facilities as facilities
where facilities.name = '渋谷ヒカリエ前店'
  and not exists (
    select 1 from public.meeting_rooms where name = 'Boardroom 10'
  );

insert into public.meeting_rooms (
  facility_id,
  name,
  capacity,
  hourly_rate,
  description,
  image_path
)
select
  facilities.id,
  'Workshop 18',
  18,
  8400,
  '可動式の机と大型ホワイトボードを備え、研修やグループワークに適した会議室です。',
  'workshop-18.png'
from public.facilities as facilities
where facilities.name = '東京駅八重洲店'
  and not exists (
    select 1 from public.meeting_rooms where name = 'Workshop 18'
  );

do $$
declare
  administrator_id uuid;
begin
  select users.id
  into administrator_id
  from auth.users as users
  where lower(users.email) = 'admin@meeting-room.local'
  limit 1;

  if administrator_id is null then
    administrator_id := '5f105cbb-8365-4cd6-a865-6cc016093c4b';

    insert into auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change_token_current,
      reauthentication_token,
      is_sso_user,
      is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000',
      administrator_id,
      'authenticated',
      'authenticated',
      'admin@meeting-room.local',
      extensions.crypt('AdminRoom2026!', extensions.gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"display_name":"会議室管理者"}'::jsonb,
      now(),
      now(),
      '',
      '',
      '',
      '',
      '',
      false,
      false
    );
  end if;

  insert into auth.identities (
    id,
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  )
  select
    gen_random_uuid(),
    administrator_id::text,
    administrator_id,
    jsonb_build_object(
      'sub', administrator_id::text,
      'email', 'admin@meeting-room.local',
      'email_verified', true,
      'phone_verified', false
    ),
    'email',
    now(),
    now(),
    now()
  where not exists (
    select 1
    from auth.identities
    where user_id = administrator_id and provider = 'email'
  );

  insert into public.profiles (id, display_name, is_admin)
  values (administrator_id, '会議室管理者', true)
  on conflict (id) do update
  set
    display_name = excluded.display_name,
    is_admin = true;
end;
$$;
