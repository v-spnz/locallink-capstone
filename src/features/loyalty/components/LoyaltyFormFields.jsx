import { ImagePlus, Trash2 } from 'lucide-react'

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
  helper,
  error,
  value,
  onChange,
  requiredToPublish = false,
  prefix,
  ...inputProps
}) {
  const descriptionIds = [
    helper ? `${id}-helper` : '',
    error ? `${id}-error` : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="form-group">
      <label className="form-label" htmlFor={id}>
        {label}
        {requiredToPublish && (
          <span className="loyalty-required">Required to publish</span>
        )}
      </label>
      <div className={prefix ? 'loyalty-input-with-prefix' : undefined}>
        {prefix && (
          <span className="loyalty-input-prefix" aria-hidden="true">
            {prefix}
          </span>
        )}
        <input
          {...inputProps}
          aria-describedby={descriptionIds || undefined}
          aria-invalid={Boolean(error)}
          className="form-input"
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
      {helper && (
        <span className="loyalty-field-helper" id={`${id}-helper`}>
          {helper}
        </span>
      )}
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </div>
  )
}

export function TextAreaField({
  id,
  label,
  helper,
  error,
  value,
  onChange,
  requiredToPublish = false,
  ...props
}) {
  const descriptionIds = [
    helper ? `${id}-helper` : '',
    error ? `${id}-error` : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="form-group">
      <label className="form-label" htmlFor={id}>
        {label}
        {requiredToPublish && (
          <span className="loyalty-required">Required to publish</span>
        )}
      </label>
      <textarea
        {...props}
        aria-describedby={descriptionIds || undefined}
        aria-invalid={Boolean(error)}
        className="form-input loyalty-textarea"
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {helper && (
        <span className="loyalty-field-helper" id={`${id}-helper`}>
          {helper}
        </span>
      )}
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </div>
  )
}

export function ProgrammeImageField({ error, onChange, onRemove, previewUrl }) {
  const descriptionIds = [
    'loyalty-programme-image-helper',
    error ? 'loyalty-programme-image-error' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="form-group loyalty-programme-image-field">
      <span className="form-label" id="loyalty-programme-image-label">
        Programme image <span className="loyalty-optional">Optional</span>
      </span>
      <label className="deal-image-picker" htmlFor="loyalty-programme-image">
        <span className="deal-image-thumbnail">
          {previewUrl ? (
            <img src={previewUrl} alt="Programme image preview" />
          ) : (
            <ImagePlus aria-hidden="true" />
          )}
        </span>
        <span className="deal-image-copy">
          <strong>{previewUrl ? 'Replace image' : 'Add an image'}</strong>
          <small id="loyalty-programme-image-helper">
            JPG, PNG or WebP, up to 5 MB. The gift icon remains if you skip
            this.
          </small>
        </span>
        <span className="deal-image-action" aria-hidden="true">
          Choose file
        </span>
      </label>
      <input
        accept="image/jpeg,image/png,image/webp"
        aria-labelledby="loyalty-programme-image-label"
        aria-describedby={descriptionIds}
        aria-invalid={Boolean(error)}
        className="deal-file-input"
        id="loyalty-programme-image"
        type="file"
        onChange={(event) => {
          onChange(event.target.files?.[0] || null)
          event.target.value = ''
        }}
      />
      {previewUrl && (
        <button
          className="loyalty-programme-image-remove"
          type="button"
          onClick={onRemove}
        >
          <Trash2 aria-hidden="true" />
          Remove image
        </button>
      )}
      <FieldError id="loyalty-programme-image-error">{error}</FieldError>
    </div>
  )
}
