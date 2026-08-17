import LoadingSpinner from '../../components/ui/LoadingSpinner'
import CustomerJobCard from '../../features/service-marketplace/components/CustomerJobCard'
import JobDetailPanel from '../../features/service-marketplace/components/JobDetailPanel'
import PostJobModal from '../../features/service-marketplace/components/PostJobModal'
import QuoteJobSidebar from '../../features/service-marketplace/components/QuoteJobSidebar'
import QuoteList from '../../features/service-marketplace/components/QuoteList'
import useCustomerJobs from '../../features/service-marketplace/hooks/useCustomerJobs'
import '../../features/service-marketplace/ServiceMarketplace.css'
import PastJobRow from '../../features/service-marketplace/components/PastJobRow'

import {
  getRepeatBusinessIds,
  getActiveQuoteCount,
} from '../../features/service-marketplace/formatters'

export default function Jobs() {
  const marketplace = useCustomerJobs()

  const selectedJob = marketplace.postedJobs.find(
    (job) => job.id === marketplace.selectedJobId,
  )
  const selectedQuoteJob = marketplace.postedJobs.find(
    (job) => job.id === marketplace.selectedQuoteJobId,
  )

  const activeJobs = marketplace.postedJobs.filter(
    (job) => job.status !== 'completed',
  )
  const pastJobs = marketplace.postedJobs.filter(
    (job) => job.status === 'completed',
  )
  const selectedQuoteList =
    selectedQuoteJob && marketplace.selectedQuoteId
      ? (marketplace.quotesByJob[selectedQuoteJob.id] ?? []).filter(
          (quote) => quote.quote_id === marketplace.selectedQuoteId,
        )
      : (marketplace.quotesByJob[selectedQuoteJob?.id ?? ''] ?? [])

  const repeatBusinessIds = selectedQuoteJob
    ? getRepeatBusinessIds(marketplace.quotesByJob, selectedQuoteJob.id)
    : new Set()

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
          quoteCount={getActiveQuoteCount(
            marketplace.quotesByJob[selectedJob.id] ?? [],
          )}
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
              <span className="sm-tab-count">{activeJobs.length}</span>
            </button>
            <button
              type="button"
              className={`sm-tab${marketplace.activeTab === 'quotes' ? ' sm-tab--active' : ''}`}
              onClick={() => marketplace.switchTab('quotes')}
            >
              Quotes
            </button>
          </div>

          {marketplace.activeTab === 'jobs' && (
            <>
              {activeJobs.length > 0 && (
                <div className="customer-job-list sm-job-grid">
                  {activeJobs.map((job) => (
                    <CustomerJobCard
                      key={job.id}
                      job={job}
                      quoteCount={getActiveQuoteCount(
                        marketplace.quotesByJob[job.id] ?? [],
                      )}
                      onSelect={(selected) =>
                        marketplace.openJobDetail(selected.id)
                      }
                    />
                  ))}
                </div>
              )}

              {pastJobs.length > 0 && (
                <details className="sm-past-jobs">
                  <summary>
                    <span className="sm-past-chev">▶</span> Past jobs
                  </summary>
                  <div className="sm-past-jobs-body">
                    {pastJobs.map((job) => (
                      <PastJobRow
                        key={job.id}
                        job={job}
                        onSelect={(selected) =>
                          marketplace.openJobDetail(selected.id)
                        }
                      />
                    ))}
                  </div>
                </details>
              )}
            </>
          )}

          {marketplace.activeTab === 'quotes' && (
            <div className="sm-quotes-layout">
              <QuoteJobSidebar
                jobs={activeJobs}
                pastJobs={pastJobs}
                quotesByJob={marketplace.quotesByJob}
                selectedJobId={marketplace.selectedQuoteJobId}
                onSelect={marketplace.selectQuoteJob}
              />
              <div>
                {selectedQuoteJob ? (
                  <QuoteList
                    jobId={selectedQuoteJob.id}
                    jobStatus={selectedQuoteJob.status}
                    quotes={selectedQuoteList}
                    respondingQuoteId={marketplace.respondingQuoteId}
                    onRespond={marketplace.handleQuoteResponse}
                    onViewJob={marketplace.openJobDetail}
                    repeatBusinessIds={repeatBusinessIds}
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
