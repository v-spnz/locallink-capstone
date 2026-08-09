import Button from '../../../components/ui/Button'
import ComboBox from '../../../components/ui/ComboBox'
import { CITIES, POSTED_DISTANCES, TRADE_CATEGORIES } from '../constants'

function FieldError({ message }) {
  if (!message) return null
  return <div className="form-error">{message}</div>
}

export default function JobRequestForm({
  form,
  errors,
  suburbOptions,
  successMessage,
  onChange,
  onSubmit,
}) {
  return (
    <form onSubmit={onSubmit} className="placeholder-section" noValidate>
      <div className="placeholder-section-title is-complete">Post a Job</div>

      <div className="form-group">
        <label className="form-label" htmlFor="job-title">
          Job Title
        </label>
        <input
          id="job-title"
          className="form-input"
          value={form.title}
          onChange={(event) => onChange('title', event.target.value)}
          placeholder="e.g. Leaking tap repair"
          maxLength={60}
        />
        <FieldError message={errors.title} />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="job-description">
          Description
        </label>
        <input
          id="job-description"
          className="form-input"
          value={form.description}
          onChange={(event) => onChange('description', event.target.value)}
          placeholder="Describe the job…"
          maxLength={400}
        />
        <FieldError message={errors.description} />
      </div>

      <div className="form-group">
        <label className="form-label">Trade Category</label>
        <ComboBox
          options={TRADE_CATEGORIES}
          className="category-combobox"
          placeholder="Select a category..."
          value={form.category}
          onChange={(value) => onChange('category', value.trim())}
        />
        <FieldError message={errors.category} />
      </div>

      <div className="form-group">
        <label className="form-label">Job City</label>
        <ComboBox
          options={CITIES}
          className="city-combobox"
          placeholder="Select a city..."
          value={form.city}
          onChange={(value) => onChange('city', value.trim())}
        />
        <FieldError message={errors.city} />
      </div>

      <div className="form-group">
        <label className="form-label">Job Suburb</label>
        <ComboBox
          options={suburbOptions}
          className="suburb-combobox"
          placeholder="Select a suburb..."
          value={form.suburb}
          onChange={(value) => onChange('suburb', value.trim())}
        />
        <FieldError message={errors.suburb} />
      </div>

      <div className="form-group">
        <label className="form-label">Posted Distance (km)</label>
        <ComboBox
          options={POSTED_DISTANCES}
          className="distance-combobox"
          value={form.postedDistance}
          onChange={(value) => onChange('postedDistance', value.trim())}
          placeholder="e.g. 5km"
        />
        <FieldError message={errors.postedDistance} />
      </div>

      <Button type="submit">Preview Job Request</Button>
      {successMessage && <p className="form-success">{successMessage}</p>}
    </form>
  )
}
