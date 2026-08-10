import LoadingSpinner from '../../components/ui/LoadingSpinner'
import CustomerJobCard from '../../features/service-marketplace/components/CustomerJobCard'
import PostJobModal from '../../features/service-marketplace/components/PostJobModal'
import useCustomerJobs from '../../features/service-marketplace/hooks/useCustomerJobs'
import '../../features/service-marketplace/ServiceMarketplace.css'

export default function Jobs() {
  const marketplace = useCustomerJobs()

  return (
    <>
      <div className="page-header sm-page-head">
        <div>
          <h2>Service Marketplace</h2>
          <p>Find trusted local help for your next job</p>
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={marketplace.openPostModal}
        >
          + Post a Service Job
        </button>
      </div>

      {marketplace.successMessage && (
        <p style={{ color: 'seagreen', marginBottom: 14 }}>
          {marketplace.successMessage}
        </p>
      )}

      {marketplace.isModalOpen && (
        <PostJobModal
          initialJob={marketplace.modalInitialJob}
          initialStep={marketplace.modalInitialStep}
          onClose={marketplace.closeModal}
          onSubmit={marketplace.handleSubmitJob}
          isSaving={marketplace.isSaving}
          submitError={marketplace.modalError}
        />
      )}

      {marketplace.requestError && (
        <div className="auth-error" role="alert">
          {marketplace.requestError}
        </div>
      )}

      {marketplace.isLoading && <LoadingSpinner label="Loading your jobs…" />}

      {!marketplace.isLoading && marketplace.postedJobs.length > 0 && (
        <div className="customer-job-list sm-job-grid">
          {marketplace.postedJobs.map((job) => (
            <CustomerJobCard
              key={job.id}
              job={job}
              quoteCount={(marketplace.quotesByJob[job.id] ?? []).length}
              onSelect={() => {}}
            />
          ))}
        </div>
      )}
    </>
  )
}
