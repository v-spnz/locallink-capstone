-- Replace free-form stamp/points programmes with three structured templates.

drop function if exists public.save_business_loyalty_programme(
  uuid,
  uuid,
  text,
  text,
  text,
  integer,
  text,
  text,
  date,
  date,
  text
);
alter table public.business_loyalty_programmes
  add column reward_value numeric(10, 2),
  drop constraint if exists business_loyalty_programmes_programme_type_check,
  drop constraint if exists business_loyalty_programmes_reward_threshold_check;
alter table public.business_loyalty_programmes
  alter column reward_threshold type numeric(10, 2)
    using reward_threshold::numeric(10, 2);
alter table public.business_loyalty_programmes
  disable trigger validate_loyalty_programme_before_publish;
update public.business_loyalty_programmes
set
  programme_type = 'stamp_card',
  reward_description = 'Next purchase or visit free',
  earning_rules = case
    when reward_threshold is not null then format(
      'Complete %s purchases or visits to receive the next one free.',
      trim(trailing '.' from trim(trailing '0' from reward_threshold::text))
    )
    else null
  end
where programme_type = 'stamp';
update public.business_loyalty_programmes
set
  programme_type = null,
  reward_description = null,
  reward_threshold = null,
  earning_rules = null,
  status = 'draft',
  published_at = null
where programme_type = 'points';
alter table public.business_loyalty_programmes
  enable trigger validate_loyalty_programme_before_publish;
alter table public.business_loyalty_programmes
  add constraint business_loyalty_programmes_programme_type_check check (
    programme_type is null
    or programme_type in (
      'stamp_card',
      'spend_and_save',
      'spend_and_reward'
    )
  ),
  add constraint business_loyalty_programmes_reward_threshold_check check (
    reward_threshold is null
    or reward_threshold between 0.01 and 1000000
  ),
  add constraint business_loyalty_programmes_reward_value_check check (
    reward_value is null or reward_value between 0.01 and 1000000
  );
create or replace function public.validate_published_loyalty_programme()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_local_today date := (now() at time zone 'Pacific/Auckland')::date;
  v_threshold_label text;
  v_reward_value_label text;
begin
  if new.reward_threshold is not null then
    v_threshold_label := trim(
      trailing '.' from trim(trailing '0' from new.reward_threshold::text)
    );
  end if;

  if new.reward_value is not null then
    v_reward_value_label := trim(
      trailing '.' from trim(trailing '0' from new.reward_value::text)
    );
  end if;

  if new.programme_type = 'stamp_card' then
    new.reward_value := null;
    new.reward_description := 'Next purchase or visit free';
    new.earning_rules := case
      when v_threshold_label is not null then format(
        'Complete %s purchases or visits to receive the next one free.',
        v_threshold_label
      )
      else null
    end;
  elsif new.programme_type = 'spend_and_save' then
    new.reward_description := case
      when v_reward_value_label is not null
        then format('$%s off', v_reward_value_label)
      else null
    end;
    new.earning_rules := case
      when v_threshold_label is not null and v_reward_value_label is not null
        then format(
          'Spend $%s to receive $%s off.',
          v_threshold_label,
          v_reward_value_label
        )
      else null
    end;
  elsif new.programme_type = 'spend_and_reward' then
    new.reward_value := null;
    new.reward_description := nullif(trim(new.reward_description), '');
    new.earning_rules := case
      when v_threshold_label is not null and new.reward_description is not null
        then format(
          'Spend $%s to receive a free %s.',
          v_threshold_label,
          new.reward_description
        )
      else null
    end;
  else
    new.earning_rules := null;
  end if;

  if new.status = 'draft' then
    new.published_at := null;
    return new;
  end if;

  if new.status not in ('published', 'scheduled', 'active', 'expired') then
    raise exception 'Invalid loyalty programme status' using errcode = '23514';
  end if;

  if new.name is null
    or char_length(trim(new.name)) not between 3 and 120
    or new.programme_type not in (
      'stamp_card',
      'spend_and_save',
      'spend_and_reward'
    )
    or new.reward_threshold is null
    or new.reward_threshold not between 1 and 1000000
    or (
      new.programme_type = 'stamp_card'
      and new.reward_threshold <> trunc(new.reward_threshold)
    )
    or (
      new.programme_type = 'spend_and_save'
      and (
        new.reward_value is null
        or new.reward_value > new.reward_threshold
      )
    )
    or (
      new.programme_type = 'spend_and_reward'
      and (
        new.reward_description is null
        or char_length(new.reward_description) not between 3 and 240
      )
    )
    or new.earning_rules is null
    or char_length(new.earning_rules) not between 10 and 500
    or new.start_date is null
    or (
      new.status <> 'expired'
      and new.end_date is not null
      and new.end_date < v_local_today
    )
  then
    raise exception 'Complete every required loyalty programme field before publishing'
      using errcode = '23514';
  end if;

  new.published_at := coalesce(new.published_at, now());

  if new.status = 'published' then
    new.status := case
      when new.start_date > v_local_today then 'scheduled'
      else 'active'
    end;
  end if;

  return new;
end;
$$;
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
  p_status text
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
  text
) to authenticated;
