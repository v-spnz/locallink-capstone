import blueWordmark from '../../assets/brand/locallink-wordmark-blue.svg'
import lightWordmark from '../../assets/brand/locallink-wordmark-light.svg'

export default function LocalLinkLogo({ tone = 'dark', className = '' }) {
  const src = tone === 'light' ? lightWordmark : blueWordmark

  return (
    <img
      className={className}
      src={src}
      alt=""
      aria-hidden="true"
      draggable="false"
    />
  )
}
