import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CalendarDays,
  ArrowRight,
} from 'lucide-react'
import { format, isValid, parseISO } from 'date-fns'
import { enNZ } from 'date-fns/locale'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/style.css'
import './DateRangeCalendar.css'

function parseDateKey(value) {
  if (!value) return undefined
  const date = parseISO(value)
  return isValid(date) ? date : undefined
}

function toDateKey(date) {
  return date ? format(date, 'yyyy-MM-dd') : ''
}

function formatDate(date) {
  return date ? format(date, 'd MMM yyyy', { locale: enNZ }) : ''
}

function RangeChevron({ orientation, disabled = false, style, ...props }) {
  const Icon =
    {
      down: ChevronDown,
      left: ChevronLeft,
      right: ChevronRight,
      up: ChevronUp,
    }[orientation] || ChevronRight

  return (
    <Icon
      {...props}
      aria-hidden="true"
      style={{ ...style, opacity: disabled ? 0.45 : style?.opacity }}
    />
  )
}

export default function DateRangeCalendar({
  id,
  label,
  startLabel = 'Start date',
  endLabel = 'End date',
  startDate,
  endDate,
  startError,
  endError,
  onChange,
  required = false,
}) {
  const from = parseDateKey(startDate)
  const to = parseDateKey(endDate)
  const selected = from ? { from, to } : undefined
  const describedBy = [
    `${id}-instructions`,
    startError ? `${id}-start-error` : '',
    endError ? `${id}-end-error` : '',
  ].filter(Boolean)
  const selectionMessage = !from
    ? 'Choose a start date, then choose an end date.'
    : !to
      ? `${formatDate(from)} selected as the start. Now choose an end date.`
      : `${formatDate(from)} to ${formatDate(to)} selected.`

  function handleSelect(nextRange) {
    onChange({
      startDate: toDateKey(nextRange?.from),
      endDate: toDateKey(nextRange?.to),
    })
  }

  return (
    <fieldset
      className={`date-range-field${startError || endError ? ' has-error' : ''}`}
      aria-describedby={describedBy.join(' ')}
    >
      <legend className="form-label">
        {label} {required && <span className="deal-required">Required</span>}
      </legend>
      <p className="date-range-instructions" id={`${id}-instructions`}>
        Select the first day, then the last day of the deal.
      </p>

      <div
        className={`date-range-summary${to ? ' is-complete' : from ? ' is-started' : ''}`}
        aria-live="polite"
      >
        <span className="date-range-summary-icon" aria-hidden="true">
          <CalendarDays />
        </span>
        <span className="date-range-value">
          <small>{startLabel}</small>
          <strong>{from ? formatDate(from) : 'Select start'}</strong>
        </span>
        <ArrowRight className="date-range-arrow" aria-hidden="true" />
        <span className="date-range-value">
          <small>{endLabel}</small>
          <strong>{to ? formatDate(to) : 'Select end'}</strong>
        </span>
      </div>

      <div className="date-range-calendar-shell">
        <DayPicker
          animate
          components={{ Chevron: RangeChevron }}
          defaultMonth={from || new Date()}
          footer={selectionMessage}
          locale={enNZ}
          mode="range"
          navLayout="around"
          onSelect={handleSelect}
          resetOnSelect
          selected={selected}
          showOutsideDays
        />
      </div>

      {(from || to) && (
        <button
          className="date-range-clear"
          type="button"
          onClick={() => onChange({ startDate: '', endDate: '' })}
        >
          Clear dates
        </button>
      )}

      {startError && (
        <span className="form-error" id={`${id}-start-error`} role="alert">
          {startError}
        </span>
      )}
      {endError && (
        <span className="form-error" id={`${id}-end-error`} role="alert">
          {endError}
        </span>
      )}
    </fieldset>
  )
}
