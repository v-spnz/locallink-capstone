import DealForm from '../../features/deals/components/DealForm'
import DealList from '../../features/deals/components/DealList'
import DealReview from '../../features/deals/components/DealReview'
import useBusinessDeals from '../../features/deals/hooks/useBusinessDeals'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import '../../features/deals/CreateDeal.css'

export default function CreateDeal() {
  const deals = useBusinessDeals()

  return (
    <div className="business-deals-page">
      <div className="page-header">
        <h1>{deals.step === 'list' ? 'Your deals' : 'Create a deal'}</h1>
      </div>
      {deals.isLoading && <LoadingSpinner label="Loading deals…" />}
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
