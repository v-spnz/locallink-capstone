import LoadingSpinner from '../../components/ui/LoadingSpinner'
import CustomerJobCard from '../../features/service-marketplace/components/CustomerJobCard'
import PostJobModal from '../../features/service-marketplace/components/PostJobModal'
import useCustomerJobs from '../../features/service-marketplace/hooks/useCustomerJobs'
import '../../features/service-marketplace/ServiceMarketplace.css'

export default function Jobs() {
  const marketplace = useCustomerJobs()

  return (
    <>
      <div className="page-header">
        <h2>Services</h2>
        <p>
          Post a job and receive quotes from local tradespeople in your area.
        </p>
      </div>

      <div className="placeholder-section">
        <div className="placeholder-section-title is-complete">
          Ready to get quotes?
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>
          Post a job in a few quick steps and local tradespeople will send you
          quotes.
        </p>
        <button
          type="button"
          className="btn-primary"
          onClick={marketplace.openPostModal}
        >
          Post a Job
        </button>
        {marketplace.successMessage && (
          <p style={{ color: 'seagreen', marginTop: 10 }}>
            {marketplace.successMessage}
          </p>
        )}
      </div>

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

      <div className="placeholder-section">
        <div
          className={`job-status-header ${
            marketplace.jobStatus === 'Not Posted' ? 'is-empty' : ''
          }`}
        >
          Job Status: {marketplace.jobStatus}
        </div>
        {marketplace.requestError && (
          <div className="auth-error" role="alert">
            {marketplace.requestError}
          </div>
        )}
        {marketplace.isLoading && <LoadingSpinner label="Loading your jobs…" />}
        {!marketplace.isLoading && marketplace.postedJobs.length > 0 && (
          <div className="customer-job-list">
            {marketplace.postedJobs.map((job) => (
              <CustomerJobCard
                key={job.id}
                job={job}
                quotes={marketplace.quotesByJob[job.id] ?? []}
                respondingQuoteId={marketplace.respondingQuoteId}
                onEdit={marketplace.openEditModal}
                onRepost={marketplace.openRepostModal}
                onQuoteResponse={marketplace.handleQuoteResponse}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}