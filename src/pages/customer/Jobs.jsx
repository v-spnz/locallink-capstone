import { useState, useMemo, useEffect } from 'react'
import ComboBox from '../../components/ui/ComboBox'
import suburbsData from '../../data/Suburbs'

export default function Jobs() {
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

  const [titleError, setTitleError] = useState('')
  const [descriptionError, setDescriptionError] = useState('')
  const [categoryError, setCategoryError] = useState('')
  const [cityError, setCityError] = useState('')
  const [suburbError, setSuburbError] = useState('')
  const [distanceError, setDistanceError] = useState('')

  useEffect(() => {
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
    if (!jobTitle) {
      setTitleError('Please enter a job title.')
      return false
    }
    if (!jobDescription) {
      setDescriptionError('Please enter a job description.')
      return false
    }
    if (!tradeCategory) {
      setCategoryError('Please enter a trade category.')
      return false
    }
    if (!jobCity) {
      setCityError('Please enter a job city.')
      return false
    }
    if (!jobSuburb) {
      setSuburbError('Please enter a job suburb.')
      return false
    }
    if (!jobPostedDistance) {
      setDistanceError('Please enter a posted distance.')
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
      title: jobTitle,
      description: jobDescription,
      category: tradeCategory,
      city: jobCity,
      suburb: jobSuburb,
      postedDistance: jobPostedDistance,
    })
    setStep('review')
  }

  function handleBackToEdit() {
    setStep('form')
  }

  function handleConfirmPost() {
  if (editingJob) {
    setPostedJobs((prevJobs) =>
      prevJobs.map((job) =>
        job.id === editingJob.id ? { ...pendingJob, id: editingJob.id } : job,
      ),
    )
    setEditingJob(null)
  } else {
    setPostedJobs((prevJobs) => [
      ...prevJobs,
      { ...pendingJob, id: Date.now() },
    ])
  }
  setJobStatus('Job Posted')
  setPendingJob(null)
  setJobTitle('')
  setJobDescription('')
  setTradeCategory('')
  setJobCity('')
  setJobSuburb('')
  setJobPostedDistance('')
  setStep('form')
  setSuccessMessage(editingJob ? 'Job updated successfully!' : 'Job posted successfully!')
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
        <form onSubmit={handleReview} className="placeholder-section" noValidate>
          <div className="placeholder-section-title is-complete">Post a Job</div>

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
            />
            {titleError && <div className="error">{titleError}</div>}
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
            />
            {descriptionError && <div className="error">{descriptionError}</div>}
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
                setTradeCategory(value)
                setCategoryError('')
              }}
            />
            {categoryError && <div className="error">{categoryError}</div>}
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
                setJobCity(value)
                setCityError('')
                setJobSuburb('')
              }}
            />
            {cityError && <div className="error">{cityError}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Job Suburb</label>
            <ComboBox
              options={suburbOptions}
              className="suburb-combobox"
              placeholder="Select a suburb..."
              value={jobSuburb}
              onChange={(value) => {
                setJobSuburb(value)
                setSuburbError('')
              }}
            />
            {suburbError && <div className="error">{suburbError}</div>}
          </div>
          <div className="form-group">
            <label className="form-label">Posted Distance (km)</label>
            <ComboBox
              options={['1km', '2km', '3km', '4km', '5km', '6km', '7km', '8km', '9km', '10km']}
              className="distance-combobox"
              value={jobPostedDistance}
              onChange={(value) => {
                setJobPostedDistance(value)
                setDistanceError('')
              }}
              placeholder="e.g. 5km"
            />
            {distanceError && <div className="error">{distanceError}</div>}
          </div>

          <button type="submit" className="btn-primary">
            Post Job
          </button>
          {successMessage && (
          <p style={{ color: 'seagreen', marginTop: 10 }}>{successMessage}</p>
        )}
        </form>
        
      )}

      {step === 'review' && pendingJob && (
        <div className="placeholder-section">
          <div className="placeholder-section-title">Review Job</div>
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
          <ReviewRow label="Posted Distance" value={pendingJob.postedDistance} />
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
            >
              Confirm &amp; Post Job
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
        {postedJobs.length > 0 && (
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
                  <p>Time Posted: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
                  <p>Posted Distance: {job.postedDistance}</p>
                </div>
                <div style={{ fontSize: 12, color: '#999' }}>
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
                  >`
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