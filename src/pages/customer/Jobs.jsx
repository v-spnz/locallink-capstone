import { BriefcaseBusiness, FileText, ArrowUpRight } from 'lucide-react'
import localNeighbourhoodStreet from '../../assets/images/local-neighbourhood-street.jpg'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import CustomerJobCard from '../../features/service-marketplace/components/CustomerJobCard'
import JobDetailPanel from '../../features/service-marketplace/components/JobDetailPanel'
import PostJobModal from '../../features/service-marketplace/components/PostJobModal'
import QuoteJobSidebar from '../../features/service-marketplace/components/QuoteJobSidebar'
import QuoteList from '../../features/service-marketplace/components/QuoteList'
import useCustomerJobs from '../../features/service-marketplace/hooks/useCustomerJobs'
import '../../features/service-marketplace/ServiceMarketplace.css'
import '../../features/service-marketplace/CustomerMarketplace.css'
import PastJobRow from '../../features/service-marketplace/components/PastJobRow'

import {
  getRepeatBusinessIds,
  getActiveQuoteCount,
} from '../../features/service-marketplace/formatters'

function CustomerEmptyState({ title, hint, actionLabel, onAction }) {
  return (
    <div className="empty-state service-empty-state">
      <div className="service-empty-state-visual">
        <img
          src={localNeighbourhoodStreet}
          alt="A tradesperson's van parked on a local residential street"
        />
      </div>
      <div className="service-empty-state-copy">
        <h3>{title}</h3>
        <small>{hint}</small>
        {onAction && (
          <button
            type="button"
            className="service-empty-state-link"
            onClick={onAction}
          >
            {actionLabel}
            <ArrowUpRight aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  )
}

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
  const quotesReceivedCount = activeJobs.reduce(
    (total, job) =>
      total + getActiveQuoteCount(marketplace.quotesByJob[job.id] ?? []),
    0,
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

  const hasAnyJobs = marketplace.postedJobs.length > 0

  const summaries = [
    {
      tab: 'jobs',
      label: 'My Jobs',
      value: activeJobs.length,
      description: 'Active jobs you have posted',
      icon: BriefcaseBusiness,
    },
    {
      tab: 'quotes',
      label: 'Quotes',
      value: quotesReceivedCount,
      description: 'Quotes waiting on your response',
      icon: FileText,
    },
  ]

  return (
    <div className="customer-services-page">
      <header className="marketplace-heading">
        <div className="page-header">
          <h2>Service Marketplace</h2>
          <p>Find trusted local help for your next job.</p>
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={marketplace.openPostModal}
        >
          + Post a Service Job
        </button>
      </header>

      <div className="service-overview" aria-label="Job overview">
        {summaries.map((summary) => {
          const Icon = summary.icon
          return (
            <article
              className={`service-overview-card is-${summary.tab}`}
              key={summary.tab}
            >
              <span className="service-overview-icon">
                <Icon aria-hidden="true" />
              </span>
              <span className="service-overview-copy">
                <span>{summary.label}</span>
                <strong>{marketplace.isLoading ? '…' : summary.value}</strong>
                <small>{summary.description}</small>
              </span>
              <button
                type="button"
                className="marketplace-overview-link"
                aria-label={`View ${summary.label.toLowerCase()}`}
                onClick={() => marketplace.switchTab(summary.tab)}
              >
                <ArrowUpRight aria-hidden="true" />
              </button>
            </article>
          )
        })}
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
          onRepost={marketplace.handleRepostClick}
          onDelete={marketplace.handleDeleteClick}
          onViewQuotes={marketplace.viewQuotesForJob}
          onConfirmCompletion={marketplace.handleConfirmCompletion}
          repostPrompt={marketplace.repostPrompt}
          onRepostConfirm={marketplace.confirmRepost}
          onRepostDismiss={marketplace.dismissRepostPrompt}
          deletePrompt={marketplace.deletePrompt}
          onDeleteConfirm={marketplace.confirmDeletePrompt}
          onDeleteDismiss={marketplace.dismissDeletePrompt}
        />
      )}

      {!marketplace.isLoading && !selectedJob && (
        <>
          <div className="service-tabs" role="tablist" aria-label="Jobs">
            <button
              type="button"
              role="tab"
              aria-selected={marketplace.activeTab === 'jobs'}
              className={marketplace.activeTab === 'jobs' ? 'active' : ''}
              onClick={() => marketplace.switchTab('jobs')}
            >
              <BriefcaseBusiness aria-hidden="true" />
              My Jobs
              <span className="marketplace-tab-count">{activeJobs.length}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={marketplace.activeTab === 'quotes'}
              className={marketplace.activeTab === 'quotes' ? 'active' : ''}
              onClick={() => marketplace.switchTab('quotes')}
            >
              <FileText aria-hidden="true" />
              Quotes
              <span className="marketplace-tab-count">
                {quotesReceivedCount}
              </span>
            </button>
          </div>

          <section className="marketplace-workspace">
            {marketplace.activeTab === 'jobs' && (
              <>
                <div className="marketplace-section-heading">
                  <h2>Your posted jobs</h2>
                  <p>Track quotes and progress on everything you've posted.</p>
                </div>

                {activeJobs.length === 0 && pastJobs.length === 0 && (
                  <CustomerEmptyState
                    title="Your posted jobs will land here"
                    hint="Post a job and local tradespeople matched to your area will start sending quotes."
                    actionLabel="Post a service job"
                    onAction={marketplace.openPostModal}
                  />
                )}

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
              <>
                <div className="marketplace-section-heading">
                  <h2>Your quotes</h2>
                  <p>Compare what local businesses have offered.</p>
                </div>

                {!hasAnyJobs ? (
                  <CustomerEmptyState
                    title="Quotes will appear once you post a job"
                    hint="Post a job first — quotes from local businesses will show up here as they come in."
                    actionLabel="Post a service job"
                    onAction={marketplace.openPostModal}
                  />
                ) : (
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
          </section>
        </>
      )}
    </div>
  )
}
