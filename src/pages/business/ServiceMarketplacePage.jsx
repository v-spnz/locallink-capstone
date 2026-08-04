const pageContent = {
  leads: {
    eyebrow: 'Service Marketplace',
    title: 'Job Leads',
    description: 'Review local service requests matched to your business.',
    empty: 'No matching job leads are available right now.',
  },
  quotes: {
    eyebrow: 'Service Marketplace',
    title: 'Quotes',
    description: 'Track the quotes your business has submitted.',
    empty: 'Your submitted quotes will appear here.',
  },
  jobs: {
    eyebrow: 'Service Marketplace',
    title: 'Active Jobs',
    description: 'Keep track of accepted work and its current status.',
    empty: 'Accepted service jobs will appear here.',
  },
}

export default function ServiceMarketplacePage({ type }) {
  const content = pageContent[type]

  return (
    <>
      <div className="page-header">
        <div className="page-header-eyebrow">{content.eyebrow}</div>
        <h2>{content.title}</h2>
        <p>{content.description}</p>
      </div>
      <div className="card">
        <div className="empty-state">{content.empty}</div>
      </div>
    </>
  )
}
