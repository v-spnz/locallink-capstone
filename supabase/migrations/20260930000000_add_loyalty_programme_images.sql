alter table public.business_loyalty_programmes
  add column if not exists image_url text;

alter table public.business_loyalty_programmes
  drop constraint if exists business_loyalty_programmes_image_url_check;

alter table public.business_loyalty_programmes
  add constraint business_loyalty_programmes_image_url_check check (
    image_url is null or char_length(trim(image_url)) between 1 and 2048
  );

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'loyalty-programme-images',
  'loyalty-programme-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Business members can upload loyalty programme images"
  on storage.objects;

create policy "Business members can upload loyalty programme images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'loyalty-programme-images'
    and public.business_has_capability(
      ((storage.foldername(name))[1])::uuid,
      'loyalty'
    )
  );

drop policy if exists "Business members can update loyalty programme images"
  on storage.objects;

create policy "Business members can update loyalty programme images"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'loyalty-programme-images'
    and public.business_has_capability(
      ((storage.foldername(name))[1])::uuid,
      'loyalty'
    )
  )
  with check (
    bucket_id = 'loyalty-programme-images'
    and public.business_has_capability(
      ((storage.foldername(name))[1])::uuid,
      'loyalty'
    )
  );

drop policy if exists "Business members can delete loyalty programme images"
  on storage.objects;

create policy "Business members can delete loyalty programme images"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'loyalty-programme-images'
    and public.business_has_capability(
      ((storage.foldername(name))[1])::uuid,
      'loyalty'
    )
  );

drop function if exists public.save_business_loyalty_programme(
  uuid,
  uuid,
  text,
  text,
  text,
  numeric,
  numeric,
  text,
  date,
  date,
  text
);

create or replace function public.save_business_loyalty_programme(
  p_programme_id uuid,
  p_business_id uuid,
  p_name text,
  p_programme_type text,
  p_reward_description text,
  p_reward_threshold numeric,
  p_reward_value numeric,
  p_terms text,
  p_start_date date,
  p_end_date date,
  p_status text,
  p_image_url text default null
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_programme_id uuid;
begin
  if p_status not in ('draft', 'published') then
    raise exception 'Invalid loyalty programme status' using errcode = '22023';
  end if;

  if p_programme_id is not null then
    update public.business_loyalty_programmes
    set
      name = p_name,
      programme_type = p_programme_type,
      reward_description = p_reward_description,
      reward_threshold = p_reward_threshold,
      reward_value = p_reward_value,
      terms = p_terms,
      start_date = p_start_date,
      end_date = p_end_date,
      image_url = p_image_url,
      status = 'draft'
    where id = p_programme_id
      and business_id = p_business_id
      and status = 'draft'
    returning id into v_programme_id;
  end if;

  if v_programme_id is null then
    insert into public.business_loyalty_programmes (
      id,
      business_id,
      name,
      programme_type,
      reward_description,
      reward_threshold,
      reward_value,
      terms,
      start_date,
      end_date,
      image_url,
      status
    )
    values (
      coalesce(p_programme_id, gen_random_uuid()),
      p_business_id,
      p_name,
      p_programme_type,
      p_reward_description,
      p_reward_threshold,
      p_reward_value,
      p_terms,
      p_start_date,
      p_end_date,
      p_image_url,
      'draft'
    )
    returning id into v_programme_id;
  end if;

  if p_status = 'published' then
    update public.business_loyalty_programmes
    set status = 'published'
    where id = v_programme_id;
  end if;

  return v_programme_id;
end;
$$;

revoke all on function public.save_business_loyalty_programme(
  uuid,
  uuid,
  text,
  text,
  text,
  numeric,
  numeric,
  text,
  date,
  date,
  text,
  text
) from public;

grant execute on function public.save_business_loyalty_programme(
  uuid,
  uuid,
  text,
  text,
  text,
  numeric,
  numeric,
  text,
  date,
  date,
  text,
  text
) to authenticated;
