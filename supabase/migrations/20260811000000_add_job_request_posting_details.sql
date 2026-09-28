
alter table public.job_requests
  add column if not exists image_urls text[] not null default '{}',
  add column if not exists job_date date,
  add column if not exists budget text,
  add column if not exists urgency text not null default 'Flexible';

update public.job_requests
set
  image_urls = coalesce(image_urls, '{}'),
  urgency = coalesce(nullif(trim(urgency), ''), 'Flexible');

alter table public.job_requests
  alter column image_urls set default '{}',
  alter column image_urls set not null,
  alter column urgency set default 'Flexible',
  alter column urgency set not null,
  drop constraint if exists job_requests_image_urls_check,
  add constraint job_requests_image_urls_check
    check (cardinality(image_urls) <= 10),
  drop constraint if exists job_requests_budget_check,
  add constraint job_requests_budget_check
    check (budget is null or char_length(trim(budget)) between 1 and 40),
  drop constraint if exists job_requests_urgency_check,
  add constraint job_requests_urgency_check
    check (urgency in ('Flexible', 'Normal', 'Urgent'));

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'job-images',
  'job-images',
  true,
  26214400,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/quicktime', 'video/webm']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Customers can upload their own job images" on storage.objects;
create policy "Customers can upload their own job images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'job-images'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "Customers can update their own job images" on storage.objects;
create policy "Customers can update their own job images"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'job-images'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'job-images'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "Customers can delete their own job images" on storage.objects;
create policy "Customers can delete their own job images"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'job-images'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
