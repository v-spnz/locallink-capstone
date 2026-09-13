-- Delete business deal drafts through the RPC already used by the business UI.
-- The function keeps deletion manager-only and prevents published lifecycle
-- records from being removed through a crafted client request.

create or replace function public.delete_business_deal(
  p_business_id uuid,
  p_deal_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_deal_business_id uuid;
  v_deal_status text;
begin
  if auth.uid() is null or not public.can_manage_business(p_business_id) then
    raise exception 'Business manager access required' using errcode = '42501';
  end if;

  select deal.business_id, deal.status
  into v_deal_business_id, v_deal_status
  from public.business_deals as deal
  where deal.id = p_deal_id
  for update;

  if not found or v_deal_business_id <> p_business_id then
    raise exception 'Draft not found' using errcode = '42501';
  end if;

  if v_deal_status <> 'draft' then
    raise exception 'Only draft deals can be deleted' using errcode = '55000';
  end if;

  delete from public.business_deals
  where id = p_deal_id
    and business_id = p_business_id
    and status = 'draft';

  return found;
end;
$$;

revoke all on function public.delete_business_deal(uuid, uuid) from public;
grant execute on function public.delete_business_deal(uuid, uuid)
  to authenticated;
