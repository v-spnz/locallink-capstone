import {
  CalendarDays,
  CircleDollarSign,
  Gift,
  QrCode,
  Stamp,
} from 'lucide-react'
import DateRangeCalendar from '../../../components/ui/DateRangeCalendar'
import RedemptionMethodField from '../../../components/ui/RedemptionMethodField'
import {
  MAX_COUNT_BASED_REWARD_THRESHOLD,
  sanitizeRewardThreshold,
} from '../businessLoyaltyValidation'
import {
  isCountBasedLoyaltyType,
  LOYALTY_REDEMPTION_METHOD,
  LOYALTY_TEMPLATES,
} from '../businessLoyaltyTemplates'
import DiscountPercentageCombobox from './DiscountPercentageCombobox'
import {
  FieldError,
  FormField,
  ProgrammeImageField,
  TextAreaField,
} from './LoyaltyFormFields'

export function ProgrammeBasicsSection({
  programme,
  errors,
  onChange,
  onImageChange,
  onImageRemove,
  imagePreviewUrl,
}) {
  return (
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
                  programme.programmeType === option.value ? 'is-selected' : ''
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
  )
}

export function RewardAndEarningSection({ programme, errors, onChange }) {
  return (
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
              ? `Maximum ${MAX_COUNT_BASED_REWARD_THRESHOLD}`
              : programme.programmeType === 'visit_card'
                ? `Maximum ${MAX_COUNT_BASED_REWARD_THRESHOLD}`
                : programme.programmeType
                  ? 'Amount the customer must spend, in dollars.'
                  : 'Choose a programme template above.'
          }
          placeholder="e.g. 8"
          inputMode="decimal"
          prefix={
            !isCountBasedLoyaltyType(programme.programmeType) ? '$' : undefined
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
  )
}

export function LoyaltyAvailabilitySection({ programme, errors, onChange }) {
  return (
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
  )
}

export function LoyaltyRedemptionSection() {
  return (
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
  )
}
