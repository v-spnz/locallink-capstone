alter table public.business_loyalty_programmes
  drop constraint if exists business_loyalty_programmes_reward_value_check;

alter table public.business_loyalty_programmes
  disable trigger validate_loyalty_programme_before_publish;

update public.business_loyalty_programmes
set reward_value = least(100, greatest(5, round(reward_value / 5) * 5))
where programme_type = 'spend_and_save'
  and reward_value is not null;

update public.business_loyalty_programmes
set
  reward_description = format(
    '%s%% off',
    trim(trailing '.' from trim(trailing '0' from reward_value::text))
  ),
  earning_rules = format(
    'Spend $%s to receive %s%% off.',
    trim(trailing '.' from trim(trailing '0' from reward_threshold::text)),
    trim(trailing '.' from trim(trailing '0' from reward_value::text))
  )
where programme_type = 'spend_and_save'
  and reward_threshold is not null
  and reward_value is not null;

alter table public.business_loyalty_programmes
  enable trigger validate_loyalty_programme_before_publish;

alter table public.business_loyalty_programmes
  add constraint business_loyalty_programmes_reward_value_check check (
    reward_value is null
    or (
      reward_value between 0.01 and 1000000
      and reward_value = round(reward_value / 5) * 5
    )
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
        then format('%s%% off', v_reward_value_label)
      else null
    end;
    new.earning_rules := case
      when v_threshold_label is not null and v_reward_value_label is not null
        then format(
          'Spend $%s to receive %s%% off.',
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

  if new.join_code is null then
    new.join_code := 'LJ-'
      || upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 4))
      || '-'
      || upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 4));
  end if;

  if new.status = 'published' then
    new.status := case
      when new.start_date > v_local_today then 'scheduled'
      else 'active'
    end;
  end if;

  return new;
end;
$$;