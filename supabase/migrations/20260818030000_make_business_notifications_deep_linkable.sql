
drop function if exists public.get_business_notifications(uuid, integer);
create function public.get_business_notifications(
  p_business_id uuid,
  p_limit integer default 20
)
returns table (
  notification_id bigint,
  notification_type text,
  title text,
  message text,
  destination text,
  related_job_request_id uuid,
  related_quote_id uuid,
  created_at timestamptz,
  read_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_business_member(p_business_id) then
    raise exception 'Business membership required' using errcode = '42501';
  end if;

  return query
  select
    notification.id,
    notification.notification_type,
    notification.title,
    notification.message,
    notification.destination,
    notification.related_job_request_id,
    notification.related_quote_id,
    notification.created_at,
    notification.read_at
  from public.business_notifications as notification
  where notification.business_id = p_business_id
  order by notification.created_at desc
  limit least(greatest(coalesce(p_limit, 20), 1), 50);
end;
$$;

revoke all on function public.get_business_notifications(uuid, integer) from public;
grant execute on function public.get_business_notifications(uuid, integer) to authenticated;
