import {
  ArrowLeft,
  CalendarDays,
  CircleDollarSign,
  Gift,
  ImagePlus,
  LockKeyhole,
  QrCode,
  Save,
  Send,
  Stamp,
  Trash2,
} from 'lucide-react'
import { useEffect, useMemo } from 'react'
import Button from '../../../components/ui/Button'
import DateRangeCalendar from '../../../components/ui/DateRangeCalendar'
import RedemptionMethodField from '../../../components/ui/RedemptionMethodField'
import { getLoyaltyProgressPresentation } from '../loyaltyProgress'
import { sanitizeRewardThreshold } from '../businessLoyaltyValidation'
import DiscountPercentageCombobox from './DiscountPercentageCombobox'
import LoyaltyTicket from './LoyaltyTicket'
import {
  getEarningRules,
  isCountBasedLoyaltyType,
  LOYALTY_REDEMPTION_METHOD,
  LOYALTY_TEMPLATES,
} from '../businessLoyaltyTemplates'

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
  helper,
  error,
  value,
  onChange,
  requiredToPublish = false,
  prefix,
  ...inputProps
}) {
  const descriptionIds = [
    helper ? `${id}-helper` : '',
    error ? `${id}-error` : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="form-group">
      <label className="form-label" htmlFor={id}>
        {label}
        {requiredToPublish && (
          <span className="loyalty-required">Required to publish</span>
        )}
      </label>
      <div className={prefix ? 'loyalty-input-with-prefix' : undefined}>
        {prefix && (
          <span className="loyalty-input-prefix" aria-hidden="true">
            {prefix}
          </span>
        )}
        <input
          {...inputProps}
          aria-describedby={descriptionIds || undefined}
          aria-invalid={Boolean(error)}
          className="form-input"
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
      {helper && (
        <span className="loyalty-field-helper" id={`${id}-helper`}>
          {helper}
        </span>
      )}
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </div>
  )
}

function TextAreaField({
  id,
  label,
  helper,
  error,
  value,
  onChange,
  requiredToPublish = false,
  ...props
}) {
  const descriptionIds = [
    helper ? `${id}-helper` : '',
    error ? `${id}-error` : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="form-group">
      <label className="form-label" htmlFor={id}>
        {label}
        {requiredToPublish && (
          <span className="loyalty-required">Required to publish</span>
        )}
      </label>
      <textarea
        {...props}
        aria-describedby={descriptionIds || undefined}
        aria-invalid={Boolean(error)}
        className="form-input loyalty-textarea"
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {helper && (
        <span className="loyalty-field-helper" id={`${id}-helper`}>
          {helper}
        </span>
      )}
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </div>
  )
}

function ProgrammeImageField({ error, onChange, onRemove, previewUrl }) {
  const descriptionIds = [
    'loyalty-programme-image-helper',
    error ? 'loyalty-programme-image-error' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="form-group loyalty-programme-image-field">
      <span className="form-label" id="loyalty-programme-image-label">
        Programme image <span className="loyalty-optional">Optional</span>
      </span>
      <label className="deal-image-picker" htmlFor="loyalty-programme-image">
        <span className="deal-image-thumbnail">
          {previewUrl ? (
            <img src={previewUrl} alt="Programme image preview" />
          ) : (
            <ImagePlus aria-hidden="true" />
          )}
        </span>
        <span className="deal-image-copy">
          <strong>{previewUrl ? 'Replace image' : 'Add an image'}</strong>
          <small id="loyalty-programme-image-helper">
            JPG, PNG or WebP, up to 5 MB. The gift icon remains if you skip
            this.
          </small>
        </span>
        <span className="deal-image-action" aria-hidden="true">
          Choose file
        </span>
      </label>
      <input
        accept="image/jpeg,image/png,image/webp"
        aria-labelledby="loyalty-programme-image-label"
        aria-describedby={descriptionIds}
        aria-invalid={Boolean(error)}
        className="deal-file-input"
        id="loyalty-programme-image"
        type="file"
        onChange={(event) => {
          onChange(event.target.files?.[0] || null)
          event.target.value = ''
        }}
      />
      {previewUrl && (
        <button
          className="loyalty-programme-image-remove"
          type="button"
          onClick={onRemove}
        >
          <Trash2 aria-hidden="true" />
          Remove image
        </button>
      )}
      <FieldError id="loyalty-programme-image-error">{error}</FieldError>
    </div>
  )
}

function formatAvailability(programme) {
  if (!programme.startDate) return 'Choose when the programme starts'
  if (!programme.endDate) return `Starts ${programme.startDate}`
  return `${programme.startDate} to ${programme.endDate}`
}

export default function LoyaltyDraftForm({
  programme,
  errors,
  isSaving,
  requestError,
  reviewAttempted,
  onChange,
  onImageChange,
  onImageRemove,
  onBack,
  onReview,
  onSaveDraft,
  businessName,
}) {
  const imagePreviewUrl = useMemo(
    () =>
      programme.imageFile
        ? URL.createObjectURL(programme.imageFile)
        : programme.imageUrl,
    [programme.imageFile, programme.imageUrl],
  )

  useEffect(() => {
    if (!programme.imageFile || !imagePreviewUrl) return undefined
    return () => URL.revokeObjectURL(imagePreviewUrl)
  }, [programme.imageFile, imagePreviewUrl])

  const filledFields = [
    programme.name,
    programme.programmeType,
    programme.rewardThreshold,
    programme.programmeType === 'spend_and_save'
      ? programme.rewardValue
      : programme.programmeType === 'spend_and_reward'
        ? programme.rewardDescription
        : isCountBasedLoyaltyType(programme.programmeType),
    programme.startDate,
  ].filter(Boolean).length
  const previewProgram = {
    ...programme,
    programmeName: programme.name || 'Untitled programme',
    rewardDescription: programme.rewardDescription || 'Add reward details',
    currentProgress: 0,
    rewardEligible: false,
    programmeStatus: 'active',
  }
  const previewProgress = getLoyaltyProgressPresentation(previewProgram)
  if (!programme.rewardThreshold) {
    previewProgress.progressLabel = 'Add a reward target'
    previewProgress.remainingLabel = 'Set target'
  }

  return (
    <form
      className="deal-form loyalty-draft-form"
      onSubmit={onSaveDraft}
      noValidate
    >
      <div className="loyalty-form-toolbar">
        <Button variant="secondary" onClick={onBack}>
          <ArrowLeft aria-hidden="true" />
          Back to programmes
        </Button>
        <span className="loyalty-private-state">
          <LockKeyhole aria-hidden="true" />
          Private draft
        </span>
      </div>

      {requestError && (
        <div className="auth-error loyalty-request-error" role="alert">
          {requestError}
        </div>
      )}

      {reviewAttempted && Object.keys(errors).length > 0 && (
        <div className="loyalty-publication-error" role="alert">
          <strong>Complete the highlighted details before reviewing.</strong>
          <span>
            You can still save the programme as a private draft at any time.
          </span>
        </div>
      )}

      <div className="deal-form-workspace loyalty-form-layout">
        <div className="loyalty-form-fields">
          <section aria-labelledby="loyalty-basics-title">
            <div className="loyalty-form-section-heading">
              <span aria-hidden="true">
                <Gift />
              </span>
              <div>
                <h2 id="loyalty-basics-title">Programme basics</h2>
                <p>You can save before every detail is complete.</p>
              </div>
            </div>

            <FormField
              id="loyalty-programme-name"
              label="Programme name"
              helper="A clear name your team will recognise."
              placeholder="e.g. Morning coffee rewards"
              maxLength="120"
              value={programme.name}
              error={errors.name}
              onChange={(value) => onChange('name', value)}
              requiredToPublish
            />

            <ProgrammeImageField
              error={errors.image}
              onChange={onImageChange}
              onRemove={onImageRemove}
              previewUrl={imagePreviewUrl}
            />

            <fieldset className="loyalty-type-fieldset">
              <legend className="form-label">
                How customers earn
                <span className="loyalty-required">Required to publish</span>
              </legend>
              <div className="loyalty-type-options">
                {LOYALTY_TEMPLATES.map((option) => {
                  const Icon = isCountBasedLoyaltyType(option.value)
                    ? Stamp
                    : CircleDollarSign
                  return (
                    <label
                      className={
                        programme.programmeType === option.value
                          ? 'is-selected'
                          : ''
                      }
                      key={option.value}
                    >
                      <input
                        type="radio"
                        name="programme-type"
                        value={option.value}
                        checked={programme.programmeType === option.value}
                        onChange={() => onChange('programmeType', option.value)}
                      />
                      <span aria-hidden="true">
                        <Icon />
                      </span>
                      <strong>{option.label}</strong>
                      <small>{option.description}</small>
                    </label>
                  )
                })}
              </div>
              <FieldError id="loyalty-programme-type-error">
                {errors.programmeType}
              </FieldError>
            </fieldset>
          </section>

          <section aria-labelledby="loyalty-reward-title">
            <div className="loyalty-form-section-heading">
              <span aria-hidden="true">
                <Stamp />
              </span>
              <div>
                <h2 id="loyalty-reward-title">Reward and earning rules</h2>
                <p>Choose a target and the reward customers receive.</p>
              </div>
            </div>

            <div className="loyalty-reward-grid">
              <FormField
                id="loyalty-reward-threshold"
                label="Reward target"
                helper={
                  programme.programmeType === 'purchase_card'
                    ? 'Number of eligible purchases.'
                    : programme.programmeType === 'visit_card'
                      ? 'Number of eligible visits.'
                      : programme.programmeType
                        ? 'Amount the customer must spend, in dollars.'
                        : 'Choose a programme template above.'
                }
                placeholder="e.g. 8"
                inputMode="decimal"
                prefix={
                  !isCountBasedLoyaltyType(programme.programmeType)
                    ? '$'
                    : undefined
                }
                value={programme.rewardThreshold}
                error={errors.rewardThreshold}
                onChange={(value) =>
                  onChange(
                    'rewardThreshold',
                    isCountBasedLoyaltyType(programme.programmeType)
                      ? sanitizeRewardThreshold(value).split('.')[0]
                      : sanitizeRewardThreshold(value),
                  )
                }
                requiredToPublish
              />
              {programme.programmeType === 'spend_and_save' && (
                <DiscountPercentageCombobox
                  value={programme.rewardValue}
                  error={errors.rewardValue}
                  onChange={(value) => onChange('rewardValue', value)}
                />
              )}
              {programme.programmeType === 'spend_and_reward' && (
                <FormField
                  id="loyalty-reward-description"
                  label="Free item"
                  helper="Name the item the customer receives after reaching the target."
                  placeholder="e.g. sandwich"
                  maxLength="240"
                  value={programme.rewardDescription}
                  error={errors.rewardDescription}
                  onChange={(value) => onChange('rewardDescription', value)}
                  requiredToPublish
                />
              )}
            </div>

            <TextAreaField
              id="loyalty-terms"
              label="Terms and conditions"
              helper="Add any limits, exclusions, or expiry rules."
              placeholder="e.g. One reward per customer. Not available with other offers."
              maxLength="1000"
              rows="4"
              value={programme.terms}
              error={errors.terms}
              onChange={(value) => onChange('terms', value)}
            />
          </section>

          <section aria-labelledby="loyalty-availability-title">
            <div className="loyalty-form-section-heading">
              <span aria-hidden="true">
                <CalendarDays />
              </span>
              <div>
                <h2 id="loyalty-availability-title">Availability</h2>
                <p>Choose when customers can use the programme.</p>
              </div>
            </div>

            <DateRangeCalendar
              id="loyalty-availability"
              label="Programme period"
              startLabel="Start date"
              endLabel="End date"
              startDate={programme.startDate}
              endDate={programme.endDate}
              startError={errors.startDate}
              endError={errors.endDate}
              onChange={(range) => {
                onChange('startDate', range.startDate)
                onChange('endDate', range.endDate)
              }}
              required
              endOptional
            />
          </section>

          <section aria-labelledby="loyalty-check-in-title">
            <div className="loyalty-form-section-heading">
              <span aria-hidden="true">
                <QrCode />
              </span>
              <div>
                <h3 id="loyalty-check-in-title">Redemption</h3>
                <p>How staff identify the customer and apply their reward.</p>
              </div>
            </div>
            <RedemptionMethodField
              label="Redemption method"
              ariaLabel="Customer-presented loyalty QR redemption method"
            >
              {LOYALTY_REDEMPTION_METHOD}
            </RedemptionMethodField>
          </section>
        </div>

        <aside
          className="deal-draft-rail loyalty-draft-preview deal-live-preview"
          aria-label="Draft summary"
        >
          <div className="deal-live-preview-heading">
            <strong>Customer Preview</strong>
          </div>
          <div className="loyalty-preview-heading">
            <span>
              <LockKeyhole aria-hidden="true" />
              Draft summary
            </span>
            <strong>{filledFields} of 5 details added</strong>
          </div>
          <div
            className="loyalty-preview-ticket"
            aria-label="Customer loyalty card preview"
          >
            <LoyaltyTicket
              program={previewProgram}
              progress={previewProgress}
              businessName={businessName || 'Your business'}
              isJoined
              isEnded={false}
              titleId="loyalty-preview-ticket-title"
            />
          </div>
          <div className="loyalty-preview-details">
            <p className="loyalty-field-helper">
              {getEarningRules(programme) ||
                'Complete the template details to preview the rules.'}
            </p>
            <p className="loyalty-preview-availability">
              <CalendarDays aria-hidden="true" />
              {formatAvailability(programme)}
            </p>
          </div>
        </aside>
      </div>

      <div className="loyalty-form-actions">
        <Button
          type="button"
          variant="secondary"
          onClick={onBack}
          disabled={isSaving}
        >
          Cancel
        </Button>
        <div className="loyalty-form-primary-actions">
          <Button variant="secondary" type="submit" disabled={isSaving}>
            <Save aria-hidden="true" />
            {isSaving ? 'Saving...' : 'Save draft'}
          </Button>
          <Button type="button" onClick={onReview} disabled={isSaving}>
            Review and publish
            <Send aria-hidden="true" />
          </Button>
        </div>
      </div>
    </form>
  )
}
