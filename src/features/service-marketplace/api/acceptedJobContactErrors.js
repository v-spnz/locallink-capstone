export function isAcceptedJobContactsRpcMissing(error) {
  if (!error) return false

  return (
    error.code === 'PGRST202' ||
    /could not find the function public\.get_accepted_job_contacts/i.test(
      error.message ?? '',
    )
  )
}
