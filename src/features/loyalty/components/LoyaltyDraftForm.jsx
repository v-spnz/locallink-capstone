import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronRight,
  CircleDollarSign,
  Gift,
  LockKeyhole,
  QrCode,
  Stamp,
} from 'lucide-react'
import Button from '../../../components/ui/Button'
import DateRangeCalendar from '../../../components/ui/DateRangeCalendar'
import RedemptionMethodField from '../../../components/ui/RedemptionMethodField'
import { sanitizeRewardThreshold } from '../businessLoyaltyValidation'
import DiscountPercentageCombobox from './DiscountPercentageCombobox'
import {
  getCustomerReward,
  getEarningRules,
  getProgrammeTypeLabel,
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
        {prefix && <span aria-hidden="true">{prefix}</span>}
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
  const rewardIsComplete = Boolean(
    programme.rewardThreshold &&
    (programme.programmeType === 'stamp_card' ||
      (programme.programmeType === 'spend_and_save' && programme.rewardValue) ||
      (programme.programmeType === 'spend_and_reward' &&
        programme.rewardDescription)),
  )
  const sectionProgress = [
    {
      id: 'loyalty-basics-section',
      label: 'Programme basics',
      icon: Gift,
      isComplete: Boolean(programme.name && programme.programmeType),
    },
    {
      id: 'loyalty-reward-section',
      label: 'Reward and earning',
      icon: Stamp,
      isComplete: rewardIsComplete,
    },
    {
      id: 'loyalty-availability-section',
      label: 'Availability',
      icon: CalendarDays,
      isComplete: Boolean(programme.startDate),
    },
    {
      id: 'loyalty-check-in-section',
      label: 'Customer check-in',
      icon: QrCode,
      isComplete: true,
    },
  ]
  const completedSections = sectionProgress.filter(
    (section) => section.isComplete,
  ).length

  return (
    <form
      className="deal-form loyalty-draft-form"
      onSubmit={onReview}
      noValidate
    >
      <div className="deal-form-toolbar">
        <Button variant="secondary" className="deal-back" onClick={onBack}>
          <ArrowLeft aria-hidden="true" />
          Back to programmes
        </Button>
        <span className="deal-draft-state">
          <LockKeyhole aria-hidden="true" />
          Private draft
        </span>
      </div>

      <div className="deal-form-heading">
        <h2>Draft your loyalty programme</h2>
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

      <div className="deal-form-workspace">
        <aside
          className="deal-draft-rail"
          aria-label="Loyalty programme draft overview"
        >
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

          <nav className="deal-draft-nav" aria-label="Programme sections">
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
            <div className="deal-live-preview-media loyalty-live-preview-media">
              <div className="deal-live-preview-placeholder">
                <Gift aria-hidden="true" />
                <span>Your loyalty programme</span>
              </div>
            </div>
            <div className="deal-live-preview-body">
              <span className="deal-live-preview-category">
                {getProgrammeTypeLabel(programme.programmeType)}
              </span>
              <h3>{programme.name || 'Your programme name'}</h3>
              <strong className="deal-live-preview-offer">
                {getCustomerReward(programme) || 'Your reward will appear here'}
              </strong>
              <div className="deal-live-preview-detail">
                <Stamp aria-hidden="true" />
                <span>
                  {getEarningRules(programme) ||
                    'Earning rules will appear here'}
                </span>
              </div>
              <div className="deal-live-preview-detail">
                <CalendarDays aria-hidden="true" />
                <span>{formatAvailability(programme)}</span>
              </div>
            </div>
          </article>
        </aside>

        <div className="deal-form-content">
          <section
            className="deal-form-section"
            id="loyalty-basics-section"
            aria-labelledby="loyalty-basics-title"
          >
            <div className="deal-form-section-heading">
              <span aria-hidden="true">
                <Gift />
              </span>
              <div>
                <h3 id="loyalty-basics-title">Programme basics</h3>
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

          <section
            className="deal-form-section"
            id="loyalty-reward-section"
            aria-labelledby="loyalty-reward-title"
          >
            <div className="deal-form-section-heading">
              <span aria-hidden="true">
                <Stamp />
              </span>
              <div>
                <h3 id="loyalty-reward-title">Reward and earning rules</h3>
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
                  programme.programmeType &&
                  programme.programmeType !== 'stamp_card'
                    ? '$'
                    : undefined
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

          <section
            className="deal-form-section"
            id="loyalty-availability-section"
            aria-labelledby="loyalty-availability-title"
          >
            <div className="deal-form-section-heading">
              <span aria-hidden="true">
                <CalendarDays />
              </span>
              <div>
                <h3 id="loyalty-availability-title">Availability</h3>
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

          <section
            className="deal-form-section"
            id="loyalty-check-in-section"
            aria-labelledby="loyalty-check-in-title"
          >
            <div className="deal-form-section-heading">
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
      </div>

      <div className="deal-form-actions">
        <span className="deal-form-actions-note">
          <LockKeyhole aria-hidden="true" />
          Customers cannot see or use this programme while it is a draft.
        </span>
        <div>
          <Button variant="secondary" onClick={onSaveDraft} disabled={isSaving}>
            {isSaving ? 'Saving…' : 'Save draft'}
          </Button>
          <Button type="submit" disabled={isSaving}>
            Review and publish
          </Button>
        </div>
      </div>
    </form>
  )
}
