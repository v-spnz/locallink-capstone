import Modal from '../../components/ui/Modal'
import { useState } from 'react'
import ComboBox from '../../components/ui/ComboBox'

export default function Jobs() {
  const [jobTitle, setJobTitle] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [tradeCategory, setTradeCategory] = useState('')
  const [jobLocation, setJobLocation] = useState('')
  const [postedJob, setPostedJob] = useState(null)
  const [jobStatus, setJobStatus] = useState('Not Posted')
  const [showModal, setShowModal] = useState(false)
  const [titleError, setTitleError] = useState('')
  const [descriptionError, setDescriptionError] = useState('')
  const [categoryError, setCategoryError] = useState('')
  const [locationError, setLocationError] = useState('')

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
    if (!jobLocation) {
      setLocationError('Please enter a job location.')
      return false
    }
    setTitleError('')
    setDescriptionError('')
    setCategoryError('')
    setLocationError('')
    return true
  }
  function submitJob() {
    if (!validateForm()) {
      return false
    } else {
      setShowModal(true)
      setPostedJob({
        title: jobTitle,
        description: jobDescription,
        category: tradeCategory,
        location: jobLocation,
      })
      setJobStatus('Job Posted')
    }
  }

  return (
    <>
      <div className="page-header">
        <h2>Services</h2>
        <p>
          Post a job and receive quotes from local tradespeople in your area.
        </p>
      </div>
      <div className="placeholder-section">
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
              'Roofing'
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
          <label className="form-label">Job Location</label>
          <ComboBox
            options={[
              'Auckland, NZ',
              'Wellington, NZ',
              'Christchurch, NZ',
              'Hamilton, NZ',
              'Tauranga, NZ'
            ]}
            className="location-combobox"
            placeholder="Select a location..."
            value={jobLocation}
            onChange={(value) => {
              setJobLocation(value)
              setLocationError('')
            }}
          />
          {locationError && <div className="error">{locationError}</div>}
        </div>
        <button className="btn-primary" onClick={submitJob}>
          Post Job
        </button>
      </div>
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
        {postedJob && (
          <div className="job-status">
            <div>
              <strong>Job Title:</strong> {postedJob.title}
            </div>
            <div>
              <strong>Description:</strong> {postedJob.description}
            </div>
            <div>
              <strong>Category:</strong> {postedJob.category}
            </div>
            <div>
              <strong>Location:</strong> {postedJob.location}
            </div>
          </div>
        )}
      </div>
      {showModal && <Modal onClose={() => setShowModal(false)} />}
    </>
  )
}
