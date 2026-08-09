export default function LoadingSpinner({ label = 'Loading…' }) {
  return (
    <div className="loading-spinner" role="status" aria-live="polite">
      <span className="loading-spinner-indicator" aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}
