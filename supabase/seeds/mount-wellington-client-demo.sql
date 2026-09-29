do $mount_wellington_seed$
begin

update public.profiles
set
  formatted_address = 'Mount Wellington, Auckland 1060, New Zealand',
  address_line1 = 'Mount Wellington',
  suburb = 'Mount Wellington',
  city = 'Auckland',
  postcode = '1060',
  country_code = 'nz',
  location = extensions.st_setsrid(
    extensions.st_makepoint(174.83802, -36.91180),
    4326
  )::extensions.geography
where id = '10000000-0000-0000-0000-000000000001';

create temporary table mount_wellington_demo (
  demo_number integer primary key,
  business_name text not null,
  description text not null,
  category text not null,
  address_line1 text not null,
  longitude double precision not null,
  latitude double precision not null,
  deal_title text,
  deal_description text,
  offer_type text,
  offer_value integer
) on commit drop;

insert into mount_wellington_demo values
  (101, 'Maungarei Coffee', 'Neighbourhood coffee bar serving espresso, cabinet food, and easy local lunches.', 'Food & Drink', '7 Lunn Avenue', 174.8340, -36.9075, '20% off your next coffee', 'Save on a barista-made coffee at our Mount Wellington cafe.', 'percentage_discount', 20),
  (102, 'Lunn Lane Bakery', 'Fresh bread, pastries, cakes, and savoury favourites baked locally each morning.', 'Food & Drink', '23 Lunn Avenue', 174.8266, -36.9093, 'Buy one pastry, get one free', 'Pick any two eligible pastries and pay for just one in store.', 'buy_one_get_one', null),
  (103, 'Riverside Noodles', 'Quick, generous noodle bowls made to order for lunch and dinner.', 'Food & Drink', '12 Carbine Road', 174.8430, -36.9132, '$5 off a noodle bowl', 'Enjoy five dollars off an eligible lunch bowl in store.', 'fixed_discount', 500),
  (104, 'Corner Grocer', 'Everyday groceries, fresh produce, and pantry staples from trusted suppliers.', 'Retail', '286 Mount Wellington Highway', 174.8295, -36.9048, '15% off pantry staples', 'Save on selected everyday pantry items in store.', 'percentage_discount', 15),
  (105, 'Maungarei Books', 'Independent bookshop with new releases, local authors, and thoughtful recommendations.', 'Retail', '20 Vestey Drive', 174.8389, -36.9092, '$19 weekend book pick', 'Choose an eligible weekend reading pick for a special price.', 'special_price', 1900),
  (106, 'Local Threads', 'Curated clothing, accessories, and everyday essentials for the local community.', 'Retail', '65 Leonard Road', 174.8460, -36.9162, '25% off a wardrobe pick', 'Save on one eligible item from our local clothing collection.', 'percentage_discount', 25),
  (107, 'Summit Fitness', 'Welcoming group fitness, strength, and mobility classes for every experience level.', 'Health & Wellness', '8 Waipuna Road', 174.8315, -36.9138, '20% off a class pass', 'Try an eligible studio class pass at a discounted price.', 'percentage_discount', 20),
  (108, 'Calm Corner Massage', 'Relaxation and recovery treatments in a calm neighbourhood studio.', 'Health & Wellness', '14 Sylvia Park Road', 174.8406, -36.9180, '$15 off a massage', 'Save fifteen dollars on an eligible in-store appointment.', 'fixed_discount', 1500),
  (109, 'Maungarei Barber', 'Classic cuts, modern styling, and friendly local service for all ages.', 'Services', '33 Marua Road', 174.8352, -36.9132, '15% off a fresh cut', 'Get an eligible barber appointment for less in store.', 'percentage_discount', 15),
  (110, 'Lunn Cycle Workshop', 'Bike servicing, repairs, and practical advice for commuters and weekend riders.', 'Services', '40 Lunn Avenue', 174.8248, -36.9115, '$10 off a bike tune-up', 'Save ten dollars on an eligible bicycle service in store.', 'fixed_discount', 1000),
  (111, 'Eastern Paint & Repair', 'Reliable painting, repairs, and property maintenance for homes and small businesses.', 'Trades', '18 Carbine Road', 174.8355, -36.9168, '10% off a repair visit', 'Save on an eligible local repair service booked in store.', 'percentage_discount', 10),
  (112, 'Riverside Garden Co', 'Garden maintenance, planting, and seasonal tidy-ups across the local area.', 'Trades', '27 Waipuna Road', 174.8475, -36.9110, '15% off garden care', 'Save on an eligible garden care service with our local team.', 'percentage_discount', 15),
  (113, 'Arcadia Playroom', 'A bright indoor play space with activities for children and families.', 'Entertainment', '6 Aranui Road', 174.8434, -36.9060, '$12 family play session', 'Enjoy an eligible family play session for a special price.', 'special_price', 1200),
  (114, 'Local Cinema Club', 'Independent screenings, family favourites, and community film nights.', 'Entertainment', '45 Sylvia Park Road', 174.8462, -36.9190, 'Two tickets for the price of one', 'Bring a friend and get a second eligible cinema ticket free.', 'buy_one_get_one', null),
  (115, 'Neighbourhood Pet Care', 'Friendly grooming, walking, and day care services for local pets.', 'Services', '22 Panama Road', 174.8328, -36.9029, null, null, null, null),
  (116, 'Sylvia Tech Fix', 'Phone, tablet, and laptop repairs with straightforward local support.', 'Services', '41 Carbine Road', 174.8417, -36.9039, null, null, null, null),
  (117, 'Maungarei Music School', 'Private and small-group music lessons for children, teens, and adults.', 'Services', '16 Lunn Avenue', 174.8240, -36.9070, null, null, null, null),
  (118, 'Community Craft Studio', 'Creative workshops, supplies, and shared studio sessions for all skill levels.', 'Services', '31 Marua Road', 174.8367, -36.9210, null, null, null, null),
  (119, 'Eastern Home Cleaning', 'Regular and one-off home cleaning with flexible local scheduling.', 'Services', '25 Vestey Drive', 174.8480, -36.9138, null, null, null, null),
  (120, 'Mount Wellington Florals', 'Fresh seasonal flowers, thoughtful bouquets, and easy local collection.', 'Services', '52 Mount Wellington Highway', 174.8390, -36.9200, null, null, null, null);

insert into public.businesses (
  id, business_name, description, verification_status, onboarding_completed_at
)
select
  ('b0000000-0000-0000-0000-' || lpad(demo_number::text, 12, '0'))::uuid,
  business_name,
  description,
  'not_required',
  now()
from mount_wellington_demo
on conflict (id) do update
set
  business_name = excluded.business_name,
  description = excluded.description;

insert into public.business_capabilities (
  business_id, deals_enabled, loyalty_enabled, service_marketplace_enabled
)
select
  ('b0000000-0000-0000-0000-' || lpad(demo_number::text, 12, '0'))::uuid,
  true,
  false,
  false
from mount_wellington_demo
on conflict (business_id) do nothing;

insert into public.business_locations (
  id, business_id, name, formatted_address, address_line1,
  suburb, city, postcode, country_code, location, is_primary
)
select
  ('b1000000-0000-0000-0000-' || lpad(demo_number::text, 12, '0'))::uuid,
  ('b0000000-0000-0000-0000-' || lpad(demo_number::text, 12, '0'))::uuid,
  'Main location',
  address_line1 || ', Mount Wellington, Auckland 1060, New Zealand',
  address_line1,
  'Mount Wellington',
  'Auckland',
  '1060',
  'nz',
  extensions.st_setsrid(
    extensions.st_makepoint(longitude, latitude),
    4326
  )::extensions.geography,
  true
from mount_wellington_demo
on conflict (id) do update
set
  name = excluded.name,
  formatted_address = excluded.formatted_address,
  address_line1 = excluded.address_line1,
  location = excluded.location;

insert into public.business_deals (
  id, business_id, title, description, category, image_url, offer_type,
  discount_percentage, discount_amount_cents, original_price_cents,
  deal_price_cents, offer_details, gst_included, start_date, end_date,
  conditions, claim_limit, exclusions, redemption_instructions, status
)
select
  ('b2000000-0000-0000-0000-' || lpad(demo_number::text, 12, '0'))::uuid,
  ('b0000000-0000-0000-0000-' || lpad(demo_number::text, 12, '0'))::uuid,
  deal_title,
  deal_description,
  category,
  case when demo_number % 2 = 0
    then '/src/assets/images/local-neighbourhood-street.jpg'
    else '/src/assets/images/local-business-neighbourhood.jpg'
  end,
  offer_type,
  case when offer_type = 'percentage_discount' then offer_value end,
  case when offer_type = 'fixed_discount' then offer_value end,
  case when offer_type = 'special_price' then offer_value * 2 end,
  case when offer_type = 'special_price' then offer_value end,
  case when offer_type = 'buy_one_get_one'
    then 'Buy one eligible item and receive a second one free.'
  end,
  true,
  current_date - 1,
  current_date + 45,
  'Available at this Mount Wellington location only.',
  100,
  null,
  'Redeem with code or QR in store.',
  'draft'
from mount_wellington_demo
where offer_type is not null
on conflict (id) do update
set
  title = excluded.title,
  description = excluded.description,
  conditions = excluded.conditions,
  redemption_instructions = excluded.redemption_instructions;

insert into public.business_deal_locations (deal_id, location_id)
select
  ('b2000000-0000-0000-0000-' || lpad(demo_number::text, 12, '0'))::uuid,
  ('b1000000-0000-0000-0000-' || lpad(demo_number::text, 12, '0'))::uuid
from mount_wellington_demo
where offer_type is not null
on conflict do nothing;

update public.business_deals as deal
set status = 'published'
from mount_wellington_demo as demo
where deal.id = (
  'b2000000-0000-0000-0000-' || lpad(demo.demo_number::text, 12, '0')
)::uuid
  and demo.offer_type is not null
  and deal.status = 'draft';

update public.profiles as profile
set
  formatted_address = seeded.formatted_address,
  address_line1 = seeded.address_line1,
  suburb = 'Mount Wellington',
  city = 'Auckland',
  postcode = '1060',
  country_code = 'nz',
  location = extensions.st_setsrid(
    extensions.st_makepoint(seeded.longitude, seeded.latitude),
    4326
  )::extensions.geography
from (
  values
    ('10000000-0000-0000-0000-000000000001'::uuid, '12 Lunn Avenue, Mount Wellington, Auckland 1060, New Zealand', '12 Lunn Avenue', 174.8331::double precision, -36.9080::double precision),
    ('20000000-0000-0000-0000-000000000001'::uuid, '29 Lunn Avenue, Mount Wellington, Auckland 1060, New Zealand', '29 Lunn Avenue', 174.8344::double precision, -36.9090::double precision),
    ('30000000-0000-0000-0000-000000000001'::uuid, '14 Carbine Road, Mount Wellington, Auckland 1060, New Zealand', '14 Carbine Road', 174.8425::double precision, -36.9130::double precision),
    ('40000000-0000-0000-0000-000000000001'::uuid, '45 Sylvia Park Road, Mount Wellington, Auckland 1060, New Zealand', '45 Sylvia Park Road', 174.8406::double precision, -36.9180::double precision),
    ('50000000-0000-0000-0000-000000000001'::uuid, '72 Mount Wellington Highway, Mount Wellington, Auckland 1060, New Zealand', '72 Mount Wellington Highway', 174.8390::double precision, -36.9200::double precision),
    ('60000000-0000-0000-0000-000000000001'::uuid, '9 Waipuna Road, Mount Wellington, Auckland 1060, New Zealand', '9 Waipuna Road', 174.8315::double precision, -36.9138::double precision),
    ('70000000-0000-0000-0000-000000000001'::uuid, '38 Marua Road, Mount Wellington, Auckland 1060, New Zealand', '38 Marua Road', 174.8352::double precision, -36.9132::double precision),
    ('80000000-0000-0000-0000-000000000001'::uuid, '18 Vestey Drive, Mount Wellington, Auckland 1060, New Zealand', '18 Vestey Drive', 174.8389::double precision, -36.9092::double precision)
) as seeded(id, formatted_address, address_line1, longitude, latitude)
where profile.id = seeded.id;

update public.businesses as business
set
  business_name = seeded.business_name,
  description = seeded.description
from (
  values
    ('21000000-0000-0000-0000-000000000001'::uuid, 'Maungarei Plumbing', 'Trusted Mount Wellington plumbers for repairs, installations, and residential callouts.'),
    ('31000000-0000-0000-0000-000000000001'::uuid, 'Eastern Bays Electrical', 'Local electricians providing safe residential repairs, upgrades, and EV charger installations.'),
    ('41000000-0000-0000-0000-000000000001'::uuid, 'Lunn Avenue Coffee Co.', 'A friendly Mount Wellington cafe serving excellent coffee, fresh brunch, and cabinet favourites.'),
    ('51000000-0000-0000-0000-000000000001'::uuid, 'Mount Wellington Florals', 'Seasonal bouquets, native foliage, gifts, and convenient local collection.'),
    ('61000000-0000-0000-0000-000000000001'::uuid, 'Summit Home & Garden', 'Mount Wellington home maintenance, garden care, painting, carpentry, and roofing specialists.')
) as seeded(id, business_name, description)
where business.id = seeded.id;

update public.business_locations as location
set
  name = seeded.name,
  formatted_address = seeded.formatted_address,
  address_line1 = seeded.address_line1,
  suburb = 'Mount Wellington',
  city = 'Auckland',
  postcode = '1060',
  country_code = 'nz',
  location = extensions.st_setsrid(
    extensions.st_makepoint(seeded.longitude, seeded.latitude),
    4326
  )::extensions.geography,
  is_primary = seeded.is_primary
from (
  values
    ('21100000-0000-0000-0000-000000000001'::uuid, 'Lunn Avenue workshop', '29 Lunn Avenue, Mount Wellington, Auckland 1060, New Zealand', '29 Lunn Avenue', 174.8344::double precision, -36.9090::double precision, true),
    ('21100000-0000-0000-0000-000000000002'::uuid, 'Carbine Road depot', '105 Carbine Road, Mount Wellington, Auckland 1060, New Zealand', '105 Carbine Road', 174.8460::double precision, -36.9162::double precision, false),
    ('31100000-0000-0000-0000-000000000001'::uuid, 'Carbine Road office', '14 Carbine Road, Mount Wellington, Auckland 1060, New Zealand', '14 Carbine Road', 174.8425::double precision, -36.9130::double precision, true),
    ('41100000-0000-0000-0000-000000000001'::uuid, 'Lunn Avenue cafe', '45 Lunn Avenue, Mount Wellington, Auckland 1060, New Zealand', '45 Lunn Avenue', 174.8310::double precision, -36.9075::double precision, true),
    ('51100000-0000-0000-0000-000000000001'::uuid, 'Mount Wellington studio', '72 Mount Wellington Highway, Mount Wellington, Auckland 1060, New Zealand', '72 Mount Wellington Highway', 174.8390::double precision, -36.9200::double precision, true),
    ('61100000-0000-0000-0000-000000000001'::uuid, 'Waipuna Road workshop', '9 Waipuna Road, Mount Wellington, Auckland 1060, New Zealand', '9 Waipuna Road', 174.8315::double precision, -36.9138::double precision, true),
    ('61100000-0000-0000-0000-000000000002'::uuid, 'Vestey Drive office', '18 Vestey Drive, Mount Wellington, Auckland 1060, New Zealand', '18 Vestey Drive', 174.8389::double precision, -36.9092::double precision, false)
) as seeded(id, name, formatted_address, address_line1, longitude, latitude, is_primary)
where location.id = seeded.id;

update public.business_capabilities
set deals_enabled = true,
    loyalty_enabled = true
where business_id in (
  '21000000-0000-0000-0000-000000000001',
  '31000000-0000-0000-0000-000000000001',
  '41000000-0000-0000-0000-000000000001',
  '51000000-0000-0000-0000-000000000001',
  '61000000-0000-0000-0000-000000000001'
);

delete from public.business_service_areas
where business_id in (
  '21000000-0000-0000-0000-000000000001',
  '31000000-0000-0000-0000-000000000001',
  '61000000-0000-0000-0000-000000000001'
);

insert into public.business_service_areas (business_id, service_area)
values
  ('21000000-0000-0000-0000-000000000001', 'Mount Wellington'),
  ('31000000-0000-0000-0000-000000000001', 'Mount Wellington'),
  ('61000000-0000-0000-0000-000000000001', 'Mount Wellington')
on conflict do nothing;

update public.job_requests
set
  city = 'Auckland',
  suburb = 'Mount Wellington',
  radius_km = 5,
  image_urls = array[
    case category
      when 'Plumbing' then '/demo/deals/mount-wellington-plumbing.jpg'
      when 'Electrical' then '/demo/deals/mount-wellington-electrical.jpg'
      else '/demo/deals/mount-wellington-home-garden.jpg'
    end
  ]
where customer_id in (
  '10000000-0000-0000-0000-000000000001',
  '70000000-0000-0000-0000-000000000001'
);

update public.business_deals
set
  description = replace(replace(replace(replace(replace(coalesce(description, ''), 'Ponsonby', 'Mount Wellington'), 'Grey Lynn', 'Mount Wellington'), 'Newmarket', 'Mount Wellington'), 'Takapuna', 'Mount Wellington'), 'Mount Eden', 'Mount Wellington'),
  conditions = replace(replace(replace(replace(replace(coalesce(conditions, ''), 'Ponsonby', 'Mount Wellington'), 'Grey Lynn', 'Mount Wellington'), 'Newmarket', 'Mount Wellington'), 'Takapuna', 'Mount Wellington'), 'Mount Eden', 'Mount Wellington'),
  redemption_instructions = replace(replace(replace(replace(replace(coalesce(redemption_instructions, ''), 'Ponsonby', 'Mount Wellington'), 'Grey Lynn', 'Mount Wellington'), 'Newmarket', 'Mount Wellington'), 'Takapuna', 'Mount Wellington'), 'Mount Eden', 'Mount Wellington'),
  image_url = case
    when business_id = '21000000-0000-0000-0000-000000000001' then '/demo/deals/mount-wellington-plumbing.jpg'
    when business_id = '31000000-0000-0000-0000-000000000001' then '/demo/deals/mount-wellington-electrical.jpg'
    when business_id = '41000000-0000-0000-0000-000000000001' then '/demo/deals/maungarei-cafe-brunch.jpg'
    when business_id = '51000000-0000-0000-0000-000000000001' then '/demo/deals/mount-wellington-florist.jpg'
    when business_id = '61000000-0000-0000-0000-000000000001' then '/demo/deals/mount-wellington-home-garden.jpg'
    when category = 'Food & Drink' then '/demo/deals/maungarei-cafe-brunch.jpg'
    when category = 'Retail' then '/demo/deals/mount-wellington-florist.jpg'
    when category = 'Trades' then '/demo/deals/mount-wellington-home-garden.jpg'
    else '/demo/deals/maungarei-cafe-brunch.jpg'
  end;

create temporary table mount_wellington_account_deals (
  business_number integer primary key,
  business_id uuid not null,
  category text not null,
  image_url text not null,
  draft_title text not null,
  scheduled_title text not null,
  active_title text not null,
  expired_title text not null
) on commit drop;

insert into mount_wellington_account_deals values
  (21, '21000000-0000-0000-0000-000000000001', 'Trades', '/demo/deals/mount-wellington-plumbing.jpg', 'Draft: hot-water check package', 'Upcoming: $40 off a plumbing callout', '15% off local plumbing labour', 'Past: winter leak inspection'),
  (31, '31000000-0000-0000-0000-000000000001', 'Trades', '/demo/deals/mount-wellington-electrical.jpg', 'Draft: switchboard safety package', 'Upcoming: EV charger installation offer', '10% off electrical labour', 'Past: free home power check'),
  (41, '41000000-0000-0000-0000-000000000001', 'Food & Drink', '/demo/deals/maungarei-cafe-brunch.jpg', 'Draft: neighbour brunch bundle', 'Upcoming: two-for-one cabinet treats', '20% off weekday brunch', 'Past: winter coffee pairing'),
  (51, '51000000-0000-0000-0000-000000000001', 'Retail', '/demo/deals/mount-wellington-florist.jpg', 'Draft: native bouquet workshop', 'Upcoming: spring bouquet special', '15% off seasonal flowers', 'Past: weekend flower bundle'),
  (61, '61000000-0000-0000-0000-000000000001', 'Services', '/demo/deals/mount-wellington-home-garden.jpg', 'Draft: home maintenance bundle', 'Upcoming: garden tidy-up special', '15% off garden care', 'Past: autumn property check');

delete from public.business_deals as deal
using mount_wellington_account_deals as business,
  (values (1), (2), (3), (4)) as lifecycle(state_number)
where deal.id = (
  'de000000-0000-0000-0000-'
  || lpad((business.business_number * 10 + lifecycle.state_number)::text, 12, '0')
)::uuid;

insert into public.business_deals (
  id, business_id, title, description, category, image_url, offer_type,
  discount_percentage, gst_included, start_date, end_date, conditions,
  claim_limit, exclusions, redemption_instructions, status, created_at, updated_at
)
select
  (
    'de000000-0000-0000-0000-'
    || lpad((business.business_number * 10 + lifecycle.state_number)::text, 12, '0')
  )::uuid,
  business.business_id,
  case lifecycle.state_number
    when 1 then business.draft_title
    when 2 then business.scheduled_title
    when 3 then business.active_title
    else business.expired_title
  end,
  'A polished Mount Wellington client-demo offer showing this lifecycle state with realistic local business content.',
  business.category,
  business.image_url,
  'percentage_discount',
  case lifecycle.state_number when 2 then 20 when 3 then 15 else 10 end,
  true,
  current_date + lifecycle.start_offset,
  current_date + lifecycle.end_offset,
  'Available from the listed Mount Wellington location during normal opening hours.',
  100,
  'Cannot be combined with another promotion.',
  'Claim in LocalLink and show the active code when booking or paying.',
  'draft',
  now() - interval '2 days',
  now() - interval '1 day'
from mount_wellington_account_deals as business
cross join (
  values
    (1, 10, 40),
    (2, 7, 37),
    (3, -5, 25),
    (4, -45, -5)
) as lifecycle(state_number, start_offset, end_offset);

insert into public.business_deal_locations (deal_id, location_id)
select
  (
    'de000000-0000-0000-0000-'
    || lpad((business.business_number * 10 + lifecycle.state_number)::text, 12, '0')
  )::uuid,
  location.id
from mount_wellington_account_deals as business
cross join (values (1), (2), (3), (4)) as lifecycle(state_number)
join lateral (
  select id
  from public.business_locations
  where business_id = business.business_id
  order by is_primary desc, created_at, id
  limit 1
) as location on true;

update public.business_deals as deal
set status = 'published'
from mount_wellington_account_deals as business,
  (values (2), (3), (4)) as lifecycle(state_number)
where deal.id = (
  'de000000-0000-0000-0000-'
  || lpad((business.business_number * 10 + lifecycle.state_number)::text, 12, '0')
)::uuid;

create temporary table mount_wellington_account_loyalty (
  business_number integer primary key,
  business_id uuid not null,
  programme_type text not null,
  reward_threshold numeric not null,
  reward_value numeric,
  reward_description text,
  programme_label text not null
) on commit drop;

insert into mount_wellington_account_loyalty values
  (21, '21000000-0000-0000-0000-000000000001', 'spend_and_save', 250, 10, null, 'Plumbing Care Club'),
  (31, '31000000-0000-0000-0000-000000000001', 'spend_and_reward', 400, null, 'home electrical safety check', 'Home Energy Rewards'),
  (41, '41000000-0000-0000-0000-000000000001', 'purchase_card', 8, null, null, 'Neighbourhood Coffee Card'),
  (51, '51000000-0000-0000-0000-000000000001', 'spend_and_save', 80, 15, null, 'Fresh Flower Rewards'),
  (61, '61000000-0000-0000-0000-000000000001', 'spend_and_reward', 300, null, 'seasonal garden consultation', 'Home & Garden Rewards');

delete from public.business_loyalty_programmes as programme
using mount_wellington_account_loyalty as business,
  (values (1), (2), (3), (4)) as lifecycle(state_number)
where programme.id = (
  'ae000000-0000-0000-0000-'
  || lpad((business.business_number * 10 + lifecycle.state_number)::text, 12, '0')
)::uuid;

insert into public.business_loyalty_programmes (
  id, business_id, name, programme_type, reward_description,
  reward_threshold, reward_value, terms, start_date, end_date, status
)
select
  (
    'ae000000-0000-0000-0000-'
    || lpad((business.business_number * 10 + lifecycle.state_number)::text, 12, '0')
  )::uuid,
  business.business_id,
  case lifecycle.state_number
    when 1 then 'Draft ' || business.programme_label
    when 2 then 'Upcoming ' || business.programme_label
    when 3 then business.programme_label
    else 'Past ' || business.programme_label
  end,
  business.programme_type,
  business.reward_description,
  business.reward_threshold,
  business.reward_value,
  'Rewards are personal, non-transferable, and available at Mount Wellington locations only.',
  current_date + lifecycle.start_offset,
  current_date + lifecycle.end_offset,
  case lifecycle.state_number
    when 1 then 'draft'
    when 4 then 'expired'
    else 'published'
  end
from mount_wellington_account_loyalty as business
cross join (
  values
    (1, 14, 90),
    (2, 7, 90),
    (3, -30, 90),
    (4, -120, -10)
) as lifecycle(state_number, start_offset, end_offset);

insert into public.customer_loyalty_records (
  id, programme_id, customer_id, loyalty_identifier,
  current_progress, redemption_count
)
select
  (
    'af000000-0000-0000-0000-'
    || lpad(business.business_number::text, 12, '0')
  )::uuid,
  (
    'ae000000-0000-0000-0000-'
    || lpad((business.business_number * 10 + 3)::text, 12, '0')
  )::uuid,
  '10000000-0000-0000-0000-000000000001'::uuid,
  case business.business_number
    when 21 then 'LL-DEMO-PLUM'
    when 31 then 'LL-DEMO-ELEC'
    when 41 then 'LL-DEMO-CAFE'
    when 51 then 'LL-DEMO-FLOR'
    else 'LL-DEMO-HOME'
  end,
  case business.business_number
    when 21 then 225
    when 31 then 350
    when 41 then 7
    when 51 then 80
    else 300
  end,
  case when business.business_number in (51, 61) then 1 else 0 end
from mount_wellington_account_loyalty as business
on conflict (programme_id, customer_id) do update
set
  current_progress = excluded.current_progress,
  redemption_count = excluded.redemption_count;

update public.business_notifications
set
  message = replace(replace(replace(replace(replace(message, 'Ponsonby Plumbing Test', 'Maungarei Plumbing'), 'Auckland Electrical Test', 'Eastern Bays Electrical'), 'Neighbourhood Coffee House', 'Lunn Avenue Coffee Co.'), 'Grey Lynn Flower Studio', 'Mount Wellington Florals'), 'Harbour Home and Garden', 'Summit Home & Garden');

update public.customer_notifications
set
  message = replace(replace(replace(replace(replace(message, 'Ponsonby Plumbing Test', 'Maungarei Plumbing'), 'Auckland Electrical Test', 'Eastern Bays Electrical'), 'Neighbourhood Coffee House', 'Lunn Avenue Coffee Co.'), 'Grey Lynn Flower Studio', 'Mount Wellington Florals'), 'Harbour Home and Garden', 'Summit Home & Garden');

end;
$mount_wellington_seed$;
