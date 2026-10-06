import { ArrowLeft, LockKeyhole, Save, Send } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import Button from '../../../components/ui/Button'
import LoyaltyProgrammePreview from './LoyaltyProgrammePreview'
import {
  LoyaltyAvailabilitySection,
  LoyaltyRedemptionSection,
  ProgrammeBasicsSection,
  RewardAndEarningSection,
} from './LoyaltyFormSections'

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
          <ProgrammeBasicsSection
            programme={programme}
            errors={errors}
            onChange={onChange}
            onImageChange={onImageChange}
            onImageRemove={onImageRemove}
            imagePreviewUrl={imagePreviewUrl}
          />
          <RewardAndEarningSection
            programme={programme}
            errors={errors}
            onChange={onChange}
          />
          <LoyaltyAvailabilitySection
            programme={programme}
            errors={errors}
            onChange={onChange}
          />
          <LoyaltyRedemptionSection />
        </div>

        <LoyaltyProgrammePreview
          programme={programme}
          businessName={businessName}
        />
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
