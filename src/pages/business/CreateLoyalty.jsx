import ActionToast from '../../components/ui/ActionToast'
import UnsavedChangesDialog from '../../components/ui/UnsavedChangesDialog'
import LoyaltyDraftForm from '../../features/loyalty/components/LoyaltyDraftForm'
import LoyaltyDraftList, {
  LoyaltyDraftListSkeleton,
} from '../../features/loyalty/components/LoyaltyDraftList'
import LoyaltyProgrammeReview from '../../features/loyalty/components/LoyaltyProgrammeReview'
import useBusinessLoyaltyProgrammes from '../../features/loyalty/hooks/useBusinessLoyaltyProgrammes'
import '../../features/loyalty/BusinessLoyalty.css'
import '../../features/deals/CreateDeal.css'

export default function CreateLoyalty() {
  const loyalty = useBusinessLoyaltyProgrammes()

  return (
    <div className="business-loyalty-page business-deals-page">
      <header className="page-header business-loyalty-heading">
        <h1>
          {loyalty.step === 'list'
            ? 'Your loyalty programmes'
            : loyalty.step === 'form'
              ? loyalty.form.id
                ? 'Edit programme'
                : 'Create a loyalty programme'
              : 'Review your loyalty programme'}
        </h1>
        {loyalty.step !== 'list' && (
          <>
            {loyalty.step === 'form' && !loyalty.form.id && (
              <p>
                Shape the reward, set its dates, and preview it as you work.
              </p>
            )}
            {loyalty.step === 'review' && (
              <p>
                Check the customer-facing details before the programme goes
                live.
              </p>
            )}
          </>
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
      {loyalty.isLeaveConfirmationOpen && (
        <UnsavedChangesDialog
          itemName="loyalty programme draft"
          isSaving={loyalty.isSaving}
          onCancel={loyalty.cancelLeave}
          onDiscard={loyalty.discardAndLeave}
          onSave={loyalty.saveDraftAndLeave}
        />
      )}
    </div>
  )
}
