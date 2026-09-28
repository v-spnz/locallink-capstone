alter table public.business_loyalty_programmes
  add constraint business_loyalty_programmes_earning_condition_check check (
    status = 'draft'
    or (
      earning_rules is not null
      and char_length(trim(earning_rules)) between 10 and 500
      and trim(earning_rules) ~ '[[:space:]]'
    )
  );
