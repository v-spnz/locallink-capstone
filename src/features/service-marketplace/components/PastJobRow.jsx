const CATEGORY_ICONS = {
  Carpentry: {
    className: 'carpentry',
    icon: (
      <g transform="rotate(45 12 12)">
        <rect x="9" y="3" width="6" height="7" rx="1.5" />
        <rect x="10.5" y="10" width="3" height="11" rx="1.5" />
      </g>
    ),
  },
  Electrical: {
    className: 'electrical',
    icon: <polygon points="13 2 4 14 11 14 10 22 20 10 13 10 13 2" />,
  },
  Landscaping: {
    className: 'landscaping',
    icon: <path d="M12 3c-4 3-7 7-7 11a7 7 0 0 0 14 0c0-4-3-8-7-11z" />,
  },
  Plumbing: {
    className: 'plumbing',
    icon: (
      <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.1 2.1-2-2 2.1-2.1z" />
    ),
  },
  Painting: {
    className: 'painting',
    icon: (
      <>
        <path d="M2 20v-4a2 2 0 0 1 2-2h2v6H2z" />
        <rect x="4" y="10" width="14" height="6" rx="1" />
        <rect x="16" y="6" width="4" height="6" rx="1" />
      </>
    ),
  },
  Roofing: {
    className: 'roofing',
    icon: <path d="M12 3l9 7h-2v9H5v-9H3l9-7z" />,
  },
}

// Falls back to a plain grey chip for any category not mapped above,
// so adding a new trade category later never breaks this row.
const DEFAULT_ICON = {
  className: 'default',
  icon: <circle cx="12" cy="12" r="8" />,
}

export default function PastJobRow({ job, onSelect }) {
  const { className, icon } = CATEGORY_ICONS[job.category] ?? DEFAULT_ICON

  return (
    <div className="sm-past-row" onClick={() => onSelect(job)}>
      <span className={`sm-past-icon sm-past-icon--${className}`}>
        <svg viewBox="0 0 24 24" fill="currentColor">
          {icon}
        </svg>
      </span>
      <div className="sm-past-row-text">
        <div className="sm-past-row-title">{job.title}</div>
        <div className="sm-past-row-sub">
          Completed{' '}
          {new Date(job.updated_at).toLocaleDateString('en-NZ', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </div>
      </div>
      <span className="sm-past-row-cat">{job.category}</span>
    </div>
  )
}