import DealForm from '../../features/deals/components/DealForm'
import DealList from '../../features/deals/components/DealList'
import DealReview from '../../features/deals/components/DealReview'
import useBusinessDeals from '../../features/deals/hooks/useBusinessDeals'
import '../../features/deals/CreateDeal.css'

export default function CreateDeal() {
  const deals = useBusinessDeals()

  return (
    <>
      <div className="page-header">
        <div className="page-header-eyebrow">Manage → Deals</div>
        <h2>{deals.step === 'list' ? 'Your Deals' : 'Create Deal'}</h2>
        <p>
          {deals.step === 'list'
            ? 'View and manage all your promotional deals.'
            : 'Set up a new promotional deal visible to local customers.'}
        </p>
      </div>
      {deals.step === 'list' && (
        <DealList
          deals={deals.deals}
          selectedDealId={deals.selectedDealId}
          successMessage={deals.successMessage}
          onCreate={deals.handleStartNewDeal}
          onSelect={deals.handleSelectDeal}
          onClose={deals.handleCloseDetails}
          onPublish={deals.handlePublishDeal}
          onEdit={deals.handleEditDeal}
        />
      )}
      {deals.step === 'review' && (
        <DealReview
          deal={deals.form}
          onBack={deals.handleBackToEdit}
          onConfirm={deals.handleConfirmPublish}
        />
      )}
      {deals.step === 'form' && (
        <DealForm
          deal={deals.form}
          errors={deals.errors}
          isEditing={Boolean(deals.editingDealId)}
          onChange={deals.setField}
          onBack={deals.handleBackToList}
          onSubmit={deals.handleReview}
        />
      )}
    </>
  )
}
