-- The earlier completion RPC was explicitly granted to authenticated users by
-- an older migration. Remove that grant so jobs cannot skip directly from In
-- progress to Completed and bypass customer confirmation.
revoke execute on function public.complete_business_job(uuid, uuid) from authenticated;
