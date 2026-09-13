import ActionToast from '../../components/ui/ActionToast'
import LoyaltyDraftForm from '../../features/loyalty/components/LoyaltyDraftForm'
import LoyaltyDraftList, {
  LoyaltyDraftListSkeleton,
} from '../../features/loyalty/components/LoyaltyDraftList'
import LoyaltyProgrammeReview from '../../features/loyalty/components/LoyaltyProgrammeReview'
import useBusinessLoyaltyProgrammes from '../../features/loyalty/hooks/useBusinessLoyaltyProgrammes'
import '../../features/loyalty/BusinessLoyalty.css'

export default function CreateLoyalty() {
  const loyalty = useBusinessLoyaltyProgrammes()

  return (
    <div className="business-loyalty-page">
      <header className="page-header business-loyalty-heading">
        <h1>
          {loyalty.step === 'form'
            ? loyalty.form.id
              ? 'Edit loyalty programme'
              : 'Create a loyalty programme'
            : loyalty.step === 'review'
              ? 'Review loyalty programme'
              : 'Loyalty programmes'}
        </h1>
        {loyalty.step === 'form' && (
          <p>Build the programme at your pace and save it privately.</p>
        )}
        {loyalty.step === 'review' && (
          <p>Confirm the reward details before customers can see them.</p>
        )}
      </header>

      {loyalty.isLoading && <LoyaltyDraftListSkeleton />}

      {!loyalty.isLoading &&
        loyalty.requestError &&
        loyalty.step === 'list' && (
          <div className="auth-error loyalty-request-error" role="alert">
            {loyalty.requestError}
            <button type="button" onClick={loyalty.loadProgrammes}>
              Try again
            </button>
          </div>
        )}

      {!loyalty.isLoading && loyalty.step === 'list' && (
        <LoyaltyDraftList
          programmes={loyalty.visibleProgrammes}
          programmeCounts={loyalty.programmeCounts}
          activeStatus={loyalty.activeStatus}
          onStatusChange={loyalty.setActiveStatus}
          onCreate={loyalty.handleStartNewProgramme}
          onEdit={loyalty.handleEditProgramme}
        />
      )}

      {loyalty.step === 'form' && (
        <LoyaltyDraftForm
          programme={loyalty.form}
          errors={loyalty.errors}
          isSaving={loyalty.isSaving}
          requestError={loyalty.requestError}
          reviewAttempted={loyalty.reviewAttempted}
          onChange={loyalty.setField}
          onBack={loyalty.handleBackToList}
          onReview={loyalty.handleReview}
          onSaveDraft={loyalty.handleSaveDraft}
        />
      )}

      {loyalty.step === 'review' && (
        <LoyaltyProgrammeReview
          programme={loyalty.form}
          isSaving={loyalty.isSaving}
          requestError={loyalty.requestError}
          onBack={loyalty.handleBackToEdit}
          onConfirm={loyalty.handleConfirmPublish}
        />
      )}

      {loyalty.feedback && (
        <ActionToast
          message={loyalty.feedback.message}
          variant={loyalty.feedback.variant}
          onDismiss={loyalty.dismissFeedback}
        />
      )}
    </div>
  )
}
