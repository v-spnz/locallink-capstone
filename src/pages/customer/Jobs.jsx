import LoadingSpinner from '../../components/ui/LoadingSpinner'
import CustomerJobCard from '../../features/service-marketplace/components/CustomerJobCard'
import JobRequestForm from '../../features/service-marketplace/components/JobRequestForm'
import JobRequestReview from '../../features/service-marketplace/components/JobRequestReview'
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

      {marketplace.step === 'form' && (
        <JobRequestForm
          form={marketplace.form}
          errors={marketplace.errors}
          suburbOptions={marketplace.suburbOptions}
          successMessage={marketplace.successMessage}
          onChange={marketplace.setField}
          onSubmit={marketplace.handleReview}
        />
      )}
      {marketplace.step === 'review' && marketplace.pendingJob && (
        <JobRequestReview
          job={marketplace.pendingJob}
          isSaving={marketplace.isSaving}
          onBack={marketplace.handleBackToEdit}
          onConfirm={marketplace.handleConfirmPost}
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
                onEdit={marketplace.handleEditJob}
                onRepost={marketplace.handleRepostJob}
                onQuoteResponse={marketplace.handleQuoteResponse}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
