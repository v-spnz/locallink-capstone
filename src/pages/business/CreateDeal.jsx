import DealForm from '../../features/deals/components/DealForm'
import DealList, {
  DealListSkeleton,
} from '../../features/deals/components/DealList'
import DealReview from '../../features/deals/components/DealReview'
import DealRedemptionPanel from '../../features/deals/components/DealRedemptionPanel'
import useBusinessDeals from '../../features/deals/hooks/useBusinessDeals'
import useBusinessDealRedemption from '../../features/deals/hooks/useBusinessDealRedemption'
import ActionToast from '../../components/ui/ActionToast'
import UnsavedChangesDialog from '../../components/ui/UnsavedChangesDialog'
import { useSearchParams } from 'react-router-dom'
import '../../features/deals/CreateDeal.css'
import '../../features/deals/DealRedemption.css'

export default function CreateDeal() {
  const [searchParams] = useSearchParams()
  const deals = useBusinessDeals()
  const redemption = useBusinessDealRedemption({ loadRecords: false })
  const pageHeading =
    deals.step === 'list'
      ? 'Your deals'
      : deals.step === 'review'
        ? 'Review your deal'
        : deals.editingDealId
          ? 'Edit deal'
          : 'Create a deal'
  const pageIntroduction =
    deals.step === 'list'
      ? ''
      : deals.step === 'review'
        ? 'Check the customer-facing details before the deal goes live.'
        : deals.editingDealId
          ? ''
          : 'Shape the offer, set its dates, and preview it as you work.'

  return (
    <div className="business-deals-page">
      <div className="page-header business-deals-heading">
        <h1>{pageHeading}</h1>
        {pageIntroduction && <p>{pageIntroduction}</p>}
      </div>
      {deals.isLoading && <DealListSkeleton />}
      {!deals.isLoading && deals.requestError && deals.step === 'list' && (
        <div className="auth-error deal-request-error" role="alert">
          {deals.requestError}
          <button type="button" onClick={deals.reload}>
            Try again
          </button>
        </div>
      )}
      {!deals.isLoading && deals.step === 'list' && (
        <>
          <DealRedemptionPanel
            redemption={redemption}
            openScannerOnLoad={searchParams.get('redeem') === 'scan'}
          />
          <DealList
            deals={deals.deals}
            selectedDealId={deals.selectedDealId}
            deleteConfirmationId={deals.deleteConfirmationId}
            deletingDealId={deals.deletingDealId}
            cancelingDealId={deals.cancelingDealId}
            onCreate={deals.handleStartNewDeal}
            onSelect={deals.handleSelectDeal}
            onClose={deals.handleCloseDetails}
            onEdit={deals.handleEditDeal}
            onRequestDelete={deals.setDeleteConfirmationId}
            onCancelDeleteRequest={() => deals.setDeleteConfirmationId(null)}
            onConfirmDelete={deals.handleDeleteDraft}
            onCancelScheduling={deals.handleCancelScheduledPublication}
            endingDealId={deals.endingDealId}
            onRequestEnd={deals.handleGetEndSummary}
            onEnd={deals.handleEndDeal}
          />
        </>
      )}
      {deals.step === 'review' && (
        <DealReview
          deal={deals.form}
          locations={deals.locations}
          isSaving={deals.isSaving}
          requestError={deals.requestError}
          onBack={deals.handleBackToEdit}
          onConfirm={deals.handleConfirmPublish}
        />
      )}
      {deals.step === 'form' && (
        <DealForm
          deal={deals.form}
          errors={deals.errors}
          locations={deals.locations}
          isEditing={Boolean(deals.editingDealId)}
          isSaving={deals.isSaving}
          requestError={deals.requestError}
          onChange={deals.setField}
          onImageChange={deals.setImage}
          onBack={deals.handleBackToList}
          onSaveDraft={deals.handleSaveDraft}
          onSubmit={deals.handleReview}
        />
      )}
      {deals.feedback && (
        <ActionToast
          message={deals.feedback.message}
          variant={deals.feedback.variant}
          onDismiss={deals.dismissFeedback}
        />
      )}
      {deals.isLeaveConfirmationOpen && (
        <UnsavedChangesDialog
          itemName="deal draft"
          isSaving={deals.isSaving}
          onCancel={deals.cancelLeave}
          onDiscard={deals.discardAndLeave}
          onSave={deals.saveDraftAndLeave}
        />
      )}
    </div>
  )
}
