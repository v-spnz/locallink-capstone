import BouncingCirclesLoader from './BouncingCirclesLoader'
import './BusinessPageLoader.css'

export default function BusinessPageLoader({
  label = 'Loading business…',
  fullPage = false,
  contained = false,
}) {
  const classes = [
    'business-page-loader',
    fullPage && 'is-full-page',
    contained && 'is-contained',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <section className={classes} aria-busy="true">
      <BouncingCirclesLoader
        color="bg-[#3f5bd3]"
        label={label}
        size={100}
        circleSize={20}
        circleCount={10}
        speed={1.2}
      />
      <p aria-hidden="true">{label}</p>
    </section>
  )
}
