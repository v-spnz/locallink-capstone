import LoadingSpinner from '../../components/ui/LoadingSpinner'
import CustomerJobCard from '../../features/service-marketplace/components/CustomerJobCard'
import JobDetailPanel from '../../features/service-marketplace/components/JobDetailPanel'
import PostJobModal from '../../features/service-marketplace/components/PostJobModal'
import QuoteJobSidebar from '../../features/service-marketplace/components/QuoteJobSidebar'
import QuoteList from '../../features/service-marketplace/components/QuoteList'
import useCustomerJobs from '../../features/service-marketplace/hooks/useCustomerJobs'
import '../../features/service-marketplace/ServiceMarketplace.css'

export default function Jobs() {
  const marketplace = useCustomerJobs()

  const selectedJob = marketplace.postedJobs.find(
    (job) => job.id === marketplace.selectedJobId,
  )
  const selectedQuoteJob = marketplace.postedJobs.find(
    (job) => job.id === marketplace.selectedQuoteJobId,
  )
  const totalQuoteCount = Object.values(marketplace.quotesByJob).reduce(
    (total, list) => total + list.length,
    0,
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
          quoteCount={(marketplace.quotesByJob[selectedJob.id] ?? []).length}
          isConfirmingCompletion={
            marketplace.confirmingJobId === selectedJob.id
          }
          onBack={marketplace.closeJobDetail}
          onEdit={marketplace.openEditModal}
          onRepost={marketplace.openRepostModal}
          onDelete={marketplace.handleDeleteJob}
          onViewQuotes={marketplace.viewQuotesForJob}
          onConfirmCompletion={marketplace.handleConfirmCompletion}
        />
      )}

      {!marketplace.isLoading && !selectedJob && (
        <>
          <div className="sm-tabs">
            <button
              type="button"
              className={`sm-tab${marketplace.activeTab === 'jobs' ? ' sm-tab--active' : ''}`}
              onClick={() => marketplace.switchTab('jobs')}
            >
              My Jobs
              <span className="sm-tab-count">
                {marketplace.postedJobs.length}
              </span>
            </button>
            <button
              type="button"
              className={`sm-tab${marketplace.activeTab === 'quotes' ? ' sm-tab--active' : ''}`}
              onClick={() => marketplace.switchTab('quotes')}
            >
              Quotes
              <span className="sm-tab-count">{totalQuoteCount}</span>
            </button>
          </div>

          {marketplace.activeTab === 'jobs' &&
            marketplace.postedJobs.length > 0 && (
              <div className="customer-job-list sm-job-grid">
                {marketplace.postedJobs.map((job) => (
                  <CustomerJobCard
                    key={job.id}
                    job={job}
                    quoteCount={(marketplace.quotesByJob[job.id] ?? []).length}
                    onSelect={(selected) =>
                      marketplace.openJobDetail(selected.id)
                    }
                  />
                ))}
              </div>
            )}

          {marketplace.activeTab === 'quotes' && (
            <div className="sm-quotes-layout">
              <QuoteJobSidebar
                jobs={marketplace.postedJobs}
                quotesByJob={marketplace.quotesByJob}
                selectedJobId={marketplace.selectedQuoteJobId}
                onSelect={marketplace.selectQuoteJob}
              />
              <div>
                {selectedQuoteJob ? (
                  <QuoteList
                    jobId={selectedQuoteJob.id}
                    jobStatus={selectedQuoteJob.status}
                    quotes={marketplace.quotesByJob[selectedQuoteJob.id] ?? []}
                    respondingQuoteId={marketplace.respondingQuoteId}
                    onRespond={marketplace.handleQuoteResponse}
                    onViewJob={marketplace.openJobDetail}
                  />
                ) : (
                  <p className="sm-empty-sub">
                    Select a job to see its quotes.
                  </p>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </>
  )
}