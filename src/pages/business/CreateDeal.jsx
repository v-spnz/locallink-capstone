import DealForm from '../../features/deals/components/DealForm'
import DealList, {
  DealListSkeleton,
} from '../../features/deals/components/DealList'
import DealReview from '../../features/deals/components/DealReview'
import useBusinessDeals from '../../features/deals/hooks/useBusinessDeals'
import '../../features/deals/CreateDeal.css'

export default function CreateDeal() {
  const deals = useBusinessDeals()
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
      ? 'Create and manage offers for nearby customers.'
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
        <DealList
          deals={deals.deals}
          selectedDealId={deals.selectedDealId}
          successMessage={deals.successMessage}
          onCreate={deals.handleStartNewDeal}
          onSelect={deals.handleSelectDeal}
          onClose={deals.handleCloseDetails}
          onEdit={deals.handleEditDeal}
        />
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
    </div>
  )
}
