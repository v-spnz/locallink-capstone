import { useRef, useState } from 'react'
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
  Plus,
  Video,
  HelpCircle,
} from 'lucide-react'
import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import ComboBox from '../../../components/ui/ComboBox'
import GstIncluded from '../../../components/ui/GstIncluded'
import suburbsData from '../../../data/suburbs'
import jobtypes from '../../../data/jobtypes'
import {
  CITIES,
  POSTED_DISTANCES,
  URGENCY_OPTIONS,
  MIN_BUDGET,
  MAX_BUDGET,
} from '../constants'
import { validateJobWizardStep } from '../validation'
import { parseBudgetRange } from '../formatters'

const STEPS = ['Category', 'Job Type', 'Job Details', 'Location', 'Review']

const CATEGORY_ICONS = [
  { value: 'Plumbing', icon: Wrench },
  { value: 'Electrical', icon: Zap },
  { value: 'Carpentry', icon: Hammer },
  { value: 'Painting', icon: Paintbrush },
  { value: 'Landscaping', icon: Trees },
  { value: 'Roofing', icon: Home },
]

const EMPTY_DRAFT = {
  category: '',
  type: '',
  otherType: '',
  imgs: [],
  description: '',
  jobDate: null,
  minBudget: null,
  maxBudget: null,
  urgency: '',
  city: '',
  suburb: '',
  postedDistance: 4.5,
}

const getTodayDateString = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function buildInitialDraft(initialJob) {
  if (!initialJob) return EMPTY_DRAFT

  const category = initialJob.category || ''
  const knownTypes = jobtypes[category] || []
  const savedType = initialJob.job_type || ''
  const isCustomType = savedType && !knownTypes.includes(savedType)

  const { minBudget, maxBudget } = parseBudgetRange(initialJob.budget)

  return {
    category,
    type: isCustomType ? 'Other' : savedType,
    otherType: isCustomType ? savedType : '',
    imgs: initialJob.image_urls || [],
    description: initialJob.description || '',
    jobDate: initialJob.job_date ? new Date(initialJob.job_date) : null,
    minBudget,
    maxBudget,
    urgency: initialJob.urgency || '',
    city: initialJob.city || '',
    suburb: initialJob.suburb || '',
    postedDistance: initialJob.postedDistance || '',
  }
}

export default function PostJobModal({
  initialJob = null,
  initialStep = 1,
  onClose,
  onSubmit,
  isSaving = false,
  submitError = '',
}) {
  const [step, setStep] = useState(initialStep)
  const [draft, setDraft] = useState(() => buildInitialDraft(initialJob))
  const [errors, setErrors] = useState({})

  const update = (fields) => setDraft((prev) => ({ ...prev, ...fields }))

  const suburbOptions =
    draft.city && suburbsData[draft.city] ? suburbsData[draft.city] : []
  const jobTypeOptions =
    draft.category && jobtypes[draft.category] ? jobtypes[draft.category] : []

  function handleFileChange(event) {
    const files = Array.from(event.target.files)
    const availableSlots = Math.max(0, 20 - draft.imgs.length)
    update({ imgs: [...draft.imgs, ...files.slice(0, availableSlots)] })
    setErrors((current) => ({
      ...current,
      imgs:
        files.length > availableSlots
          ? 'A job can include a maximum of 20 photos or videos.'
          : '',
    }))
    event.target.value = ''
  }

  function removeImage(index) {
    update({ imgs: draft.imgs.filter((_, i) => i !== index) })
  }

  function goNext() {
    const stepErrors = validateJobWizardStep(step, draft, suburbOptions)
    setErrors(stepErrors)
    if (Object.keys(stepErrors).length > 0) return
    setStep((s) => Math.min(s + 1, STEPS.length))
  }

  function goBack() {
    setErrors({})
    setStep((s) => Math.max(s - 1, 1))
  }

  function handlePost() {
    for (let checkStep = 1; checkStep <= 4; checkStep += 1) {
      const stepErrors = validateJobWizardStep(checkStep, draft, suburbOptions)
      if (Object.keys(stepErrors).length > 0) {
        setErrors(stepErrors)
        setStep(checkStep)
        return
      }
    }
    onSubmit(draft)
  }

  return (
    <Modal onClose={onClose}>
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
            <div
              className="flex flex-1 items-center last:flex-none"
              key={label}
            >
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
          <StepCategory draft={draft} update={update} error={errors.category} />
        )}
        {step === 2 && (
          <StepJobType
            draft={draft}
            update={update}
            errors={errors}
            jobTypeOptions={jobTypeOptions}
          />
        )}
        {step === 3 && (
          <StepJobDetails
            draft={draft}
            update={update}
            errors={errors}
            onFileChange={handleFileChange}
            onRemoveImage={removeImage}
          />
        )}
        {step === 4 && (
          <StepLocation
            draft={draft}
            update={update}
            errors={errors}
            suburbOptions={suburbOptions}
          />
        )}
        {step === 5 && <StepReview draft={draft} error={submitError} />}
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
          <Button onClick={handlePost} disabled={isSaving}>
            {isSaving ? 'Saving…' : initialJob ? 'Save Changes' : 'Post Job'}
          </Button>
        )}
      </div>
    </Modal>
  )
}

function StepCategory({ draft, update, error }) {
  return (
    <>
      <p className="mb-3 text-sm font-semibold text-[var(--text)]">
        What type of trade service do you need?
      </p>
      <div className="grid grid-cols-2 gap-3">
        {CATEGORY_ICONS.map((item) => {
          const Icon = item.icon
          const selected = draft.category === item.value
          return (
            <button
              key={item.value}
              type="button"
              onClick={() =>
                update({ category: item.value, type: '', otherType: '' })
              }
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
      {error && <p className="mt-3 text-xs text-[var(--danger)]">{error}</p>}
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
            className="mb-3 w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm focus:border-[var(--blue)] focus:outline-none"
            placeholder="Enter the specific job type..."
            maxLength={30}
            value={draft.otherType}
            onChange={(e) => update({ otherType: e.target.value })}
          />
        </>
      )}
      {errors.type && (
        <p className="mt-3 text-xs text-[var(--danger)]">{errors.type}</p>
      )}
    </>
  )
}

function StepJobDetails({
  draft,
  update,
  errors,
  onFileChange,
  onRemoveImage,
}) {
  const fileInputRef = useRef(null)

  return (
    <>
      <p className="mb-1.5 text-sm font-semibold text-[var(--text)]">
        Photos or video{' '}
        <span className="font-normal text-[var(--text-muted)]">(optional)</span>
      </p>
      <div className="mb-1.5 flex flex-wrap gap-3">
        {draft.imgs.map((file, i) => {
          const isExistingUrl = typeof file === 'string'
          const src = isExistingUrl ? file : URL.createObjectURL(file)
          const isVideo = isExistingUrl
            ? /\.(mp4|mov|webm|avi|mkv)$/i.test(file)
            : file.type.startsWith('video/')

          return (
            <div
              key={i}
              className="relative h-20 w-20 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--bg)]"
            >
              {isVideo ? (
                <div className="flex h-full w-full items-center justify-center">
                  <Video size={24} className="text-[var(--text-muted)]" />
                </div>
              ) : (
                <img
                  src={src}
                  alt={`Preview ${i + 1}`}
                  className="h-full w-full object-cover"
                />
              )}
              <button
                type="button"
                onClick={() => onRemoveImage(i)}
                aria-label="Remove"
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--danger)] text-xs leading-none text-white"
              >
                ×
              </button>
            </div>
          )
        })}

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Add photo or video"
          className="flex h-20 w-20 items-center justify-center rounded-lg border border-dashed border-[var(--border)] text-[var(--text-muted)] transition hover:border-[var(--blue)] hover:text-[var(--blue)]"
        >
          <Plus size={22} />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={onFileChange}
        />
      </div>
      <p className="mb-4 text-xs text-[var(--text-muted)]">
        Maximum 20 photos or videos. Helps providers judge the job before
        quoting.
      </p>
      {errors.imgs && (
        <p className="-mt-3 mb-4 text-xs text-[var(--danger)]">{errors.imgs}</p>
      )}

      <label className="mb-1.5 block text-sm font-semibold text-[var(--text)]">
        Description *
      </label>
      <textarea
        className="min-h-[100px] w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm focus:border-[var(--blue)] focus:outline-none"
        placeholder="Describe the job in detail — size, access, any special requirements…"
        maxLength={400}
        value={draft.description}
        onChange={(e) => update({ description: e.target.value })}
      />
      {errors.description && (
        <p className="mt-1 text-xs text-[var(--danger)]">
          {errors.description}
        </p>
      )}
      <div className="date&budget flex flex-row gap-10">
        <div className="mt-4">
          <label className="mb-1.5 block text-sm font-semibold text-[var(--text)]">
            Job Date *
          </label>
          <input
            type="date"
            className="w-35 rounded-md border border-[var(--border)] px-3 py-2 text-sm focus:border-[var(--blue)] focus:outline-none"
            value={
              draft.jobDate ? draft.jobDate.toISOString().split('T')[0] : ''
            }
            min={getTodayDateString()}
            onChange={(e) =>
              update({
                jobDate: e.target.value ? new Date(e.target.value) : null,
              })
            }
          />
          {errors.jobDate && (
            <p className="mt-1 text-xs text-[var(--danger)]">
              {errors.jobDate}
            </p>
          )}
        </div>

        <div className="mt-4">
          <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-[var(--text)]">
            Budget{' '}
            <span className="font-normal text-[var(--text-muted)]">
              (optional)
            </span>
            <span className="group relative inline-flex">
              <HelpCircle
                color="#000000"
                size={15}
                className="cursor-help text-[var(--text-muted)] "
                aria-hidden="true"
              />
              <span
                role="tooltip"
                className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 w-56 -translate-x-1/2 rounded-md bg-[var(--text)] px-2.5 py-1.5 text-xs font-normal leading-snug text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
              >
                Setting a budget range may reduce the amount of quotes you will
                end up receiving
              </span>
            </span>
          </label>
          <div className="flex items-center gap-2">
            <ComboBox
              width="120px"
              maxHeight="100px"
              overflowY="auto"
              prefix="$"
              options={MIN_BUDGET}
              placeholder="Min"
              value={draft.minBudget}
              onChange={(value) =>
                update({ minBudget: value === '' ? null : Number(value) })
              }
            />
            <span className="shrink-0 text-sm text-[var(--text-muted)]">–</span>
            <ComboBox
              width="120px"
              maxHeight="100px"
              overflowY="auto"
              prefix="$"
              options={MAX_BUDGET}
              placeholder="Max"
              value={draft.maxBudget}
              onChange={(value) =>
                update({ maxBudget: value === '' ? null : Number(value) })
              }
            />
          </div>
          <GstIncluded block />
        </div>
        {errors.minBudget && (
          <p className="mt-1 text-xs text-[var(--danger)]">
            {errors.minBudget}
          </p>
        )}
        {errors.maxBudget && (
          <p className="mt-1 text-xs text-[var(--danger)]">
            {errors.maxBudget}
          </p>
        )}
      </div>

      <label className="mb-1.5 mt-4 block text-sm font-semibold text-[var(--text)]">
        Urgency *
      </label>
      <div className="grid grid-cols-3 gap-3">
        {URGENCY_OPTIONS.map((item) => {
          const selected = draft.urgency === item
          return (
            <button
              key={item}
              type="button"
              onClick={() => update({ urgency: item })}
              className={
                'flex items-center justify-center rounded-lg border px-4 py-3 text-sm transition ' +
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
      {errors.urgency && (
        <p className="mt-3 text-xs text-[var(--danger)]">{errors.urgency}</p>
      )}
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
        maxHeight="200px"
        overflowY="auto"
        options={CITIES}
        placeholder="Select a city..."
        value={draft.city}
        onChange={(value) => update({ city: value.trim(), suburb: '' })}
      />
      {errors.city && (
        <p className="mt-1 text-xs text-[var(--danger)]">{errors.city}</p>
      )}

      <label className="mb-1.5 mt-4 block text-sm font-semibold text-[var(--text)]">
        Suburb *
      </label>
      <ComboBox
        maxHeight="200px"
        overflowY="auto"
        options={suburbOptions}
        placeholder="Select a suburb..."
        value={draft.suburb}
        onChange={(value) => update({ suburb: value.trim() })}
      />
      {errors.suburb && (
        <p className="mt-1 text-xs text-[var(--danger)]">{errors.suburb}</p>
      )}

      <label className="mb-1.5 mt-4 block text-sm font-semibold text-[var(--text)]">
        Posted distance (km) *
      </label>
      <div className="radius-slider-wrapper relative">
        <div className="relative mb-2 h-5">
          <span
            className="absolute -translate-x-1/2 text-xs font-semibold text-[var(--blue)]"
            style={{
              left: `${((Number(draft.postedDistance) - 1) / 7) * 100}%`,
            }}
          >
            {Number(draft.postedDistance).toFixed(1)} km
          </span>
        </div>
        <input
          type="range"
          className="radius-slider"
          min={1}
          max={8}
          step={0.1}
          defaultValue={4.5}
          value={draft.postedDistance}
          onChange={(event) =>
            update({ postedDistance: Number(event.target.value) })
          }
        />
        <div className="radius-ticks">
          <span>1 km</span>
          <span>4.5 km</span>
          <span>8 km</span>
        </div>
      </div>
      {errors.postedDistance && (
        <p className="mt-1 text-xs text-[var(--danger)]">
          {errors.postedDistance}
        </p>
      )}

      <div className="mt-4 rounded-md bg-[var(--amber-light)] px-3 py-2 text-xs text-[var(--text)]">
        Local tradespeople in this category will see this job once it&apos;s
        posted — matched by category and distance from their service area.
      </div>
    </>
  )
}

function StepReview({ draft, error }) {
  const displayType = draft.type === 'Other' ? draft.otherType : draft.type

  return (
    <div>
      <p className="mb-3 text-sm text-[var(--text-muted)]">
        Please review your job posting before submitting.
      </p>

      <div className="divide-y divide-[var(--border)] overflow-hidden rounded-md border border-[var(--border)]">
        <ReviewRow label="Category" value={draft.category} />
        <ReviewRow label="Type" value={displayType} />
        <ReviewRow
          label="Photos/Videos"
          value={
            draft.imgs.length > 0
              ? `${draft.imgs.length} file(s) attached`
              : 'None'
          }
        />
        <ReviewRow
          label="Preferred date"
          value={
            draft.jobDate ? draft.jobDate.toLocaleDateString('en-NZ') : '—'
          }
        />
        <ReviewRow
          label="Budget"
          value={
            <>
              {`${draft.minBudget !== null ? `$${draft.minBudget}` : '—'} – ${draft.maxBudget !== null ? `$${draft.maxBudget}` : '—'}`}
              <GstIncluded />
            </>
          }
        />
        <ReviewRow label="Urgency" value={draft.urgency} />
        <ReviewRow label="City" value={draft.city} />
        <ReviewRow label="Suburb" value={draft.suburb} />
        <ReviewRow
          label="Search distance"
          value={`${draft.postedDistance} km`}
        />
      </div>

      <p className="mb-1.5 mt-4 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
        Additional comments
      </p>
      <div className="rounded-md bg-[var(--bg)] px-3 py-2.5 text-sm text-[var(--text)]">
        {draft.description || '—'}
      </div>

      <p className="mt-4 text-xs text-[var(--text-muted)]">
        Once posted, providers nearby will be notified and can submit quotes
        within 24–48 hours.
      </p>

      {error && <p className="mt-3 text-sm text-[var(--danger)]">{error}</p>}
    </div>
  )
}

function ReviewRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 px-3.5 py-2.5">
      <span className="text-sm text-[var(--text-muted)]">{label}</span>
      <span className="text-sm font-semibold text-[var(--text)]">
        {value || '—'}
      </span>
    </div>
  )
}
