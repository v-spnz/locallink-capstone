import { ImagePlus } from 'lucide-react'

export function FieldError({ id, children }) {
  return children ? (
    <span className="form-error" id={id} role="alert">
      {children}
    </span>
  ) : null
}

export function FormField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  helper,
  required = false,
  ...inputProps
}) {
  return (
    <div className="form-group">
      <span className="form-label" id={`${id}-label`}>
        {label} {required && <span className="deal-required">Required</span>}
      </span>
      <input
        {...inputProps}
        aria-required={required}
        aria-labelledby={`${id}-label`}
        aria-describedby={error ? `${id}-error` : undefined}
        aria-invalid={Boolean(error)}
        className="form-input"
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
      {helper}
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </div>
  )
}

export function TextAreaField({
  id,
  label,
  value,
  onChange,
  placeholder,
  error,
  required = false,
}) {
  return (
    <div className="form-group">
      <span className="form-label" id={`${id}-label`}>
        {label} {required && <span className="deal-required">Required</span>}
      </span>
      <textarea
        aria-required={required}
        aria-labelledby={`${id}-label`}
        aria-describedby={error ? `${id}-error` : undefined}
        aria-invalid={Boolean(error)}
        className="form-input deal-textarea"
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows="4"
      />
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </div>
  )
}

export function DealImageField({ error, onChange, previewUrl }) {
  return (
    <div className="form-group deal-image-field">
      <span className="form-label" id="deal-image-label">
        Deal image <span className="deal-required">Required</span>
      </span>
      <label className="deal-image-picker" htmlFor="deal-image">
        <span className="deal-image-thumbnail">
          {previewUrl ? (
            <img src={previewUrl} alt="Deal preview" />
          ) : (
            <ImagePlus aria-hidden="true" />
          )}
        </span>
        <span className="deal-image-copy">
          <strong>{previewUrl ? 'Replace image' : 'Add an image'}</strong>
          <small>JPG, PNG or WebP, up to 5 MB</small>
        </span>
        <span className="deal-image-action" aria-hidden="true">
          Choose file
        </span>
      </label>
      <input
        accept="image/jpeg,image/png,image/webp"
        aria-labelledby="deal-image-label"
        aria-describedby={error ? 'deal-image-error' : undefined}
        aria-invalid={Boolean(error)}
        className="deal-file-input"
        id="deal-image"
        type="file"
        onChange={(event) => onChange(event.target.files?.[0] || null)}
      />
      <FieldError id="deal-image-error">{error}</FieldError>
    </div>
  )
}
