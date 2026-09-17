import './BouncingCirclesLoader.css'

export default function BouncingCirclesLoader({
  size = 100,
  circleSize = 20,
  circleCount = 10,
  color = 'bg-gray-800',
  speed = 1.2,
  className = '',
  label = 'Loading…',
}) {
  const circles = Array.from({
    length: Math.max(1, Math.floor(circleCount)),
  })
  const classes = ['bouncing-circles-loader', className]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={classes}
      style={{ width: size, height: size }}
      role="status"
      aria-label={label}
    >
      {circles.map((_, index) => (
        <span
          aria-hidden="true"
          className={`bouncing-circles-loader-dot ${color}`}
          key={index}
          style={{
            width: circleSize,
            height: circleSize,
            animationDuration: `${speed}s`,
            animationDelay: `${-index * 0.1}s`,
          }}
        />
      ))}
    </div>
  )
}
