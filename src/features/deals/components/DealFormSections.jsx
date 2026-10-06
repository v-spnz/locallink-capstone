import {
  CalendarRange,
  LockKeyhole,
  MapPin,
  Tag,
  TicketCheck,
} from 'lucide-react'
import DateRangeCalendar from '../../../components/ui/DateRangeCalendar'
import RedemptionMethodField from '../../../components/ui/RedemptionMethodField'
import { formatBusinessDealAddress } from '../businessLocation'
import {
  DEAL_CATEGORIES,
  DEAL_OFFER_TYPES,
  DEAL_REDEMPTION_METHOD,
} from '../constants'
import { sanitizeClaimLimit } from '../validation'
import {
  DealImageField,
  FieldError,
  FormField,
  TextAreaField,
} from './DealFormFields'
import DealOfferFields from './DealOfferFields'

export function DealBasicsSection({
  deal,
  errors,
  onChange,
  onImageChange,
  previewUrl,
}) {
  return (
    <section
      className="deal-form-section"
      id="deal-basics-section"
      aria-labelledby="deal-basics-heading"
    >
      <div className="deal-form-section-heading">
        <span aria-hidden="true">
          <Tag />
        </span>
        <div>
          <h3 id="deal-basics-heading">Deal basics</h3>
          <p>The first details customers will notice.</p>
        </div>
      </div>
      <div className="deal-field-grid">
        <FormField
          id="deal-title"
          label="Deal title"
          value={deal.title}
          onChange={(value) => onChange('title', value)}
          placeholder="e.g. 20% off weekend brunch"
          error={errors.title}
          required
        />
        <div className="form-group">
          <span className="form-label" id="deal-category-label">
            Category <span className="deal-required">Required</span>
          </span>
          <select
            aria-labelledby="deal-category-label"
            aria-describedby={
              errors.category ? 'deal-category-error' : undefined
            }
            aria-invalid={Boolean(errors.category)}
            aria-required="true"
            className="form-input"
            id="deal-category"
            value={deal.category}
            onChange={(event) => onChange('category', event.target.value)}
          >
            <option value="">Select a category</option>
            {DEAL_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <FieldError id="deal-category-error">{errors.category}</FieldError>
        </div>
      </div>
      <div className="deal-basics-detail-grid">
        <TextAreaField
          id="deal-description"
          label="Description"
          value={deal.description}
          onChange={(value) => onChange('description', value)}
          placeholder="Explain what the customer receives and why it is valuable."
          error={errors.description}
          required
        />
        <DealImageField
          error={errors.image}
          onChange={onImageChange}
          previewUrl={previewUrl}
        />
      </div>
    </section>
  )
}

export function DealOfferSection({ deal, errors, onChange }) {
  return (
    <section
      className="deal-form-section"
      id="deal-offer-section"
      aria-labelledby="deal-offer-heading"
    >
      <div className="deal-form-section-heading">
        <span aria-hidden="true">
          <TicketCheck />
        </span>
        <div>
          <h3 id="deal-offer-heading">Offer and pricing</h3>
          <p>Make the customer saving clear at a glance.</p>
        </div>
      </div>
      <div className="form-group">
        <span className="form-label" id="deal-offer-type-label">
          Offer type <span className="deal-required">Required</span>
        </span>
        <select
          aria-labelledby="deal-offer-type-label"
          aria-describedby={
            errors.offerType ? 'deal-offer-type-error' : undefined
          }
          aria-invalid={Boolean(errors.offerType)}
          aria-required="true"
          className="form-input"
          id="deal-offer-type"
          value={deal.offerType}
          onChange={(event) => onChange('offerType', event.target.value)}
        >
          <option value="">Select an offer type</option>
          {DEAL_OFFER_TYPES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <FieldError id="deal-offer-type-error">{errors.offerType}</FieldError>
      </div>
      <DealOfferFields deal={deal} errors={errors} onChange={onChange} />
      <p className="deal-gst-policy">
        All prices and dollar discounts are in NZD and include GST.
      </p>
    </section>
  )
}

export function DealAvailabilitySection({ deal, errors, locations, onChange }) {
  return (
    <section
      className="deal-form-section deal-availability-section"
      id="deal-availability-section"
      aria-labelledby="deal-availability-heading"
    >
      <div className="deal-form-section-heading">
        <span aria-hidden="true">
          <CalendarRange />
        </span>
        <div>
          <h3 id="deal-availability-heading">Availability</h3>
          <p>Choose where and when customers can use this deal.</p>
        </div>
      </div>
      <fieldset className="deal-location-fieldset">
        <legend className="form-label">Business address</legend>
        {locations.length === 0 ? (
          <p className="deal-location-empty">
            No business location was added during registration. A location is
            required before publishing.
          </p>
        ) : (
          <div className="deal-business-address">
            <MapPin aria-hidden="true" />
            <span>{formatBusinessDealAddress(locations[0])}</span>
          </div>
        )}
        <FieldError id="deal-locations-error">{errors.locationIds}</FieldError>
      </fieldset>
      <DateRangeCalendar
        id="deal-availability"
        label="Deal period"
        startLabel="Start date"
        endLabel="End date"
        startDate={deal.startDate}
        endDate={deal.endDate}
        startError={errors.startDate}
        endError={errors.endDate}
        onChange={(range) => {
          onChange('startDate', range.startDate)
          onChange('endDate', range.endDate)
        }}
        required
      />
    </section>
  )
}

export function DealRedemptionSection({ deal, errors, onChange }) {
  return (
    <section
      className="deal-form-section"
      id="deal-redemption-section"
      aria-labelledby="deal-redemption-heading"
    >
      <div className="deal-form-section-heading">
        <span aria-hidden="true">
          <LockKeyhole />
        </span>
        <div>
          <h3 id="deal-redemption-heading">Conditions and redemption</h3>
          <p>Set fair limits for claims and redemptions.</p>
        </div>
      </div>
      <TextAreaField
        id="deal-conditions"
        label="Conditions"
        value={deal.conditions}
        onChange={(value) => onChange('conditions', value)}
        placeholder="e.g. Dine-in only; booking recommended"
        error={errors.conditions}
      />
      <div className="deal-field-grid">
        <FormField
          id="deal-claim-limit"
          label="Total claim limit"
          value={deal.claimLimit}
          onChange={(value) =>
            onChange('claimLimit', sanitizeClaimLimit(value))
          }
          placeholder="100"
          error={errors.claimLimit}
          inputMode="numeric"
          required
        />
        <TextAreaField
          id="deal-exclusions"
          label="Exclusions"
          value={deal.exclusions}
          onChange={(value) => onChange('exclusions', value)}
          placeholder="e.g. Public holidays and delivery orders"
          error={errors.exclusions}
        />
      </div>
      <RedemptionMethodField label="Redemption method">
        {DEAL_REDEMPTION_METHOD}
      </RedemptionMethodField>
    </section>
  )
}
