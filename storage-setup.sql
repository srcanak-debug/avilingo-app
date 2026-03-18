-- Create buckets for exam media
insert into storage.buckets (id, name, public) values ('exam-photos', 'exam-photos', false) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('exam-audio', 'exam-audio', false) on conflict do nothing;

-- Set up RLS for exam-photos
create policy "Authenticated users can insert photos"
  on storage.objects for insert
  with check ( bucket_id = 'exam-photos' and auth.role() = 'authenticated' );

create policy "Users can read own photos"
  on storage.objects for select
  using ( bucket_id = 'exam-photos' and auth.role() = 'authenticated' );
  
-- Set up RLS for exam-audio
create policy "Authenticated users can insert audio"
  on storage.objects for insert
  with check ( bucket_id = 'exam-audio' and auth.role() = 'authenticated' );

create policy "Users can read own audio"
  on storage.objects for select
  using ( bucket_id = 'exam-audio' and auth.role() = 'authenticated' );
