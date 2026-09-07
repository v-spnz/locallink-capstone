-- US0091: save the deal, its location, and its publication state in one
-- transaction so a failed publication cannot leave a duplicate draft behind.

create or replace function public.save_business_deal(
  p_deal_id uuid,
  p_business_id uuid,
  p_title text,
  p_description text,
  p_category text,
  p_image_url text,
  p_offer_type text,
  p_discount_percentage numeric,
  p_discount_amount_cents integer,
  p_original_price_cents integer,
  p_deal_price_cents integer,
  p_offer_details text,
  p_start_date date,
  p_end_date date,
  p_conditions text,
  p_claim_limit integer,
  p_exclusions text,
  p_redemption_instructions text,
  p_location_ids uuid[],
  p_status text
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_deal_id uuid;
begin
  if p_status not in ('draft', 'published') then
    raise exception 'Invalid deal status' using errcode = '22023';
  end if;

  if p_deal_id is not null then
    update public.business_deals
    set
      title = p_title,
      description = p_description,
      category = p_category,
      image_url = p_image_url,
      offer_type = p_offer_type,
      discount_percentage = p_discount_percentage,
      discount_amount_cents = p_discount_amount_cents,
      original_price_cents = p_original_price_cents,
      deal_price_cents = p_deal_price_cents,
      offer_details = p_offer_details,
      gst_included = true,
      start_date = p_start_date,
      end_date = p_end_date,
      conditions = p_conditions,
      claim_limit = p_claim_limit,
      exclusions = p_exclusions,
      redemption_instructions = p_redemption_instructions,
      status = 'draft'
    where id = p_deal_id
      and business_id = p_business_id
    returning id into v_deal_id;
  end if;

  if v_deal_id is null then
    insert into public.business_deals (
      id,
      business_id,
      title,
      description,
      category,
      image_url,
      offer_type,
      discount_percentage,
      discount_amount_cents,
      original_price_cents,
      deal_price_cents,
      offer_details,
      gst_included,
      start_date,
      end_date,
      conditions,
      claim_limit,
      exclusions,
      redemption_instructions,
      status
    )
    values (
      coalesce(p_deal_id, gen_random_uuid()),
      p_business_id,
      p_title,
      p_description,
      p_category,
      p_image_url,
      p_offer_type,
      p_discount_percentage,
      p_discount_amount_cents,
      p_original_price_cents,
      p_deal_price_cents,
      p_offer_details,
      true,
      p_start_date,
      p_end_date,
      p_conditions,
      p_claim_limit,
      p_exclusions,
      p_redemption_instructions,
      'draft'
    )
    returning id into v_deal_id;
  end if;

  delete from public.business_deal_locations
  where deal_id = v_deal_id;

  insert into public.business_deal_locations (deal_id, location_id)
  select v_deal_id, requested_location.id
  from (
    select distinct unnest(coalesce(p_location_ids, '{}'::uuid[])) as id
  ) as requested_location;

  if p_status = 'published' then
    update public.business_deals
    set status = 'published'
    where id = v_deal_id;
  end if;

  return v_deal_id;
end;
$$;

revoke all on function public.save_business_deal(
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  text,
  numeric,
  integer,
  integer,
  integer,
  text,
  date,
  date,
  text,
  integer,
  text,
  text,
  uuid[],
  text
) from public;

grant execute on function public.save_business_deal(
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  text,
  numeric,
  integer,
  integer,
  integer,
  text,
  date,
  date,
  text,
  integer,
  text,
  text,
  uuid[],
  text
) to authenticated;
