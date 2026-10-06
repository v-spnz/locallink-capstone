import {
  CalendarRange,
  Check,
  ChevronRight,
  ImagePlus,
  LockKeyhole,
  MapPin,
  Tag,
  TicketCheck,
} from 'lucide-react'
import { formatBusinessDealAddress } from '../businessLocation'
import { formatDealOffer } from '../constants'

function formatPreviewDate(value) {
  if (!value) return ''
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  if (Number.isNaN(date.getTime())) return ''

  return new Intl.DateTimeFormat('en-NZ', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function getPreviewPeriod(deal) {
  const start = formatPreviewDate(deal.startDate)
  const end = formatPreviewDate(deal.endDate)
  if (start && end) return `${start} to ${end}`
  if (start) return `Starts ${start}`
  return 'Choose deal dates'
}

function isOfferReady(deal) {
  if (!deal.offerType) return false
  if (deal.offerType === 'percentage_discount') {
    return Boolean(deal.discountPercentage)
  }
  if (deal.offerType === 'fixed_discount') {
    return Boolean(deal.discountAmount)
  }
  if (deal.offerType === 'special_price') {
    return Boolean(deal.originalPrice && deal.dealPrice)
  }
  return Boolean(deal.offerDetails)
}

function getSectionProgress(deal, locations) {
  return [
    {
      id: 'deal-basics-section',
      label: 'Deal basics',
      icon: Tag,
      isComplete: Boolean(
        deal.title &&
        deal.category &&
        deal.description &&
        (deal.imageFile || deal.imageUrl),
      ),
    },
    {
      id: 'deal-offer-section',
      label: 'Offer and pricing',
      icon: TicketCheck,
      isComplete: isOfferReady(deal),
    },
    {
      id: 'deal-availability-section',
      label: 'Availability',
      icon: CalendarRange,
      isComplete: Boolean(
        locations.length > 0 && deal.startDate && deal.endDate,
      ),
    },
    {
      id: 'deal-redemption-section',
      label: 'Redemption',
      icon: LockKeyhole,
      isComplete: Boolean(deal.claimLimit),
    },
  ]
}

export function DealLivePreview({ deal, locations, previewUrl }) {
  const offerPreview = formatDealOffer(deal)
  const businessAddress = locations[0]
    ? formatBusinessDealAddress(locations[0])
    : 'Add a business address'

  return (
    <article className="deal-live-preview" aria-label="Customer Preview">
      <div className="deal-live-preview-heading">
        <strong>Customer Preview</strong>
      </div>
      <div className="deal-live-preview-media">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={`Preview of ${deal.title || 'the deal'}`}
          />
        ) : (
          <div className="deal-live-preview-placeholder">
            <ImagePlus aria-hidden="true" />
            <span>Your image will appear here</span>
          </div>
        )}
      </div>
      <div className="deal-live-preview-body">
        <span className="deal-live-preview-category">
          {deal.category || 'Choose a category'}
        </span>
        <h3>{deal.title || 'Your deal title'}</h3>
        <strong className="deal-live-preview-offer">
          {offerPreview || 'Your offer will appear here'}
        </strong>
        <div className="deal-live-preview-detail">
          <CalendarRange aria-hidden="true" />
          <span>{getPreviewPeriod(deal)}</span>
        </div>
        <div className="deal-live-preview-detail">
          <MapPin aria-hidden="true" />
          <span>{businessAddress}</span>
        </div>
      </div>
    </article>
  )
}

export default function DealDraftOverview({ deal, locations, previewUrl }) {
  const sectionProgress = getSectionProgress(deal, locations)
  const completedSections = sectionProgress.filter(
    (section) => section.isComplete,
  ).length

  return (
    <aside className="deal-draft-rail" aria-label="Deal draft overview">
      <div
        className={`deal-draft-progress is-progress-${completedSections}`}
        aria-live="polite"
      >
        <span>{completedSections} of 4</span>
        <div>
          <strong>Sections filled</strong>
          <small>
            {completedSections === 4
              ? 'All required details are in place'
              : 'Your draft saves whenever you choose'}
          </small>
        </div>
      </div>

      <nav className="deal-draft-nav" aria-label="Deal sections">
        {sectionProgress.map((section) => {
          const Icon = section.icon
          return (
            <a
              href={`#${section.id}`}
              key={section.id}
              aria-label={`${section.label}, ${section.isComplete ? 'filled' : 'not filled'}`}
              className={section.isComplete ? 'is-complete' : ''}
            >
              <span className="deal-draft-nav-icon" aria-hidden="true">
                {section.isComplete ? <Check /> : <Icon />}
              </span>
              <span>{section.label}</span>
              <ChevronRight aria-hidden="true" />
            </a>
          )
        })}
      </nav>

      <DealLivePreview
        deal={deal}
        locations={locations}
        previewUrl={previewUrl}
      />
    </aside>
  )
}
