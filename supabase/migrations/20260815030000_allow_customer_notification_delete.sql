alter table public.customer_notifications enable row level security;

grant select on public.customer_notifications to authenticated;
grant delete on public.customer_notifications to authenticated;

drop policy if exists "Customers can view their notifications" on public.customer_notifications;
create policy "Customers can view their notifications"
  on public.customer_notifications for select to authenticated
  using (customer_id = auth.uid());

drop policy if exists "Customers can delete their notifications" on public.customer_notifications;
create policy "Customers can delete their notifications"
  on public.customer_notifications for delete to authenticated
  using (customer_id = auth.uid());

create or replace function public.delete_customer_notification(
  p_customer_id uuid,
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
  delete from public.customer_notifications as notification
  where notification.customer_id = p_customer_id
    and notification.id = p_notification_id;

  get diagnostics v_deleted_count = row_count;
  return v_deleted_count;
end;
$$;

revoke all on function public.delete_customer_notification(uuid, bigint) from public;
grant execute on function public.delete_customer_notification(uuid, bigint) to authenticated;
