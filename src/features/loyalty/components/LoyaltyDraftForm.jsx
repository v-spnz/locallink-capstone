import {
  ArrowLeft,
  CalendarDays,
  CircleDollarSign,
  Gift,
  LockKeyhole,
  QrCode,
  Save,
  Send,
  Stamp,
} from 'lucide-react'
import Button from '../../../components/ui/Button'
import DateRangeCalendar from '../../../components/ui/DateRangeCalendar'
import { sanitizeRewardThreshold } from '../businessLoyaltyValidation'
import {
  getCustomerReward,
  getEarningRules,
  getProgrammeAvailability,
  getProgrammeTypeLabel,
  getRewardTarget,
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
  onBack,
  onReview,
  onSaveDraft,
}) {
  const filledFields = [
    programme.name,
    programme.programmeType,
    programme.rewardThreshold,
    programme.programmeType === 'spend_and_save'
      ? programme.rewardValue
      : programme.programmeType === 'spend_and_reward'
        ? programme.rewardDescription
        : programme.programmeType === 'stamp_card',
    programme.startDate,
  ].filter(Boolean).length
  const availabilityOnPublish = programme.startDate
    ? getProgrammeAvailability({ ...programme, status: 'published' })
    : null

  return (
    <form className="deal-form loyalty-draft-form" onSubmit={onSaveDraft} noValidate>
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

            <fieldset className="loyalty-type-fieldset">
              <legend className="form-label">
                How customers earn
                <span className="loyalty-required">Required to publish</span>
              </legend>
              <div className="loyalty-type-options">
                {LOYALTY_TEMPLATES.map((option) => {
                  const Icon =
                    option.value === 'stamp_card' ? Stamp : CircleDollarSign
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
                  programme.programmeType === 'stamp_card'
                    ? 'Number of eligible purchases or visits.'
                    : programme.programmeType
                      ? 'Amount the customer must spend, in dollars.'
                      : 'Choose a programme template above.'
                }
                placeholder="e.g. 8"
                inputMode="decimal"
                prefix={
                  programme.programmeType !== 'stamp_card' ? '$' : undefined
                }
                value={programme.rewardThreshold}
                error={errors.rewardThreshold}
                onChange={(value) =>
                  onChange(
                    'rewardThreshold',
                    programme.programmeType === 'stamp_card'
                      ? sanitizeRewardThreshold(value).split('.')[0]
                      : sanitizeRewardThreshold(value),
                  )
                }
                requiredToPublish
              />
              {programme.programmeType === 'spend_and_save' && (
                <FormField
                  id="loyalty-reward-value"
                  label="Discount amount ($)"
                  helper="The discount cannot exceed the spend target."
                  placeholder="e.g. 5"
                  inputMode="decimal"
                  prefix={
                    programme.programmeType !== 'stamp_card' ? '$' : undefined
                  }
                  value={programme.rewardValue}
                  error={errors.rewardValue}
                  onChange={(value) =>
                    onChange('rewardValue', sanitizeRewardThreshold(value))
                  }
                  requiredToPublish
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
                <h2 id="loyalty-check-in-title">Customer check-in</h2>
                <p>The identification method staff will use at the counter.</p>
              </div>
            </div>
            <div className="loyalty-fixed-check-in">
              <QrCode aria-hidden="true" />
              <div>
                <strong>Customer-presented loyalty QR</strong>
                <p>
                  Customers show a programme-specific QR code. Staff scan it to
                  open the correct loyalty record, with a manual code fallback.
                </p>
              </div>
            </div>
          </section>
        </div>

        <aside className="deal-draft-rail loyalty-draft-preview deal-live-preview" aria-label="Draft summary">
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
          <div className="loyalty-preview-programme">
            <span className="loyalty-preview-icon" aria-hidden="true">
              <Gift />
            </span>
            <small>{getProgrammeTypeLabel(programme.programmeType)}</small>
            <h3>{programme.name || 'Untitled programme'}</h3>
            <p>{getRewardTarget(programme)}</p>
          </div>
          <div className="loyalty-preview-reward">
            <span>Customer reward</span>
            <strong>
              {getCustomerReward(programme) || 'Add the reward details'}
            </strong>
          </div>
          <p className="loyalty-field-helper">
            {getEarningRules(programme) ||
              'Complete the template details to preview the rules.'}
          </p>
          <p className="loyalty-preview-availability">
            <CalendarDays aria-hidden="true" />
            {formatAvailability(programme)}
          </p>
          {availabilityOnPublish && (
            <p className="loyalty-preview-note">
              Once published: <strong>{availabilityOnPublish.label}</strong>.{' '}
              {availabilityOnPublish.description}
            </p>
          )}
          <p className="loyalty-preview-note">
            Customers cannot see or use this programme while it is a draft.
          </p>
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
