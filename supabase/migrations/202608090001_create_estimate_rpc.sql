create or replace function public.create_estimate(
  p_meeting_room_id bigint,
  p_usage_hours integer,
  p_number_of_people integer,
  p_equipments jsonb default '[]'::jsonb,
  p_drinks jsonb default '[]'::jsonb
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  room_record record;
  equipment_total bigint := 0;
  drink_total bigint := 0;
  new_estimate_id bigint;
begin
  if current_user_id is null then
    raise exception 'ログインが必要です' using errcode = '42501';
  end if;

  if p_usage_hours is null or p_usage_hours < 1 then
    raise exception '利用時間は1以上の整数で入力してください' using errcode = '22023';
  end if;
  if p_number_of_people is null or p_number_of_people < 1 then
    raise exception '利用人数は1以上の整数で入力してください' using errcode = '22023';
  end if;
  if jsonb_typeof(coalesce(p_equipments, '[]'::jsonb)) <> 'array'
    or jsonb_typeof(coalesce(p_drinks, '[]'::jsonb)) <> 'array' then
    raise exception '明細の形式が正しくありません' using errcode = '22023';
  end if;

  select
    mr.id,
    mr.name,
    mr.capacity,
    mr.hourly_rate,
    f.name as facility_name,
    c.name as company_name
  into room_record
  from public.meeting_rooms mr
  join public.facilities f on f.id = mr.facility_id and f.is_active
  join public.companies c on c.id = f.company_id and c.is_active
  where mr.id = p_meeting_room_id and mr.is_active
  for share of mr;

  if not found then
    raise exception '選択された会議室は利用できません' using errcode = '22023';
  end if;
  if p_number_of_people > room_record.capacity then
    raise exception '利用人数が会議室の定員を超えています' using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(coalesce(p_equipments, '[]'::jsonb)) item
    where not (item ? 'id' and item ? 'quantity')
      or jsonb_typeof(item->'id') <> 'number'
      or jsonb_typeof(item->'quantity') <> 'number'
      or (item->>'id')::numeric % 1 <> 0
      or (item->>'quantity')::numeric % 1 <> 0
      or (item->>'id')::numeric < 1
      or (item->>'quantity')::numeric < 1
  ) or exists (
    select 1
    from jsonb_array_elements(coalesce(p_equipments, '[]'::jsonb)) item
    group by (item->>'id')::bigint
    having count(*) > 1
  ) then
    raise exception '備品の選択内容が正しくありません' using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(coalesce(p_drinks, '[]'::jsonb)) item
    where not (item ? 'id' and item ? 'quantity')
      or jsonb_typeof(item->'id') <> 'number'
      or jsonb_typeof(item->'quantity') <> 'number'
      or (item->>'id')::numeric % 1 <> 0
      or (item->>'quantity')::numeric % 1 <> 0
      or (item->>'id')::numeric < 1
      or (item->>'quantity')::numeric < 1
  ) or exists (
    select 1
    from jsonb_array_elements(coalesce(p_drinks, '[]'::jsonb)) item
    group by (item->>'id')::bigint
    having count(*) > 1
  ) then
    raise exception '飲み物の選択内容が正しくありません' using errcode = '22023';
  end if;

  if (
    select count(*)
    from jsonb_array_elements(coalesce(p_equipments, '[]'::jsonb)) item
    join public.equipments e on e.id = (item->>'id')::bigint and e.is_active
  ) <> jsonb_array_length(coalesce(p_equipments, '[]'::jsonb)) then
    raise exception '利用できない備品が含まれています' using errcode = '22023';
  end if;

  if (
    select count(*)
    from jsonb_array_elements(coalesce(p_drinks, '[]'::jsonb)) item
    join public.drinks d on d.id = (item->>'id')::bigint and d.is_active
  ) <> jsonb_array_length(coalesce(p_drinks, '[]'::jsonb)) then
    raise exception '利用できない飲み物が含まれています' using errcode = '22023';
  end if;

  select coalesce(sum(e.unit_price::bigint * (item->>'quantity')::integer), 0)
  into equipment_total
  from jsonb_array_elements(coalesce(p_equipments, '[]'::jsonb)) item
  join public.equipments e on e.id = (item->>'id')::bigint and e.is_active;

  select coalesce(sum(d.unit_price::bigint * (item->>'quantity')::integer), 0)
  into drink_total
  from jsonb_array_elements(coalesce(p_drinks, '[]'::jsonb)) item
  join public.drinks d on d.id = (item->>'id')::bigint and d.is_active;

  if room_record.hourly_rate::bigint * p_usage_hours > 2147483647
    or equipment_total > 2147483647
    or drink_total > 2147483647
    or room_record.hourly_rate::bigint * p_usage_hours + equipment_total + drink_total > 2147483647 then
    raise exception '見積もり金額が上限を超えています' using errcode = '22003';
  end if;

  insert into public.estimates (
    user_id,
    meeting_room_id,
    usage_hours,
    number_of_people,
    company_name_snapshot,
    facility_name_snapshot,
    meeting_room_name_snapshot,
    hourly_rate_snapshot,
    room_fee,
    equipment_fee,
    drink_fee,
    total_amount
  ) values (
    current_user_id,
    room_record.id,
    p_usage_hours,
    p_number_of_people,
    room_record.company_name,
    room_record.facility_name,
    room_record.name,
    room_record.hourly_rate,
    room_record.hourly_rate * p_usage_hours,
    equipment_total::integer,
    drink_total::integer,
    (room_record.hourly_rate::bigint * p_usage_hours + equipment_total + drink_total)::integer
  ) returning id into new_estimate_id;

  insert into public.estimate_equipments (
    estimate_id, equipment_id, quantity, equipment_name_snapshot, unit_price
  )
  select
    new_estimate_id,
    e.id,
    (item->>'quantity')::integer,
    e.name,
    e.unit_price
  from jsonb_array_elements(coalesce(p_equipments, '[]'::jsonb)) item
  join public.equipments e on e.id = (item->>'id')::bigint and e.is_active;

  insert into public.estimate_drinks (
    estimate_id, drink_id, quantity, drink_name_snapshot, unit_price
  )
  select
    new_estimate_id,
    d.id,
    (item->>'quantity')::integer,
    d.name,
    d.unit_price
  from jsonb_array_elements(coalesce(p_drinks, '[]'::jsonb)) item
  join public.drinks d on d.id = (item->>'id')::bigint and d.is_active;

  return new_estimate_id;
end;
$$;

revoke all on function public.create_estimate(bigint, integer, integer, jsonb, jsonb) from public;
grant execute on function public.create_estimate(bigint, integer, integer, jsonb, jsonb) to authenticated;
