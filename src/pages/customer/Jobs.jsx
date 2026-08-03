import { useState, useMemo, useEffect } from 'react'
import ComboBox from '../../components/ui/ComboBox'
import suburbsData from '../../data/Suburbs'
import useAuth from '../../auth/useAuth'
import { supabase } from '../../lib/supabase'

const VALID_TRADE_CATEGORIES = [
  'Plumbing',
  'Electrical',
  'Carpentry',
  'Painting',
  'Landscaping',
  'Roofing',
]

const VALID_CITIES = [
  'Auckland',
  'Wellington',
  'Christchurch',
  'Hamilton',
  'Tauranga',
  'Dunedin',
  'Napier',
  'Hastings',
  'Palmerston North',
  'New Plymouth',
  'Nelson',
  'Rotorua',
  'Whangarei',
  'Invercargill',
  'Queenstown',
  'Porirua',
]

const VALID_DISTANCES = [
  '1km',
  '2km',
  '3km',
  '4km',
  '5km',
  '6km',
  '7km',
  '8km',
  '9km',
  '10km',
]

export default function Jobs() {
  const { user } = useAuth()
  const [postedJobs, setPostedJobs] = useState([])
  const [jobTitle, setJobTitle] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [tradeCategory, setTradeCategory] = useState('')
  const [jobCity, setJobCity] = useState('')
  const [jobSuburb, setJobSuburb] = useState('')
  const [jobPostedDistance, setJobPostedDistance] = useState('')
  const suburbOptions = useMemo(
    () => (jobCity && suburbsData[jobCity] ? suburbsData[jobCity] : []),
    [jobCity],
  )
  const [pendingJob, setPendingJob] = useState(null)
  const [editingJob, setEditingJob] = useState(null)
  const [jobStatus, setJobStatus] = useState('Not Posted')
  const [step, setStep] = useState('form')
  const [successMessage, setSuccessMessage] = useState('')
  const [requestError, setRequestError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const [titleError, setTitleError] = useState('')
  const [descriptionError, setDescriptionError] = useState('')
  const [categoryError, setCategoryError] = useState('')
  const [cityError, setCityError] = useState('')
  const [suburbError, setSuburbError] = useState('')
  const [distanceError, setDistanceError] = useState('')

  useEffect(() => {
    let active = true

    async function loadJobs() {
      const { data, error } = await supabase
        .from('job_requests')
        .select(
          'id, title, description, category, city, suburb, radius_km, status, created_at',
        )
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false })

      if (!active) return
      if (error) setRequestError('Unable to load your job requests.')
      else {
        setPostedJobs(
          (data ?? []).map((job) => ({
            ...job,
            postedDistance: `${job.radius_km}km`,
          })),
        )
        setJobStatus(
          data?.some((job) => job.status === 'open')
            ? 'Job Posted'
            : 'Not Posted',
        )
      }
      setIsLoading(false)
    }

    loadJobs()
    return () => {
      active = false
    }
  }, [user.id])

  useEffect(() => {
    if (!successMessage) return undefined
    const timer = setTimeout(() => {
      setSuccessMessage('')
    }, 2000)

    return () => clearTimeout(timer)
  }, [successMessage])

  function handleEditJob(job) {
    setEditingJob(job)
    setJobTitle(job.title)
    setJobDescription(job.description)
    setTradeCategory(job.category)
    setJobCity(job.city)
    setJobSuburb(job.suburb)
    setJobPostedDistance(job.postedDistance)
    setStep('form')
  }

  function validateForm() {
    const trimmedTitle = jobTitle.trim()
    if (!trimmedTitle) {
      setTitleError('Please enter a job title.')
      return false
    }
    if (trimmedTitle.length < 3) {
      setTitleError('Job title should be at least 3 characters long.')
      return false
    }
    if (trimmedTitle.length > 60) {
      setTitleError('Job title cannot exceed 60 characters.')
      return false
    }

    const trimmedDescription = jobDescription.trim()
    if (!trimmedDescription) {
      setDescriptionError('Please enter a job description.')
      return false
    }
    if (trimmedDescription.length < 10) {
      setDescriptionError(
        'Please include at least 10 characters in the description.',
      )
      return false
    }
    if (trimmedDescription.length > 400) {
      setDescriptionError('Description cannot exceed 400 characters.')
      return false
    }

    const trimmedCategory = tradeCategory.trim()
    if (!trimmedCategory) {
      setCategoryError('Please select a trade category.')
      return false
    }
    if (!VALID_TRADE_CATEGORIES.includes(trimmedCategory)) {
      setCategoryError('Please choose a valid trade category from the list.')
      return false
    }

    const trimmedCity = jobCity.trim()
    if (!trimmedCity) {
      setCityError('Please select a city.')
      return false
    }
    if (!VALID_CITIES.includes(trimmedCity)) {
      setCityError('Please choose a valid city from the list.')
      return false
    }

    const trimmedSuburb = jobSuburb.trim()
    if (!trimmedSuburb) {
      setSuburbError('Please select a suburb.')
      return false
    }
    if (!suburbOptions.map((option) => option.trim()).includes(trimmedSuburb)) {
      setSuburbError('Please choose a suburb that matches the selected city.')
      return false
    }

    const trimmedDistance = jobPostedDistance.trim()
    if (!trimmedDistance) {
      setDistanceError('Please select a posted distance.')
      return false
    }
    if (!VALID_DISTANCES.includes(trimmedDistance)) {
      setDistanceError('Please choose a valid distance from the list.')
      return false
    }

    setTitleError('')
    setDescriptionError('')
    setCategoryError('')
    setCityError('')
    setSuburbError('')
    setDistanceError('')
    return true
  }

  function handleReview(event) {
    event.preventDefault()
    setSuccessMessage('')
    if (!validateForm()) return

    setPendingJob({
      title: jobTitle.trim(),
      description: jobDescription.trim(),
      category: tradeCategory.trim(),
      city: jobCity.trim(),
      suburb: jobSuburb.trim(),
      postedDistance: jobPostedDistance.trim(),
    })
    setStep('review')
  }

  function handleBackToEdit() {
    setStep('form')
  }

  async function handleConfirmPost() {
    setIsSaving(true)
    setRequestError('')
    const wasEditing = Boolean(editingJob)
    const payload = {
      customer_id: user.id,
      title: pendingJob.title,
      description: pendingJob.description,
      category: pendingJob.category,
      city: pendingJob.city,
      suburb: pendingJob.suburb,
      radius_km: Number.parseInt(pendingJob.postedDistance, 10),
      status: 'open',
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
        'id, title, description, category, city, suburb, radius_km, status, created_at',
      )
      .single()

    if (error) {
      setRequestError('Your job request could not be saved. Please try again.')
      setIsSaving(false)
      return
    }

    const savedJob = { ...data, postedDistance: `${data.radius_km}km` }
    setPostedJobs((current) =>
      wasEditing
        ? current.map((job) => (job.id === savedJob.id ? savedJob : job))
        : [savedJob, ...current],
    )
    setEditingJob(null)
    setJobStatus('Job Posted')
    setPendingJob(null)
    setJobTitle('')
    setJobDescription('')
    setTradeCategory('')
    setJobCity('')
    setJobSuburb('')
    setJobPostedDistance('')
    setStep('form')
    setSuccessMessage(
      wasEditing ? 'Job updated successfully!' : 'Job posted successfully!',
    )
    setIsSaving(false)
  }

  return (
    <>
      <div className="page-header">
        <h2>Services</h2>
        <p>
          Post a job and receive quotes from local tradespeople in your area.
        </p>
      </div>

      {step === 'form' && (
        <form
          onSubmit={handleReview}
          className="placeholder-section"
          noValidate
        >
          <div className="placeholder-section-title is-complete">
            Post a Job
          </div>

          <div className="form-group">
            <label className="form-label">Job Title</label>
            <input
              className="form-input"
              value={jobTitle}
              onChange={(e) => {
                setJobTitle(e.target.value)
                setTitleError('')
              }}
              placeholder="e.g. Leaking tap repair"
              maxLength={60}
            />
            {titleError && (
              <div className="error" style={{ color: '#dc2626' }}>
                {titleError}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <input
              className="form-input"
              value={jobDescription}
              onChange={(e) => {
                setJobDescription(e.target.value)
                setDescriptionError('')
              }}
              placeholder="Describe the job…"
              maxLength={400}
            />
            {descriptionError && (
              <div className="error" style={{ color: '#dc2626' }}>
                {descriptionError}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Trade Category</label>
            <ComboBox
              options={[
                'Plumbing',
                'Electrical',
                'Carpentry',
                'Painting',
                'Landscaping',
                'Roofing',
              ]}
              className="category-combobox"
              placeholder="Select a category..."
              value={tradeCategory}
              onChange={(value) => {
                setTradeCategory(value.trim())
                setCategoryError('')
              }}
            />
            {categoryError && (
              <div className="error" style={{ color: '#dc2626' }}>
                {categoryError}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Job City</label>
            <ComboBox
              options={[
                'Auckland',
                'Wellington',
                'Christchurch',
                'Hamilton',
                'Tauranga',
                'Dunedin',
                'Napier',
                'Hastings',
                'Palmerston North',
                'New Plymouth',
                'Nelson',
                'Rotorua',
                'Whangarei',
                'Invercargill',
                'Queenstown',
                'Porirua',
              ]}
              className="city-combobox"
              placeholder="Select a city..."
              value={jobCity}
              onChange={(value) => {
                setJobCity(value.trim())
                setCityError('')
                setJobSuburb('')
              }}
            />
            {cityError && (
              <div className="error" style={{ color: '#dc2626' }}>
                {cityError}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Job Suburb</label>
            <ComboBox
              options={suburbOptions}
              className="suburb-combobox"
              placeholder="Select a suburb..."
              value={jobSuburb}
              onChange={(value) => {
                setJobSuburb(value.trim())
                setSuburbError('')
              }}
            />
            {suburbError && (
              <div className="error" style={{ color: '#dc2626' }}>
                {suburbError}
              </div>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Posted Distance (km)</label>
            <ComboBox
              options={[
                '1km',
                '2km',
                '3km',
                '4km',
                '5km',
                '6km',
                '7km',
                '8km',
                '9km',
                '10km',
              ]}
              className="distance-combobox"
              value={jobPostedDistance}
              onChange={(value) => {
                setJobPostedDistance(value.trim())
                setDistanceError('')
              }}
              placeholder="e.g. 5km"
            />
            {distanceError && (
              <div className="error" style={{ color: '#dc2626' }}>
                {distanceError}
              </div>
            )}
          </div>

          <button type="submit" className="btn-primary">
            Preview Job Request
          </button>
          {successMessage && (
            <p style={{ color: 'seagreen', marginTop: 10 }}>{successMessage}</p>
          )}
        </form>
      )}

      {step === 'review' && pendingJob && (
        <div className="placeholder-section">
          <div className="placeholder-section-title is-complete">
            Review Job
          </div>
          <p
            style={{
              fontSize: 13,
              color: '#666',
              marginTop: -6,
              marginBottom: 14,
            }}
          >
            Please review the job details before posting.
          </p>

          <ReviewRow label="Job Title" value={pendingJob.title} />
          <ReviewRow label="Description" value={pendingJob.description} />
          <ReviewRow label="Trade Category" value={pendingJob.category} />
          <ReviewRow label="City" value={pendingJob.city} />
          <ReviewRow label="Suburb" value={pendingJob.suburb} />
          <ReviewRow
            label="Posted Distance"
            value={pendingJob.postedDistance}
          />
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleBackToEdit}
            >
              Back to Edit
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={handleConfirmPost}
              disabled={isSaving}
            >
              {isSaving ? 'Saving…' : 'Confirm & Post Job Request'}
            </button>
          </div>
        </div>
      )}
      <div className="placeholder-section">
        <div className="placeholder-section-title">Quotes Received</div>
        <div className="placeholder-box">Quotes list — component TBD</div>
      </div>

      <div className="placeholder-section">
        <div
          className="job-status-header"
          style={{ color: jobStatus === 'Job Posted' ? 'green' : 'red' }}
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
            {postedJobs.map((job) => (
              <div
                key={job.id}
                style={{ padding: '10px 0', borderBottom: '1px solid #eee' }}
              >
                <strong>{job.title}</strong> - {job.category}
                <div style={{ fontSize: 13, color: '#666' }}>
                  {job.description}
                </div>
                <div style={{ fontSize: 12, color: '#999' }}>
                  {job.city}
                  {job.suburb ? `, ${job.suburb}` : ''}
                </div>
                <div style={{ fontSize: 12, color: '#999' }}>
                  <p>
                    Time Posted:{' '}
                    {new Date(job.created_at).toLocaleString('en-NZ')}
                  </p>
                  <p>Posted Distance: {job.postedDistance}</p>
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: '#999',
                    display: 'flex',
                    gap: 10,
                  }}
                >
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setPendingJob(job)
                      setStep('review')
                    }}
                  >
                    Repost Job
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      handleEditJob(job)
                    }}
                  >
                    Edit Job
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

function ReviewRow({ label, value }) {
  return (
    <div style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}>
      <div style={{ fontSize: 12, color: '#999', textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{ fontSize: 14 }}>{value || '-'}</div>
    </div>
  )
}
