import { useEffect, useMemo } from 'react'
import { ArrowLeft, ImagePlus, MapPin } from 'lucide-react'
import Button from '../../../components/ui/Button'
import GstIncluded from '../../../components/ui/GstIncluded'
import { formatBusinessDealAddress } from '../businessLocation'
import { DEAL_CATEGORIES, DEAL_OFFER_TYPES } from '../constants'
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

function DealImageField({ deal, error, onChange }) {
  const previewUrl = useMemo(
    () =>
      deal.imageFile ? URL.createObjectURL(deal.imageFile) : deal.imageUrl,
    [deal.imageFile, deal.imageUrl],
  )

  useEffect(() => {
    if (!deal.imageFile || !previewUrl) return undefined
    return () => URL.revokeObjectURL(previewUrl)
  }, [deal.imageFile, previewUrl])

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
  return (
    <form
      onSubmit={onSubmit}
      className="placeholder-section deal-form"
      noValidate
    >
      <Button variant="secondary" className="deal-back" onClick={onBack}>
        <ArrowLeft aria-hidden="true" />
        Back to deals
      </Button>

      <div className="deal-form-heading">
        <div>
          <div className="placeholder-section-title is-complete">
            {isEditing ? 'Edit deal details' : 'Deal details'}
          </div>
          <p>
            Complete the required fields, then review everything before you
            publish. You can save a private draft at any time.
          </p>
        </div>
        <span className="deal-status is-draft">Draft</span>
      </div>

      {requestError && (
        <div className="auth-error deal-request-error" role="alert">
          {requestError}
        </div>
      )}

      <section className="deal-form-section">
        <div className="deal-form-section-heading">
          <h3>Deal basics</h3>
          <p>The essentials customers will see first.</p>
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
              aria-invalid={Boolean(errors.category)}
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
            deal={deal}
            error={errors.image}
            onChange={onImageChange}
          />
        </div>
      </section>

      <section className="deal-form-section">
        <div className="deal-form-section-heading">
          <h3>Offer and pricing</h3>
          <p>Choose how the customer saving is calculated.</p>
        </div>
        <div className="form-group">
          <span className="form-label" id="deal-offer-type-label">
            Offer type <span className="deal-required">Required</span>
          </span>
          <select
            aria-labelledby="deal-offer-type-label"
            aria-invalid={Boolean(errors.offerType)}
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
        <OfferFields deal={deal} errors={errors} onChange={onChange} />
        <p className="deal-gst-policy">
          All prices and dollar discounts are in NZD and include GST.
        </p>
      </section>

      <section className="deal-form-section">
        <div className="deal-form-section-heading">
          <h3>Availability</h3>
          <p>Your business address and the dates this deal is available.</p>
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
          <FieldError id="deal-locations-error">
            {errors.locationIds}
          </FieldError>
        </fieldset>
        <div className="deal-field-grid">
          <FormField
            id="deal-start-date"
            label="Start date"
            type="date"
            value={deal.startDate}
            onChange={(value) => onChange('startDate', value)}
            error={errors.startDate}
            required
          />
          <FormField
            id="deal-end-date"
            label="End date"
            type="date"
            min={deal.startDate || undefined}
            value={deal.endDate}
            onChange={(value) => onChange('endDate', value)}
            error={errors.endDate}
            required
          />
        </div>
      </section>

      <section className="deal-form-section">
        <div className="deal-form-section-heading">
          <h3>Conditions and redemption</h3>
          <p>Set the limits and explain how the deal is claimed.</p>
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
        <TextAreaField
          id="deal-redemption"
          label="Redemption instructions"
          value={deal.redemptionInstructions}
          onChange={(value) => onChange('redemptionInstructions', value)}
          placeholder="Tell staff and customers exactly how this deal is claimed."
          error={errors.redemptionInstructions}
          required
        />
      </section>

      <div className="deal-form-actions">
        <Button variant="secondary" onClick={onSaveDraft} disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Save Draft'}
        </Button>
        <Button type="submit" disabled={isSaving}>
          Review and publish
        </Button>
      </div>
    </form>
  )
}
