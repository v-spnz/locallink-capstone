import LoadingSpinner from '../../components/ui/LoadingSpinner'
import CustomerJobCard from '../../features/service-marketplace/components/CustomerJobCard'
import JobDetailPanel from '../../features/service-marketplace/components/JobDetailPanel'
import PostJobModal from '../../features/service-marketplace/components/PostJobModal'
import useCustomerJobs from '../../features/service-marketplace/hooks/useCustomerJobs'
import '../../features/service-marketplace/ServiceMarketplace.css'

export default function Jobs() {
  const marketplace = useCustomerJobs()

  const selectedJob = marketplace.postedJobs.find(
    (job) => job.id === marketplace.selectedJobId,
  )

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

      {!marketplace.isLoading && selectedJob && (
        <JobDetailPanel
          job={selectedJob}
          quotes={marketplace.quotesByJob[selectedJob.id] ?? []}
          respondingQuoteId={marketplace.respondingQuoteId}
          onBack={marketplace.closeJobDetail}
          onEdit={marketplace.openEditModal}
          onRepost={marketplace.openRepostModal}
          onQuoteResponse={marketplace.handleQuoteResponse}
        />
      )}

      {!marketplace.isLoading && !selectedJob && marketplace.postedJobs.length > 0 && (
        <div className="customer-job-list sm-job-grid">
          {marketplace.postedJobs.map((job) => (
            <CustomerJobCard
              key={job.id}
              job={job}
              quoteCount={(marketplace.quotesByJob[job.id] ?? []).length}
              onSelect={(selected) => marketplace.openJobDetail(selected.id)}
            />
          ))}
        </div>
      )}
    </>
  )
}
