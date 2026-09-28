with affected_jobs as materialized (
  select job.id
  from public.job_requests as job
  where job.status = 'in_progress'
    and exists (
      select 1
      from public.job_quotes as quote
      where quote.job_request_id = job.id
        and quote.status = 'accepted'
    )
    and exists (
      select 1
      from public.job_status_history as history
      where history.job_request_id = job.id
        and history.status = 'in_progress'
    )
    and not exists (
      select 1
      from public.job_status_history as history
      where history.job_request_id = job.id
        and history.status in ('accepted', 'scheduled', 'on_the_way')
    )
),
removed_in_progress_notifications as (
  delete from public.customer_notifications as notification
  using affected_jobs
  where notification.related_job_request_id = affected_jobs.id
    and notification.notification_type = 'in_progress'
),
removed_invalid_history as (
  delete from public.job_status_history as history
  using affected_jobs
  where history.job_request_id = affected_jobs.id
    and history.status = 'in_progress'
)
update public.job_requests as job
set status = 'accepted'
from affected_jobs
where job.id = affected_jobs.id;
