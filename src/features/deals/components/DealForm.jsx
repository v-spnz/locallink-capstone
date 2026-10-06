import { useEffect, useMemo } from 'react'
import { ArrowLeft, LockKeyhole } from 'lucide-react'
import Button from '../../../components/ui/Button'
import DealDraftOverview from './DealDraftOverview'
import {
  DealAvailabilitySection,
  DealBasicsSection,
  DealOfferSection,
  DealRedemptionSection,
} from './DealFormSections'

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
        <DealDraftOverview
          deal={deal}
          locations={locations}
          previewUrl={previewUrl}
        />
        <div className="deal-form-content">
          <DealBasicsSection
            deal={deal}
            errors={errors}
            onChange={onChange}
            onImageChange={onImageChange}
            previewUrl={previewUrl}
          />
          <DealOfferSection deal={deal} errors={errors} onChange={onChange} />
          <DealAvailabilitySection
            deal={deal}
            errors={errors}
            locations={locations}
            onChange={onChange}
          />
          <DealRedemptionSection
            deal={deal}
            errors={errors}
            onChange={onChange}
          />
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
