export default function SettingsHeading({ icon: Icon, title }) {
  return (
    <div className="business-settings-section-heading">
      {Icon && (
        <span aria-hidden="true">
          <Icon />
        </span>
      )}
      <h2>{title}</h2>
    </div>
  )
}
