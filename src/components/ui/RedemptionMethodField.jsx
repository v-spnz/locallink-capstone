export default function RedemptionMethodField({
  children,
  label = 'Redemption method',
  ariaLabel,
}) {
  return (
    <div className="form-group" aria-label={ariaLabel}>
      <span className="form-label">{label}</span>
      <p className="deal-fixed-redemption">{children}</p>
    </div>
  )
}
