import Button from '../../../components/ui/Button'
import { ReceiptText, Tag } from 'lucide-react'

function DetailRow({ label, value }) {
  return (
    <div className="deal-detail-row">
      <dt>{label}</dt>
      <dd>{value || 'Not set'}</dd>
    </div>
  )
}

export default function DealDetails({ id, deal, onClose, onEdit }) {
  return (
    <div id={id} className="deal-details">
      <div className="deal-details-heading">
        <div>
          <h3>Deal details</h3>
          <p>Claim limits, customer terms and redemption information.</p>
        </div>
      </div>

      <div className="deal-detail-sections">
        <section className="deal-detail-section">
          <div className="deal-detail-section-heading">
            <Tag aria-hidden="true" />
            <h4>Claim details</h4>
          </div>
          <dl className="deal-detail-list">
            <DetailRow
              label="Claim limit"
              value={deal.claimLimit ? `${deal.claimLimit} total claims` : ''}
            />
            <DetailRow
              label="How to redeem"
              value={deal.redemptionInstructions}
            />
          </dl>
        </section>

        <section className="deal-detail-section">
          <div className="deal-detail-section-heading">
            <ReceiptText aria-hidden="true" />
            <h4>Conditions and exclusions</h4>
          </div>
          <dl className="deal-detail-list">
            <DetailRow label="Conditions" value={deal.conditions} />
            <DetailRow label="Exclusions" value={deal.exclusions} />
          </dl>
        </section>
      </div>

      <div className="deal-actions">
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
        <Button onClick={onEdit}>
          {deal.status === 'draft' ? 'Continue draft' : 'Edit deal'}
        </Button>
      </div>
    </div>
  )
}
