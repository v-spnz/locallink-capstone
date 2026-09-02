-- New Zealand customer-facing prices are GST-inclusive by default.
-- Existing deal drafts and published deals are normalised to that policy.

update public.business_deals
set gst_included = true
where gst_included is distinct from true;

alter table public.business_deals
  alter column gst_included set default true,
  alter column gst_included set not null,
  drop constraint if exists business_deals_gst_included_check,
  add constraint business_deals_gst_included_check check (gst_included = true);

-- The job-posting interface supports a maximum of 20 attachments.

alter table public.job_requests
  drop constraint if exists job_requests_image_urls_check,
  add constraint job_requests_image_urls_check
    check (cardinality(image_urls) <= 20);
