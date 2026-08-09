export const TRADE_CATEGORIES = [
  'Plumbing',
  'Electrical',
  'Carpentry',
  'Painting',
  'Landscaping',
  'Roofing',
]

export const CITIES = [
  'Auckland',
  'Wellington',
  'Christchurch',
  'Hamilton',
  'Tauranga',
  'Dunedin',
  'Napier',
  'Hastings',
  'Palmerston North',
  'New Plymouth',
  'Nelson',
  'Rotorua',
  'Whangarei',
  'Invercargill',
  'Queenstown',
  'Porirua',
]

export const POSTED_DISTANCES = Array.from(
  { length: 10 },
  (_, index) => `${index + 1}km`,
)

export const URGENCY_OPTIONS = ['Flexible', 'Normal', 'Urgent']


export const MARKETPLACE_PAGE_CONTENT = {
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