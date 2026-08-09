import { useEffect, useState } from 'react'
import { ArrowRight, CheckCircle2, MapPin } from 'lucide-react'
import useBusiness from '../../business/useBusiness'
import { supabase } from '../../lib/supabase'
import './ServiceMarketplacePage.css'

const pageContent = {
  leads: {
    eyebrow: 'Service Marketplace',
    title: 'Job Leads',
    description: 'Review local service requests matched to your business.',
    empty: 'No matching job leads are available right now.',
  },
  quotes: {
    eyebrow: 'Service Marketplace',
    title: 'Quotes',
    description: 'Track the quotes your business has submitted.',
    empty: 'Your submitted quotes will appear here.',
  },
  jobs: {
    eyebrow: 'Service Marketplace',
    title: 'Active Jobs',
    description: 'Keep track of accepted work and its current status.',
    empty: 'Accepted service jobs will appear here.',
  },
}

export default function ServiceMarketplacePage({ type }) {
  const content = pageContent[type]
  const { business } = useBusiness()
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedLead, setSelectedLead] = useState(null)
  const [quoteAmount, setQuoteAmount] = useState('')
  const [quoteMessage, setQuoteMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true

    async function loadItems() {
      setIsLoading(true)
      setError('')

      const rpcName = {
        leads: 'get_business_job_leads',
        quotes: 'get_business_quotes',
        jobs: 'get_business_active_jobs',
      }[type]

      const { data, error: queryError } = await supabase.rpc(rpcName, {
        p_business_id: business.id,
      })

      if (!active) return

      if (queryError) {
        setError(`Unable to load ${content.title.toLowerCase()}.`)
      } else {
        setItems(data ?? [])
      }
      setIsLoading(false)
    }

    loadItems()
    return () => {
      active = false
    }
  }, [business.id, content.title, reloadKey, type])

  async function handleQuoteSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    const amount = Number(quoteAmount)
    if (!Number.isFinite(amount) || amount < 1) {
      setError('Enter a valid quote amount.')
      return
    }

    if (quoteMessage.trim().length < 10) {
      setError('Add a quote message of at least 10 characters.')
      return
    }

    setIsSaving(true)
    const { error: quoteError } = await supabase.rpc('submit_business_quote', {
      p_business_id: business.id,
      p_job_request_id: selectedLead,
      p_amount_cents: Math.round(amount * 100),
      p_message: quoteMessage.trim(),
    })

    if (quoteError) {
      setError('Unable to submit this quote. The lead may no longer be open.')
    } else {
      setSuccess('Quote submitted. The customer can now review it.')
      setSelectedLead(null)
      setQuoteAmount('')
      setQuoteMessage('')
      setReloadKey((current) => current + 1)
    }
    setIsSaving(false)
  }

  async function handleCompleteJob(jobRequestId) {
    setError('')
    setSuccess('')
    setIsSaving(true)

    const { data, error: completionError } = await supabase.rpc(
      'complete_business_job',
      {
        p_business_id: business.id,
        p_job_request_id: jobRequestId,
      },
    )

    if (completionError || !data) {
      setError('Unable to update this job.')
    } else {
      setSuccess('Job marked as completed for you and the customer.')
      setReloadKey((current) => current + 1)
    }
    setIsSaving(false)
  }

  return (
    <>
      <div className="page-header">
        <div className="page-header-eyebrow">{content.eyebrow}</div>
        <h2>{content.title}</h2>
        <p>{content.description}</p>
      </div>
      {error && (
        <div className="auth-error service-marketplace-message" role="alert">
          {error}
        </div>
      )}
      {success && (
        <div className="auth-success service-marketplace-message" role="status">
          {success}
        </div>
      )}

      <div className="service-marketplace-list">
        {isLoading && <div className="empty-state">Loading…</div>}
        {!isLoading && items.length === 0 && (
          <div className="empty-state">{content.empty}</div>
        )}
        {!isLoading &&
          items.map((item) => (
            <article
              className="service-marketplace-card"
              key={item.quote_id ?? item.job_request_id}
            >
              <div className="service-marketplace-card-head">
                <div>
                  <span>{item.category}</span>
                  <h3>{item.title}</h3>
                </div>
                {type === 'leads' ? (
                  <span className="service-status open">Open lead</span>
                ) : (
                  <span
                    className={`service-status ${item.quote_status ?? item.job_status}`}
                  >
                    {formatStatus(item.quote_status ?? item.job_status)}
                  </span>
                )}
              </div>

              {item.description && <p>{item.description}</p>}

              <div className="service-marketplace-meta">
                <span>
                  <MapPin aria-hidden="true" />
                  {item.suburb}, {item.city}
                </span>
                {item.radius_km && <span>Within {item.radius_km} km</span>}
                {item.created_at && (
                  <span>
                    {new Date(item.created_at).toLocaleDateString('en-NZ')}
                  </span>
                )}
              </div>

              {type !== 'leads' && (
                <div className="service-quote-summary">
                  <strong>{formatMoney(item.amount_cents)}</strong>
                  {item.message && <span>{item.message}</span>}
                </div>
              )}

              {type === 'leads' && (
                <>
                  <button
                    type="button"
                    className={item.has_quote ? 'btn-secondary' : 'btn-primary'}
                    onClick={() => {
                      setSelectedLead((current) =>
                        current === item.job_request_id
                          ? null
                          : item.job_request_id,
                      )
                      setError('')
                      setSuccess('')
                    }}
                  >
                    {item.has_quote ? 'Update quote' : 'Send quote'}
                  </button>

                  {selectedLead === item.job_request_id && (
                    <form
                      className="service-quote-form"
                      onSubmit={handleQuoteSubmit}
                    >
                      <label>
                        <span>Quote amount (NZD)</span>
                        <input
                          type="number"
                          min="1"
                          step="0.01"
                          value={quoteAmount}
                          onChange={(event) =>
                            setQuoteAmount(event.target.value)
                          }
                          placeholder="e.g. 185.00"
                          disabled={isSaving}
                        />
                      </label>
                      <label>
                        <span>Message to customer</span>
                        <textarea
                          value={quoteMessage}
                          onChange={(event) =>
                            setQuoteMessage(event.target.value)
                          }
                          placeholder="Explain what is included in your quote"
                          maxLength="1000"
                          rows="3"
                          disabled={isSaving}
                        />
                      </label>
                      <button
                        type="submit"
                        className="btn-primary"
                        disabled={isSaving}
                      >
                        {isSaving ? 'Submitting…' : 'Submit quote'}
                        {!isSaving && <ArrowRight aria-hidden="true" />}
                      </button>
                    </form>
                  )}
                </>
              )}

              {type === 'jobs' && item.job_status === 'in_progress' && (
                <button
                  type="button"
                  className="btn-success"
                  onClick={() => handleCompleteJob(item.job_request_id)}
                  disabled={isSaving}
                >
                  <CheckCircle2 aria-hidden="true" />
                  {isSaving ? 'Updating…' : 'Mark completed'}
                </button>
              )}
            </article>
          ))}
      </div>
    </>
  )
}

function formatMoney(amountCents) {
  return new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD',
  }).format(amountCents / 100)
}

function formatStatus(status = '') {
  return status.replaceAll('_', ' ')
}
