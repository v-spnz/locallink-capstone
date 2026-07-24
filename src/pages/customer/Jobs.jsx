import Modal from '../../components/ui/Modal'
import { useState, useMemo } from 'react'
import ComboBox from '../../components/ui/ComboBox'
import suburbsData from '../../data/Suburbs'

export default function Jobs() {
  const [jobTitle, setJobTitle] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [tradeCategory, setTradeCategory] = useState('')
  const [jobCity, setJobCity] = useState('')
  const [jobSuburb, setJobSuburb] = useState('')
  const suburbOptions = useMemo(
    () => (jobCity && suburbsData[jobCity] ? suburbsData[jobCity] : []),
    [jobCity],
  )
  const [postedJob, setPostedJob] = useState(null)
  const [jobStatus, setJobStatus] = useState('Not Posted')
  const [showModal, setShowModal] = useState(false)
  const [titleError, setTitleError] = useState('')
  const [descriptionError, setDescriptionError] = useState('')
  const [categoryError, setCategoryError] = useState('')
  const [cityError, setCityError] = useState('')
  const [suburbError, setSuburbError] = useState('')

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
    setTitleError('')
    setDescriptionError('')
    setCategoryError('')
    setCityError('')
    setSuburbError('')
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
        city: jobCity,
        suburb: jobSuburb,
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
              <strong>City:</strong> {postedJob.city}
            </div>
            <div>
              <strong>Suburb:</strong> {postedJob.suburb}
            </div>
          </div>
        )}
      </div>
      {showModal && <Modal onClose={() => setShowModal(false)} />}
    </>
  )
}
