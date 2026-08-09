import { useState } from 'react'
import {
  X,
  Wrench,
  Zap,
  Hammer,
  Paintbrush,
  Trees,
  Home,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import Modal from '../../components/ui/Modal'
import ComboBox from '../../components/ui/ComboBox'
import suburbsData from '../../data/Suburbs'
import jobtypes from '../../data/JobTypes'
import './Jobs.css'

const STEPS = ['Category', 'Job Type', 'Job Details', 'Location', 'Review']

const CATEGORIES = [
  { value: 'Plumbing', icon: Wrench },
  { value: 'Electrical', icon: Zap },
  { value: 'Carpentry', icon: Hammer },
  { value: 'Painting', icon: Paintbrush },
  { value: 'Landscaping', icon: Trees },
  { value: 'Roofing', icon: Home },
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
  '1km', '2km', '3km', '4km', '5km',
  '6km', '7km', '8km'
]

const VALID_CATEGORIES = [
    'Plumbing',
    'Electrical',
    'Carpentry',
    'Painting',
    'Landscaping',
    'Roofing',
]
const VALID_URGENCY = [
    'Flexible',
    'Normal',
    'Urgent',
]

const EMPTY_DRAFT = {
  category: '',
  type: '',
  urgency: '',
    imgs: [],
  description: '',
  city: '',
  suburb: '',
  postedDistance: '',
  otherType: '', 
}

export default function PostJob({
  initialJob = null,
  initialStep = 1,
  onClose,
  onSubmit,
  isSaving = false,
  submitError = '',
}) {
  const [step, setStep] = useState(initialStep)
  const [draft, setDraft] = useState(() =>
    initialJob
      ? {
          category: initialJob.category || '',
          type: initialJob.job_type || initialJob.type || '',
          otherType: initialJob.job_type || '',
          imgs: initialJob.image_urls || initialJob.imgs || [],
          description: initialJob.description || '',
          city: initialJob.city || '',
          suburb: initialJob.suburb || '',
          postedDistance: initialJob.postedDistance || '',
          urgency: initialJob.urgency || '',
        }
      : EMPTY_DRAFT,
  )
  const [errors, setErrors] = useState({})

  const update = (fields) => setDraft((prev) => ({ ...prev, ...fields }))

  const suburbOptions =
    draft.city && suburbsData[draft.city] ? suburbsData[draft.city] : []

    const jobTypeOptions =
    draft.category && jobtypes[draft.category] ? jobtypes[draft.category] : []

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files)
        update({ imgs: [...draft.imgs, ...files] })
    }

  function validateStep(currentStep) {
    const next = {}

    if (currentStep === 1 && !draft.category) {
      next.category = 'Please select a trade category.'
    }
    if (currentStep === 2 && !draft.type) {
      next.type = 'Please select a job type.'
    }
    if (currentStep === 2 && draft.type === 'Other' && !draft.otherType.trim()) {
      next.type = 'Please specify the job type.'
    }
    if (currentStep === 2 && draft.type === 'Other') {
  const otherType = (draft.otherType || '').trim()
  if (!otherType) next.type = 'Please specify the job type.'
  else if (otherType.length < 3)
    next.type = 'Please include at least 3 characters in the job type.'
  else if (otherType.length > 30)
    next.type = 'Job type cannot exceed 30 characters.'
}
    if (currentStep === 3) {
      const description = draft.description.trim()
      if (!description) next.description = 'Please enter a job description.'
      else if (description.length < 10)
        next.description = 'Please include at least 10 characters in the description.'
      else if (description.length > 400)
        next.description = 'Description cannot exceed 400 characters.'
    }

    if (currentStep === 4) {
      if (!draft.city) next.city = 'Please select a city.'
      else if (!VALID_CITIES.includes(draft.city)) next.city = 'Please choose a valid city from the list.'

      if (!draft.suburb) next.suburb = 'Please select a suburb.'
      else if (draft.city && !suburbOptions.includes(draft.suburb))
        next.suburb = 'Please choose a suburb that matches the selected city.'

    }

    if (currentStep === 5) {
      if (!draft.urgency) next.urgency = 'Please select an urgency level.'
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  function goNext() {
    if (!validateStep(step)) return
    setStep((s) => Math.min(s + 1, STEPS.length))
  }

  function goBack() {
    setErrors({})
    setStep((s) => Math.max(s - 1, 1))
  }

  function handlePost() {
    if (!validateStep(4)) {
      setStep(4)
      return
    }
    onSubmit({
        imgs: draft.imgs,
      type: draft.type,
      otherType: draft.otherType,
      description: draft.description.trim(),
      category: draft.category,
      city: draft.city,
      suburb: draft.suburb,
      postedDistance: draft.postedDistance,
      urgency: draft.urgency,
    })
  }

  return (
    <Modal onClose={onClose}>
      <>
        {}
        <div className="flex items-start justify-between border-b border-[var(--border)] px-6 py-5">
          <div>
            <h2 className="text-lg font-extrabold text-[var(--text)]">
              {initialJob ? 'Edit Job' : 'Post a Job'}
            </h2>
            <p className="mt-0.5 text-sm text-[var(--text-muted)]">
              Step {step} of {STEPS.length} — {STEPS[step - 1]}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1 text-[var(--text-muted)] hover:bg-[var(--bg)] hover:text-[var(--text)]"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex items-center gap-2 px-6 py-4">
          {STEPS.map((label, i) => {
            const n = i + 1
            const state = n < step ? 'done' : n === step ? 'active' : 'pending'
            return (
              <div className="flex flex-1 items-center last:flex-none" key={label}>
                <div
                  className={
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ' +
                    (state === 'pending'
                      ? 'bg-[var(--border)] text-[var(--text-muted)]'
                      : 'bg-[var(--blue)] text-white')
                  }
                >
                  {state === 'done' ? '✓' : n}
                </div>
                <span
                  className={
                    'ml-2 hidden text-sm sm:inline ' +
                    (state === 'pending'
                      ? 'text-[var(--text-muted)]'
                      : 'font-semibold text-[var(--blue)]')
                  }
                >
                  {label}
                </span>
                {n < STEPS.length && (
                  <div className="mx-2 h-px flex-1 bg-[var(--border)]" />
                )}
              </div>
            )
          })}
        </div>

        <div className="min-h-[260px] px-6 pb-2">
          {step === 1 && (
            <StepCategory draft={draft} update={update} errors={errors.category} />
          )}

          {step === 2 && (
            <StepJobType draft={draft} update={update} errors={errors.type} jobTypeOptions={jobTypeOptions} />
          )}
          {step === 3 && (
            <StepJobDetails 
            draft={draft} 
            update={update} 
            errors={errors} 
            onFileChange={handleFileChange} 
           onRemoveImage={(idx) => update({ imgs: draft.imgs.filter((_, i) => i !== idx) })
             } />
          )}
          {step === 4 && (
            <StepLocation
              draft={draft}
              update={update}
              errors={errors}
              suburbOptions={suburbOptions}
            />
          )}
          {step === 5 && <StepReview draft={draft} errors={submitError} />}
        </div>

        <div className="flex items-center justify-between px-6 py-5">
          <button
            onClick={step === 1 ? onClose : goBack}
            className="flex items-center gap-1 rounded-md px-4 py-2 text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text)]"
          >
            <ChevronLeft size={16} />
            {step === 1 ? 'Cancel' : 'Back'}
          </button>

          {step < STEPS.length ? (
            <button
              onClick={goNext}
              className="flex items-center gap-1 rounded-md bg-[var(--blue)] px-5 py-2 text-sm font-semibold text-white hover:bg-[var(--blue-dark)]"
            >
              Continue
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handlePost}
              disabled={isSaving}
              className="rounded-md bg-[var(--blue)] px-5 py-2 text-sm font-semibold text-white hover:bg-[var(--blue-dark)] disabled:opacity-60"
            >
              {isSaving ? 'Saving…' : initialJob ? 'Save Changes' : 'Post Job'}
            </button>
          )}
        </div>
      </>
    </Modal>
  )
}

function StepCategory({ draft, update, errors }) {
  return (
    <>
      <p className="mb-3 text-sm font-semibold text-[var(--text)]">
        What type of trade service do you need?
      </p>
      <div className="grid grid-cols-2 gap-3">
        {CATEGORIES.map((item) => {
          const Icon = item.icon
          const selected = draft.category === item.value
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => update({ category: item.value })}
              className={
                'flex items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition ' +
                (selected
                  ? 'border-[var(--blue)] bg-[var(--blue-light)] ring-1 ring-[var(--blue)]'
                  : 'border-[var(--border)] hover:border-[var(--blue)]')
              }
            >
              <Icon size={18} className="text-[var(--blue)]" />
              {item.value}
            </button>
          )
        })}
      </div>
      {errors && <p className="mt-3 text-xs text-[var(--danger)]">{errors.category}</p>}
    </>
  )
}

function StepJobType({ draft, update, errors, jobTypeOptions }) {
    return (
    <>
      <p className="mb-3 text-sm font-semibold text-[var(--text)]">
        What type of job are you looking for?
      </p>
      <div className="grid grid-cols-2 gap-3">
        {jobTypeOptions.map((item) => {
          const selected = draft.type === item
          return (
            <button
              key={item}
              type="button"
              onClick={() => update({ type: item })}
              className={
                'flex items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition ' +
                (selected
                  ? 'border-[var(--blue)] bg-[var(--blue-light)] ring-1 ring-[var(--blue)]'
                  : 'border-[var(--border)] hover:border-[var(--blue)]')
              }
            >
              {item}
            </button>
          )
        })}
      </div>
      {draft.type === 'Other' && (
        <>
          <label className="mb-1.5 mt-4 block text-sm font-semibold text-[var(--text)]">
            Please specify the job type *
          </label>
          <input
            type="text"
            className="mb-3 rounded-md border border-[var(--border)] px-3 py-2 text-sm focus:border-[var(--blue)] focus:outline-none"
            placeholder="Enter the specific job type..."
            maxLength={30}
            minLength={3}
            value={draft.otherType}
            onChange={(e) => update({ otherType: e.target.value })}
          />
        </>
      )}
      {errors && <p className="mt-3 text-xs text-[var(--danger)]">{errors.type}</p>}
    </>
  )
}
      

function StepJobDetails({ draft, update, errors, onFileChange, onRemoveImage }) {
  return (
    <>
    <p className="mb-3 text-sm font-semibold text-[var(--text)]">
        Photos or Videos (Optional)
      </p>
      <input
        type="file"
        accept="image/*,video/*"
        multiple
        className="upload-input"
        onChange={onFileChange}
      />
      {draft.imgs.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-3">
          {draft.imgs.map((file, i) => {
            const isExistingUrl = typeof file === 'string'
            const src = isExistingUrl ? file : URL.createObjectURL(file)
            const isVideo = isExistingUrl
              ? /\.(mp4|mov|webm|avi|mkv)$/i.test(file)
              : file.type.startsWith('video/')

            return (
              <div key={i} className="relative">
                {isVideo ? (
                  <video
                    src={src}
                    className="h-24 w-24 rounded-md border border-[var(--border)] object-cover"
                    controls
                  />
                ) : (
                  <img
                    src={src}
                    alt={`Preview ${i + 1}`}
                    width="120"
                    className="h-24 w-24 rounded-md border border-[var(--border)] object-cover"
                  />
                )}
                <button
                  type="button"
                  onClick={() => onRemoveImage(i)}
                  className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--danger)] text-xs text-white"
                >
                  ×
                </button>
              </div>
            )
          })}
        </div>
      )}
      <label className="mb-1.5 mt-4 block text-sm font-semibold text-[var(--text)]">
        Description *
      </label>
      <textarea
        className="min-h-[100px] w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm focus:border-[var(--blue)] focus:outline-none"
        placeholder="Describe the job in detail — size, access, any special requirements…"
        maxLength={400}
        value={draft.description}
        onChange={(e) => update({ description: e.target.value })}
      />
      {errors && (
        <p className="mt-1 text-xs text-[var(--danger)]">{errors.description}</p>
      )}
      <label className="mb-1.5 mt-4 block text-sm font-semibold text-[var(--text)]">
        Urgency *
      </label>
      <div className="grid grid-cols-3 gap-3">
        {VALID_URGENCY.map((item) => {
          const selected = draft.urgency === item
          return (
            <button
              key={item}
              type="button"
              onClick={() => update({ urgency: item })}
              className={
                'flex items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition ' +
                (selected
                  ? 'border-[var(--blue)] bg-[var(--blue-light)] ring-1 ring-[var(--blue)]'
                  : 'border-[var(--border)] hover:border-[var(--blue)]')
              }
            >
              {item}
            </button>
          )
        })}
      </div>
      {errors && <p className="mt-3 text-xs text-[var(--danger)]">{errors.urgency}</p>}
    </>
  )
}

function StepLocation({ draft, update, errors, suburbOptions }) {
  return (
    <>
      <label className="mb-1.5 block text-sm font-semibold text-[var(--text)]">
        City *
      </label>
      <ComboBox
        options={VALID_CITIES}
        placeholder="Select a city..."
        value={draft.city}
        onChange={(value) => update({ city: value.trim(), suburb: '' })}
      />
      {errors.city && <p className="mt-1 text-xs text-[var(--danger)]">{errors.city}</p>}

      <label className="mb-1.5 mt-4 block text-sm font-semibold text-[var(--text)]">
        Suburb *
      </label>
      <ComboBox
        options={suburbOptions}
        placeholder="Select a suburb..."
        value={draft.suburb}
        onChange={(value) => update({ suburb: value.trim() })}
      />
      {errors.suburb && <p className="mt-1 text-xs text-[var(--danger)]">{errors.suburb}</p>}

      <label className="mb-1.5 mt-4 block text-sm font-semibold text-[var(--text)]">
        Posted distance (km) *
      </label>
      <input
          type="range"
          className="radius-slider"
          min={1}
          max={8}
          step={0.1}
          value={draft.postedDistance}
          defaultValue={4.5}
          onChange={(event) => update({ postedDistance: Number(event.target.value) })}
        />
        <div className="radius-ticks">
          <span>1 km</span>
          <span>4.5 km</span>
          <span>8 km</span>
        </div>
      {errors.postedDistance && (
        <p className="mt-1 text-xs text-[var(--danger)]">{errors.postedDistance}</p>
      )}

      <div className="mt-4 rounded-md bg-[var(--amber-light)] px-3 py-2 text-xs text-[var(--text)]">
        Local tradespeople in this category will see this job once it&apos;s posted
        — matched by category and distance from their service area.
      </div>
    </>
  )
}

function StepReview({ draft, errors }) {
  return (
    <div>
      <ReviewRow label="Trade Category" value={draft.category} />
      <ReviewRow label="Job Type" value={draft.type === 'Other' ? draft.otherType : draft.type} />
      <ReviewRow label="Photos/Videos" value={draft.imgs.length > 0 ? `${draft.imgs.length} file(s) uploaded` : 'None'} />
      <ReviewRow label="Description" value={draft.description} />
      <ReviewRow label="City" value={draft.city} />
      <ReviewRow label="Suburb" value={draft.suburb} />
      <ReviewRow label="Posted Distance" value={`${draft.postedDistance} km`} />
      <ReviewRow label="Urgency" value={draft.urgency} />
      {errors && <p className="mt-3 text-sm text-[var(--danger)]">{errors}</p>}
    </div>
  )
}

function ReviewRow({ label, value }) {
  return (
    <div className="border-b border-[var(--border)] py-2.5">
      <div className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
        {label}
      </div>
      <div className="text-sm text-[var(--text)]">{value || '—'}</div>
    </div>
  )
}