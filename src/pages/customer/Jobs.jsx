import { useState, useEffect } from 'react'
import useAuth from '../../auth/useAuth'
import { supabase } from '../../lib/supabase'
import PostJob from './PostJob'
import './Jobs.css'

export default function Jobs() {
  const { user } = useAuth()
  const [postedJobs, setPostedJobs] = useState([])
  const [jobStatus, setJobStatus] = useState('Not Posted')
  const [successMessage, setSuccessMessage] = useState('')
  const [requestError, setRequestError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [quotesByJob, setQuotesByJob] = useState({})
  const [respondingQuoteId, setRespondingQuoteId] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingJob, setEditingJob] = useState(null)
  const [repostSeed, setRepostSeed] = useState(null)
  const [modalInitialStep, setModalInitialStep] = useState(1)
  const [isSaving, setIsSaving] = useState(false)
  const [modalError, setModalError] = useState('')

  useEffect(() => {
    let active = true

    async function loadJobs() {
      setIsLoading(true)
      setRequestError('')

      const [jobsResult, quotesResult] = await Promise.all([
        supabase
          .from('job_requests')
          .select(
            'id, title, description, category, job_type, city, suburb, radius_km, status, image_urls, created_at',
          )
          .eq('customer_id', user.id)
          .order('created_at', { ascending: false }),
        supabase.rpc('get_customer_job_quotes'),
      ])

      if (!active) return
      if (jobsResult.error || quotesResult.error) {
        setRequestError('Unable to load your job requests and quotes.')
      }

      if (!jobsResult.error) {
        setPostedJobs(
          (jobsResult.data ?? []).map((job) => ({
            ...job,
            postedDistance: `${job.radius_km}km`,
          })),
        )
        setJobStatus(getOverallJobStatus(jobsResult.data ?? []))
      }

      if (!quotesResult.error) {
        setQuotesByJob(
          (quotesResult.data ?? []).reduce((groupedQuotes, quote) => {
            const jobQuotes = groupedQuotes[quote.job_request_id] ?? []
            return {
              ...groupedQuotes,
              [quote.job_request_id]: [...jobQuotes, quote],
            }
          }, {}),
        )
      }
      setIsLoading(false)
    }

    loadJobs()
    return () => {
      active = false
    }
  }, [reloadKey, user.id])

  useEffect(() => {
    if (!successMessage) return undefined
    const timer = setTimeout(() => {
      setSuccessMessage('')
    }, 2000)

    return () => clearTimeout(timer)
  }, [successMessage])

  async function uploadJobImages(files, userId) {
    const urls = []
    for (const file of files) {
      const ext = file.name.split('.').pop()
      const path = `${userId}/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('job-images')
        .upload(path, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('job-images').getPublicUrl(path)

      urls.push(data.publicUrl)
    }
    return urls
  }

  function openPostModal() {
    setEditingJob(null)
    setRepostSeed(null)
    setModalInitialStep(1)
    setModalError('')
    setIsModalOpen(true)
  }

  function openEditModal(job) {
    setEditingJob(job)
    setRepostSeed(null)
    setModalInitialStep(1)
    setModalError('')
    setIsModalOpen(true)
  }

  function openRepostModal(job) {
    setEditingJob(null)
    setRepostSeed(job)
    setModalInitialStep(4)
    setModalError('')
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setEditingJob(null)
    setRepostSeed(null)
    setModalError('')
  }

  async function handleSubmitJob(draft) {
    setIsSaving(true)
    setModalError('')
    setRequestError('')

    const wasEditing = Boolean(editingJob)

    const existingImageUrls = (draft.imgs || []).filter(
      (item) => typeof item === 'string',
    )
    const newImageFiles = (draft.imgs || []).filter(
      (item) => item instanceof File,
    )

    let uploadedImageUrls = []
    try {
      if (newImageFiles.length > 0) {
        uploadedImageUrls = await uploadJobImages(newImageFiles, user.id)
      }
    } catch {
      setModalError('One or more photos/videos could not be uploaded. Please try again.')
      setIsSaving(false)
      return
    }

    const imageUrls = [...existingImageUrls, ...uploadedImageUrls]

    const payload = {
      customer_id: user.id,
      title: draft.type === 'Other' ? draft.otherType : draft.type,
      job_type: draft.type === 'Other' ? draft.otherType : draft.type,
      description: draft.description,
      category: draft.category,
      city: draft.city,
      suburb: draft.suburb,
      radius_km: Number.parseFloat(draft.postedDistance),
      status: 'open',
      image_urls: imageUrls,
      urgency: draft.urgency,
    }

    const query = wasEditing
      ? supabase
          .from('job_requests')
          .update(payload)
          .eq('id', editingJob.id)
          .eq('customer_id', user.id)
      : supabase.from('job_requests').insert(payload)

    const { data, error } = await query
      .select(
        'id, title, description, category, job_type, city, suburb, radius_km, status, image_urls, created_at',
      )
      .single()

    if (error) {
      console.error('job_requests save failed:', error)
      setModalError('Your job request could not be saved. Please try again.')
      setIsSaving(false)
      return
    }

    const savedJob = { ...data, postedDistance: `${data.radius_km}km` }
    setPostedJobs((current) =>
      wasEditing
        ? current.map((job) => (job.id === savedJob.id ? savedJob : job))
        : [savedJob, ...current],
    )
    setJobStatus('Job Posted')
    setIsSaving(false)
    setSuccessMessage(
      wasEditing ? 'Job updated successfully!' : 'Job posted successfully!',
    )
    closeModal()
  }

  async function handleQuoteResponse(quoteId, accept) {
    setRespondingQuoteId(quoteId)
    setRequestError('')
    setSuccessMessage('')

    const { error } = await supabase.rpc('respond_to_job_quote', {
      p_quote_id: quoteId,
      p_accept: accept,
    })

    if (error) {
      setRequestError(
        accept
          ? 'This quote could not be accepted. It may no longer be available.'
          : 'This quote could not be declined. Please try again.',
      )
    } else {
      setSuccessMessage(accept ? 'Quote accepted!' : 'Quote declined.')
      setReloadKey((current) => current + 1)
    }

    setRespondingQuoteId(null)
  }

  const modalInitialJob = editingJob || repostSeed

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
        <button type="button" className="btn-primary" onClick={openPostModal}>
          Post a Job
        </button>
        {successMessage && (
          <p style={{ color: 'seagreen', marginTop: 10 }}>{successMessage}</p>
        )}
      </div>

      {isModalOpen && (
        <PostJob
          initialJob={modalInitialJob}
          initialStep={modalInitialStep}
          onClose={closeModal}
          onSubmit={handleSubmitJob}
          isSaving={isSaving}
          submitError={modalError}
        />
      )}

      <div className="placeholder-section">
        <div
          className="job-status-header"
          style={{
            color: jobStatus === 'Not Posted' ? 'var(--text-muted)' : 'green',
          }}
        >
          Job Status: {jobStatus}
        </div>
        {requestError && (
          <div className="auth-error" role="alert">
            {requestError}
          </div>
        )}
        {isLoading && <div className="empty-state">Loading your jobs…</div>}
        {!isLoading && postedJobs.length > 0 && (
          <div style={{ marginTop: 10 }}>
            {postedJobs.map((job) => {
              const jobQuotes = quotesByJob[job.id] ?? []
              const canEdit = ['open', 'closed', 'cancelled'].includes(
                job.status,
              )

              return (
                <article className="customer-job-card" key={job.id}>
                  <div className="customer-job-card-head">
                    <div>
                      <strong>{job.title}</strong>
                      <span>{job.category}</span>
                    </div>
                    <span className={`customer-job-status ${job.status}`}>
                      {formatStatus(job.status)}
                    </span>
                  </div>
                  <p className="customer-job-description">{job.description}</p>
                  <div className="customer-job-meta">
                    <span>
                      {job.suburb ? `${job.suburb}, ` : ''}
                      {job.city}
                    </span>
                    <span>{job.postedDistance} radius</span>
                    <span>
                      Posted {new Date(job.created_at).toLocaleString('en-NZ')}
                    </span>
                  </div>

                  <section className="customer-job-quotes">
                    <h4>
                      {jobQuotes.length} quote
                      {jobQuotes.length === 1 ? '' : 's'} received
                    </h4>
                    {jobQuotes.length === 0 && (
                      <p className="customer-job-no-quotes">
                        Local businesses can view this request when its category
                        and area match their services.
                      </p>
                    )}
                    {jobQuotes.map((quote) => (
                      <div className="customer-quote" key={quote.quote_id}>
                        <div className="customer-quote-head">
                          <div>
                            <strong>{quote.business_name}</strong>
                            <span>{formatMoney(quote.amount_cents)}</span>
                          </div>
                          <span
                            className={`customer-quote-status ${quote.quote_status}`}
                          >
                            {formatStatus(quote.quote_status)}
                          </span>
                        </div>
                        <p>{quote.message}</p>
                        {job.status === 'open' &&
                          quote.quote_status === 'submitted' && (
                            <div className="customer-quote-actions">
                              <button
                                type="button"
                                className="btn-primary"
                                onClick={() =>
                                  handleQuoteResponse(quote.quote_id, true)
                                }
                                disabled={respondingQuoteId !== null}
                              >
                                {respondingQuoteId === quote.quote_id
                                  ? 'Saving…'
                                  : 'Accept quote'}
                              </button>
                              <button
                                type="button"
                                className="btn-secondary"
                                onClick={() =>
                                  handleQuoteResponse(quote.quote_id, false)
                                }
                                disabled={respondingQuoteId !== null}
                              >
                                Decline
                              </button>
                            </div>
                          )}
                      </div>
                    ))}
                  </section>

                  {canEdit && (
                    <div className="customer-job-actions">
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => openRepostModal(job)}
                      >
                        Repost Job
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => openEditModal(job)}
                      >
                        Edit Job
                      </button>
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}

function getOverallJobStatus(jobs) {
  if (jobs.some((job) => job.status === 'in_progress')) return 'In Progress'
  if (jobs.some((job) => job.status === 'open')) return 'Job Posted'
  if (jobs.some((job) => job.status === 'completed')) return 'Completed'
  return 'Not Posted'
}

function formatStatus(status) {
  return status.replaceAll('_', ' ')
}

function formatMoney(amountCents) {
  return new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD',
  }).format(amountCents / 100)
}