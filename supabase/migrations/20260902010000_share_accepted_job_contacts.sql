-- Share the minimum available contact information only after a quote has been
-- accepted. This keeps private account data out of lead and quote payloads and
-- gives both the customer and the accepted business the same scoped view.

create or replace function public.get_accepted_job_contacts(
  p_business_id uuid default null
)
returns table (
  job_request_id uuid,
  business_id uuid,
  shared_at timestamptz,
  consumer_name text,
  consumer_email text,
  consumer_phone text,
  consumer_address text,
  provider_name text,
  provider_contact_name text,
  provider_email text,
  provider_phone text,
  provider_address text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if p_business_id is not null
    and not public.business_has_capability(
      p_business_id,
      'service_marketplace'
    )
  then
    raise exception 'Service Marketplace access required' using errcode = '42501';
  end if;

  return query
  select
    job.id::uuid,
    quote.business_id::uuid,
    coalesce(progress.accepted_at, quote.updated_at)::timestamptz,
    nullif(
      trim(
        concat_ws(
          ' ',
          consumer_profile.first_name,
          consumer_profile.last_name
        )
      ),
      ''
    )::text,
    consumer_account.email::text,
    nullif(trim(consumer_account.phone), '')::text,
    nullif(
      trim(
        coalesce(
          nullif(trim(consumer_profile.formatted_address), ''),
          concat_ws(
            ', ',
            nullif(trim(consumer_profile.address_line1), ''),
            nullif(trim(consumer_profile.suburb), ''),
            nullif(trim(consumer_profile.city), ''),
            nullif(trim(consumer_profile.postcode), '')
          )
        )
      ),
      ''
    )::text,
    business.business_name::text,
    nullif(
      trim(
        concat_ws(
          ' ',
          provider_contact.first_name,
          provider_contact.last_name
        )
      ),
      ''
    )::text,
    provider_account.email::text,
    nullif(trim(provider_account.phone), '')::text,
    nullif(
      trim(
        coalesce(
          nullif(trim(provider_location.formatted_address), ''),
          concat_ws(
            ', ',
            nullif(trim(provider_location.address_line1), ''),
            nullif(trim(provider_location.suburb), ''),
            nullif(trim(provider_location.city), ''),
            nullif(trim(provider_location.postcode), '')
          )
        )
      ),
      ''
    )::text
  from public.job_quotes as quote
  join public.job_requests as job
    on job.id = quote.job_request_id
  join public.businesses as business
    on business.id = quote.business_id
  left join public.profiles as consumer_profile
    on consumer_profile.id = job.customer_id
  left join auth.users as consumer_account
    on consumer_account.id = job.customer_id
  left join lateral (
    select member.profile_id
    from public.business_members as member
    where member.business_id = quote.business_id
    order by
      case member.role
        when 'owner' then 0
        when 'admin' then 1
        else 2
      end,
      member.created_at,
      member.profile_id
    limit 1
  ) as provider_member on true
  left join public.profiles as provider_contact
    on provider_contact.id = provider_member.profile_id
  left join auth.users as provider_account
    on provider_account.id = provider_member.profile_id
  left join lateral (
    select
      location.formatted_address,
      location.address_line1,
      location.suburb,
      location.city,
      location.postcode
    from public.business_locations as location
    where location.business_id = quote.business_id
    order by location.is_primary desc, location.created_at, location.id
    limit 1
  ) as provider_location on true
  left join lateral (
    select min(history.updated_at) as accepted_at
    from public.job_status_history as history
    where history.job_request_id = job.id
      and history.status = 'accepted'
  ) as progress on true
  where quote.status = 'accepted'
    and job.status in (
      'accepted',
      'scheduled',
      'on_the_way',
      'in_progress',
      'pending_completion',
      'completed'
    )
    and (
      (p_business_id is null and job.customer_id = v_user_id)
      or (p_business_id is not null and quote.business_id = p_business_id)
    )
  order by coalesce(progress.accepted_at, quote.updated_at) desc;
end;
$$;

revoke all on function public.get_accepted_job_contacts(uuid) from public;
grant execute on function public.get_accepted_job_contacts(uuid) to authenticated;
