const RESULT_LIMIT = 4

function matchesQuery(query, fields) {
  return fields.some((field) => field?.toLowerCase().includes(query))
}

export function buildHomeSearchResults(
  rawQuery,
  { deals, loyaltyRecords, loyaltyDiscovery, jobs },
) {
  const query = rawQuery.trim().toLowerCase()
  if (!query) return []

  const dealItems = deals
    .filter(
      (business) =>
        business.deal_id &&
        matchesQuery(query, [
          business.business_name,
          business.category,
          business.deal_title,
          business.deal_description,
        ]),
    )
    .slice(0, RESULT_LIMIT)
    .map((business) => ({
      id: `deal-${business.deal_id}`,
      title: business.deal_title || business.business_name,
      subtitle: business.business_name,
      to: `/deals?deal=${business.deal_id}`,
      state: { openDeal: business },
    }))

  const joinedItems = loyaltyRecords
    .filter((record) =>
      matchesQuery(query, [
        record.business,
        record.programmeName,
        record.rewardDescription,
      ]),
    )
    .map((record) => ({
      id: `loyalty-${record.id}`,
      title: record.programmeName,
      subtitle: record.business,
      to:
        record.programmeStatus === 'active'
          ? '/loyalty?tab=cards'
          : '/loyalty?tab=past',
    }))

  const notJoinedItems = loyaltyDiscovery
    .filter(
      (programme) =>
        !programme.isJoined &&
        matchesQuery(query, [
          programme.businessName,
          programme.programmeName,
          programme.rewardDescription,
        ]),
    )
    .map((programme) => ({
      id: `discover-${programme.programmeId}`,
      title: programme.programmeName,
      subtitle: `${programme.businessName}, not joined yet`,
      to: '/loyalty?tab=discover',
    }))

  const jobItems = jobs
    .filter((job) =>
      matchesQuery(query, [
        job.title,
        job.category,
        job.job_type,
        job.description,
        job.suburb,
      ]),
    )
    .slice(0, RESULT_LIMIT)
    .map((job) => ({
      id: `job-${job.id}`,
      title: job.title,
      subtitle: job.category,
      to: `/jobs?job=${job.id}`,
    }))

  return [
    { key: 'deals', label: 'Deals', items: dealItems },
    {
      key: 'loyalty',
      label: 'Loyalty',
      items: [...joinedItems, ...notJoinedItems].slice(0, RESULT_LIMIT),
    },
    { key: 'jobs', label: 'Jobs', items: jobItems },
  ].filter((group) => group.items.length > 0)
}
