import { useEffect, useMemo } from 'react'
import {
  ArrowLeft,
  CalendarRange,
  Check,
  ChevronRight,
  ImagePlus,
  LockKeyhole,
  MapPin,
  Tag,
  TicketCheck,
} from 'lucide-react'
import Button from '../../../components/ui/Button'
import DateRangeCalendar from '../../../components/ui/DateRangeCalendar'
import RedemptionMethodField from '../../../components/ui/RedemptionMethodField'
import GstIncluded from '../../../components/ui/GstIncluded'
import { formatBusinessDealAddress } from '../businessLocation'
import {
  DEAL_CATEGORIES,
  DEAL_OFFER_TYPES,
  DEAL_REDEMPTION_METHOD,
  formatDealOffer,
} from '../constants'
import {
  sanitizeClaimLimit,
  sanitizeDealMoney,
  sanitizeDealPercentage,
} from '../validation'

function FieldError({ id, children }) {
  return children ? (
    <span className="form-error" id={id} role="alert">
      {children}
    </span>
  ) : null
}

function FormField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  helper,
  required = false,
  ...inputProps
}) {
  return (
    <div className="form-group">
      <span className="form-label" id={`${id}-label`}>
        {label} {required && <span className="deal-required">Required</span>}
      </span>
      <input
        {...inputProps}
        aria-required={required}
        aria-labelledby={`${id}-label`}
        aria-describedby={error ? `${id}-error` : undefined}
        aria-invalid={Boolean(error)}
        className="form-input"
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
      {helper}
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </div>
  )
}

function TextAreaField({
  id,
  label,
  value,
  onChange,
  placeholder,
  error,
  required = false,
}) {
  return (
    <div className="form-group">
      <span className="form-label" id={`${id}-label`}>
        {label} {required && <span className="deal-required">Required</span>}
      </span>
      <textarea
        aria-required={required}
        aria-labelledby={`${id}-label`}
        aria-describedby={error ? `${id}-error` : undefined}
        aria-invalid={Boolean(error)}
        className="form-input deal-textarea"
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows="4"
      />
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </div>
  )
}

function DealImageField({ error, onChange, previewUrl }) {
  return (
    <div className="form-group deal-image-field">
      <span className="form-label" id="deal-image-label">
        Deal image <span className="deal-required">Required</span>
      </span>
      <label className="deal-image-picker" htmlFor="deal-image">
        <span className="deal-image-thumbnail">
          {previewUrl ? (
            <img src={previewUrl} alt="Deal preview" />
          ) : (
            <ImagePlus aria-hidden="true" />
          )}
        </span>
        <span className="deal-image-copy">
          <strong>{previewUrl ? 'Replace image' : 'Add an image'}</strong>
          <small>JPG, PNG or WebP, up to 5 MB</small>
        </span>
        <span className="deal-image-action" aria-hidden="true">
          Choose file
        </span>
      </label>
      <input
        accept="image/jpeg,image/png,image/webp"
        aria-labelledby="deal-image-label"
        aria-describedby={error ? 'deal-image-error' : undefined}
        aria-invalid={Boolean(error)}
        className="deal-file-input"
        id="deal-image"
        type="file"
        onChange={(event) => onChange(event.target.files?.[0] || null)}
      />
      <FieldError id="deal-image-error">{error}</FieldError>
    </div>
  )
}

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

function OfferFields({ deal, errors, onChange }) {
  if (deal.offerType === 'percentage_discount') {
    return (
      <FormField
        id="deal-discount-percentage"
        label="Discount percentage"
        value={deal.discountPercentage}
        onChange={(value) =>
          onChange('discountPercentage', sanitizeDealPercentage(value))
        }
        placeholder="20"
        error={errors.discountPercentage}
        inputMode="decimal"
        required
      />
    )
  }

  if (deal.offerType === 'fixed_discount') {
    return (
      <FormField
        id="deal-discount-amount"
        label="Discount amount (NZD)"
        value={deal.discountAmount}
        onChange={(value) =>
          onChange('discountAmount', sanitizeDealMoney(value))
        }
        placeholder="10.00"
        error={errors.discountAmount}
        helper={<GstIncluded block />}
        inputMode="decimal"
        required
      />
    )
  }

  if (deal.offerType === 'special_price') {
    return (
      <div className="deal-field-grid">
        <FormField
          id="deal-original-price"
          label="Original price (NZD)"
          value={deal.originalPrice}
          onChange={(value) =>
            onChange('originalPrice', sanitizeDealMoney(value))
          }
          placeholder="80.00"
          error={errors.originalPrice}
          helper={<GstIncluded block />}
          inputMode="decimal"
          required
        />
        <FormField
          id="deal-special-price"
          label="Deal price (NZD)"
          value={deal.dealPrice}
          onChange={(value) => onChange('dealPrice', sanitizeDealMoney(value))}
          placeholder="60.00"
          error={errors.dealPrice}
          helper={<GstIncluded block />}
          inputMode="decimal"
          required
        />
      </div>
    )
  }

  if (['buy_one_get_one', 'other'].includes(deal.offerType)) {
    return (
      <FormField
        id="deal-offer-details"
        label="Offer details"
        value={deal.offerDetails}
        onChange={(value) => onChange('offerDetails', value)}
        placeholder="e.g. Buy any main and receive a second main free"
        error={errors.offerDetails}
        required
      />
    )
  }

  return null
}

export default function DealForm({
  deal,
  errors,
  locations,
  isEditing,
  isSaving,
  requestError,
  onChange,
  onImageChange,
  onBack,
  onSaveDraft,
  onSubmit,
}) {
  const previewUrl = useMemo(
    () =>
      deal.imageFile ? URL.createObjectURL(deal.imageFile) : deal.imageUrl,
    [deal.imageFile, deal.imageUrl],
  )

  useEffect(() => {
    if (!deal.imageFile || !previewUrl) return undefined
    return () => URL.revokeObjectURL(previewUrl)
  }, [deal.imageFile, previewUrl])

  const sectionProgress = [
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
  const completedSections = sectionProgress.filter(
    (section) => section.isComplete,
  ).length
  const offerPreview = formatDealOffer(deal)
  const businessAddress = locations[0]
    ? formatBusinessDealAddress(locations[0])
    : 'Add a business address'

  return (
    <form onSubmit={onSubmit} className="deal-form" noValidate>
      <div className="deal-form-toolbar">
        <Button variant="secondary" className="deal-back" onClick={onBack}>
          <ArrowLeft aria-hidden="true" />
          Back to deals
        </Button>
        <span className="deal-draft-state">
          <LockKeyhole aria-hidden="true" />
          Private draft
        </span>
      </div>

      {!isEditing && (
        <div className="deal-form-heading">
          <div>
            <h2>Draft your deal</h2>
          </div>
        </div>
      )}

      {requestError && (
        <div className="auth-error deal-request-error" role="alert">
          {requestError}
        </div>
      )}

      <div className="deal-form-workspace">
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
        </aside>

        <div className="deal-form-content">
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
                <FieldError id="deal-category-error">
                  {errors.category}
                </FieldError>
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
              <FieldError id="deal-offer-type-error">
                {errors.offerType}
              </FieldError>
            </div>
            <OfferFields deal={deal} errors={errors} onChange={onChange} />
            <p className="deal-gst-policy">
              All prices and dollar discounts are in NZD and include GST.
            </p>
          </section>

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
                  No business location was added during registration. A location
                  is required before publishing.
                </p>
              ) : (
                <div className="deal-business-address">
                  <MapPin aria-hidden="true" />
                  <span>{formatBusinessDealAddress(locations[0])}</span>
                </div>
              )}
              <FieldError id="deal-locations-error">
                {errors.locationIds}
              </FieldError>
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
        </div>
      </div>

      <div className="deal-form-actions">
        <span className="deal-form-actions-note">
          <LockKeyhole aria-hidden="true" />
          Drafts stay private until you publish.
        </span>
        <div>
          <Button variant="secondary" onClick={onSaveDraft} disabled={isSaving}>
            {isSaving ? 'Saving…' : 'Save Draft'}
          </Button>
          <Button type="submit" disabled={isSaving}>
            Review and publish
          </Button>
        </div>
      </div>
    </form>
  )
}
