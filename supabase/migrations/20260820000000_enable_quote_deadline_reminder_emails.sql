
create or replace function public.queue_business_notification_emails()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.notification_type not in (
    'new_lead',
    'quote_approved',
    'quote_declined',
    'quote_deadline_reminder'
  ) then
    return new;
  end if;

  insert into public.business_email_deliveries (
    notification_id,
    recipient_profile_id
  )
  select new.id, member.profile_id
  from public.business_members as member
  where member.business_id = new.business_id
  on conflict (notification_id, recipient_profile_id) do nothing;

  return new;
end;
$$;

revoke all on function public.queue_business_notification_emails() from public;
