update public.meeting_rooms
set image_path = 'creative-12.png'
where name = 'Creative 12'
  and image_path is distinct from 'creative-12.png';

update public.meeting_rooms
set image_path = 'seminar-24.png'
where name = 'Seminar 24'
  and image_path is distinct from 'seminar-24.png';
