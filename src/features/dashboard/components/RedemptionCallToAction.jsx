import { ArrowRight, ScanLine } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function RedemptionCallToAction() {
  return (
    <section
      className="business-redemption-cta"
      aria-labelledby="business-redemption-cta-title"
    >
      <div className="business-redemption-cta-copy">
        <span aria-hidden="true">
          <ScanLine />
        </span>
        <div>
          <h2 id="business-redemption-cta-title">Redeem a customer deal</h2>
          <p>
            Scan a customer QR code. Manual entry is available on the same
            screen.
          </p>
        </div>
      </div>
      <Link
        className="business-redemption-cta-action"
        to="/business/create-deal?redeem=scan"
      >
        Scan QR code
        <ArrowRight aria-hidden="true" />
      </Link>
    </section>
  )
}
