create table public.saved_deals (
  customer_id uuid not null references auth.users(id) on delete cascade,
  deal_id uuid not null references public.business_deals(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (customer_id, deal_id)
);

alter table public.saved_deals enable row level security;

create policy "Customers can view their own saved deals"
  on public.saved_deals for select to authenticated
  using (customer_id = (select auth.uid()));

create policy "Customers can save deals"
  on public.saved_deals for insert to authenticated
  with check (customer_id = (select auth.uid()));

create policy "Customers can unsave deals"
  on public.saved_deals for delete to authenticated
  using (customer_id = (select auth.uid()));