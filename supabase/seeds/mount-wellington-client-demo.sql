-- Mount Wellington businesses and deals for the local client meeting.
-- Safe to rerun: fixed IDs and conflict handling prevent duplicate markers.
begin;

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

-- Attach locations while the deals are drafts, then publish the active offers.
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

commit;
