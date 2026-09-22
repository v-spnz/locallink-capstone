import ActionToast from '../../components/ui/ActionToast'
import LoyaltyActivityFeed from '../../features/loyalty/components/LoyaltyActivityFeed'
import LoyaltyDraftForm from '../../features/loyalty/components/LoyaltyDraftForm'
import LoyaltyDraftList, {
  LoyaltyDraftListSkeleton,
} from '../../features/loyalty/components/LoyaltyDraftList'
import LoyaltyProgrammeReview from '../../features/loyalty/components/LoyaltyProgrammeReview'
import useBusinessLoyaltyActivity from '../../features/loyalty/hooks/useBusinessLoyaltyActivity'
import useBusinessLoyaltyProgrammes from '../../features/loyalty/hooks/useBusinessLoyaltyProgrammes'
import '../../features/loyalty/BusinessLoyalty.css'
import '../../features/deals/CreateDeal.css'

export default function CreateLoyalty() {
  const loyalty = useBusinessLoyaltyProgrammes()
  const activity = useBusinessLoyaltyActivity()

  return (
    <div className="business-loyalty-page business-deals-page">
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
        <>
          <LoyaltyDraftList
            programmes={loyalty.visibleProgrammes}
            programmeCounts={loyalty.programmeCounts}
            activeStatus={loyalty.activeStatus}
            onStatusChange={loyalty.setActiveStatus}
            onCreate={loyalty.handleStartNewProgramme}
            onEdit={loyalty.handleEditProgramme}
          />
          <LoyaltyActivityFeed
            activity={activity.activity}
            isLoading={activity.isLoading}
            requestError={activity.requestError}
            onRefresh={activity.loadActivity}
          />
        </>
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
