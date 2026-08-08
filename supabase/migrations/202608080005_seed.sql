insert into public.companies (name, description)
select 'コネクトスペース', '駅近の少人数向け会議室を運営しています。'
where not exists (select 1 from public.companies where name = 'コネクトスペース');

insert into public.companies (name, description)
select 'ワークラウンジ東京', '研修やセミナーにも対応する会議施設です。'
where not exists (select 1 from public.companies where name = 'ワークラウンジ東京');

insert into public.facilities (company_id, name, prefecture, city, address_line)
select c.id, '新宿駅前店', '東京都', '新宿区', '西新宿1-1-1'
from public.companies c
where c.name = 'コネクトスペース'
  and not exists (select 1 from public.facilities where name = '新宿駅前店');

insert into public.facilities (company_id, name, prefecture, city, address_line)
select c.id, '渋谷ヒカリエ前店', '東京都', '渋谷区', '渋谷2-2-2'
from public.companies c
where c.name = 'コネクトスペース'
  and not exists (select 1 from public.facilities where name = '渋谷ヒカリエ前店');

insert into public.facilities (company_id, name, prefecture, city, address_line)
select c.id, '東京駅八重洲店', '東京都', '中央区', '八重洲1-3-3'
from public.companies c
where c.name = 'ワークラウンジ東京'
  and not exists (select 1 from public.facilities where name = '東京駅八重洲店');

insert into public.meeting_rooms (facility_id, name, capacity, hourly_rate, description)
select f.id, 'Focus 6', 6, 3200, '少人数の打ち合わせに適した、自然光の入る会議室です。'
from public.facilities f
where f.name = '新宿駅前店'
  and not exists (select 1 from public.meeting_rooms where name = 'Focus 6');

insert into public.meeting_rooms (facility_id, name, capacity, hourly_rate, description)
select f.id, 'Creative 12', 12, 5800, 'モニターとホワイトボードを備えたチームミーティング向けの部屋です。'
from public.facilities f
where f.name = '渋谷ヒカリエ前店'
  and not exists (select 1 from public.meeting_rooms where name = 'Creative 12');

insert into public.meeting_rooms (facility_id, name, capacity, hourly_rate, description)
select f.id, 'Seminar 24', 24, 9800, '研修や小規模セミナーに使える広めの会議室です。'
from public.facilities f
where f.name = '東京駅八重洲店'
  and not exists (select 1 from public.meeting_rooms where name = 'Seminar 24');

insert into public.equipments (name, unit_price, charge_unit)
select seed.name, seed.unit_price, seed.charge_unit
from (values
  ('プロジェクター', 2200, 'per_use'),
  ('追加モニター', 1500, 'per_use'),
  ('ワイヤレスマイク', 800, 'per_item'),
  ('ホワイトボード', 500, 'per_use')
) as seed(name, unit_price, charge_unit)
where not exists (select 1 from public.equipments where equipments.name = seed.name);

insert into public.drinks (name, unit_price)
select seed.name, seed.unit_price
from (values
  ('ミネラルウォーター', 150),
  ('コーヒー', 250),
  ('緑茶', 180)
) as seed(name, unit_price)
where not exists (select 1 from public.drinks where drinks.name = seed.name);

insert into storage.buckets (id, name, public)
values ('meeting-room-images', 'meeting-room-images', true)
on conflict (id) do update set public = excluded.public;

