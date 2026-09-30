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

  if new.programme_type = 'purchase_card' then
    new.reward_value := null;
    new.reward_description := 'Next purchase free';
    new.earning_rules := case
      when v_threshold_label is not null then format(
        'Complete %s purchases to receive the next purchase free.',
        v_threshold_label
      )
      else null
    end;
  elsif new.programme_type = 'visit_card' then
    new.reward_value := null;
    new.reward_description := 'Next visit free';
    new.earning_rules := case
      when v_threshold_label is not null then format(
        'Complete %s visits to receive the next visit free.',
        v_threshold_label
      )
      else null
    end;
  elsif new.programme_type = 'spend_and_save' then
    new.reward_description := case
      when v_reward_value_label is not null then format(
        '%s%% off',
        v_reward_value_label
      )
      else null
    end;
    new.earning_rules := case
      when v_threshold_label is not null
        and v_reward_value_label is not null then format(
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
      when v_threshold_label is not null
        and new.reward_description is not null then format(
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
    new.ended_at := null;
    new.early_end_completion_deadline := null;
    return new;
  end if;

  if new.status not in (
    'published',
    'scheduled',
    'active',
    'expired',
    'ended_early'
  ) then
    raise exception 'Invalid loyalty programme status' using errcode = '23514';
  end if;

  if new.name is null
    or char_length(trim(new.name)) not between 3 and 120
    or new.programme_type not in (
      'purchase_card',
      'visit_card',
      'spend_and_save',
      'spend_and_reward'
    )
    or new.reward_threshold is null
    or new.reward_threshold not between 1 and 1000000
    or (
      new.programme_type in ('purchase_card', 'visit_card')
      and new.reward_threshold <> trunc(new.reward_threshold)
    )
    or (
      new.programme_type = 'spend_and_save'
      and (
        new.reward_value is null
        or new.reward_value not between 5 and 100
        or new.reward_value <> round(new.reward_value / 5) * 5
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
      new.status not in ('expired', 'ended_early')
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
