-- Allow a business member to dismiss one notification without affecting the
-- rest of the business notification history.

create or replace function public.dismiss_business_notification(
  p_business_id uuid,
  p_notification_id bigint
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_deleted_count integer;
begin
  if not public.is_business_member(p_business_id) then
    raise exception 'Business membership required' using errcode = '42501';
  end if;

  delete from public.business_notifications
  where business_id = p_business_id
    and id = p_notification_id;

  get diagnostics v_deleted_count = row_count;
  return v_deleted_count;
end;
$$;

revoke all on function public.dismiss_business_notification(uuid, bigint) from public;
grant execute on function public.dismiss_business_notification(uuid, bigint) to authenticated;
