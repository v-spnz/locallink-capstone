export const MAX_STAMP_CIRCLES = 12

export default function StampRow({ earned, required, initial, showNext }) {
  const filled = Math.min(earned, required)
  const columns = required <= 6 ? required : Math.ceil(required / 2)

  return (
    <div
      className="ly-stamps"
      style={{ '--cols': columns }}
      role="img"
      aria-label={`${filled} of ${required} stamps`}
    >
      {Array.from({ length: required }, (_, index) => {
        const slot = index + 1
        let state = 'is-earned'
        if (slot > filled) {
          state = showNext && slot === filled + 1 ? 'is-next' : 'is-empty'
        }
        return (
          <span
            key={slot}
            className={`ly-stamp ${state}`}
            style={{ '--i': index }}
          >
            {state === 'is-earned' ? initial : slot}
          </span>
        )
      })}
    </div>
  )
}