import GstIncluded from '../../../components/ui/GstIncluded'
import { sanitizeDealMoney, sanitizeDealPercentage } from '../validation'
import { FormField } from './DealFormFields'

export default function DealOfferFields({ deal, errors, onChange }) {
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
