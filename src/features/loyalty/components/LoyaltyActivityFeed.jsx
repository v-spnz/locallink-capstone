import { Gift, RefreshCw, Sparkles } from 'lucide-react'

function formatOccurredAt(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat('en-NZ', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

export function LoyaltyActivityFeedSkeleton() {
  return (
    <div className="loyalty-activity-feed">
      <div className="loyalty-activity-toolbar">
        <h2>Recent activity</h2>
      </div>
      {[1, 2, 3].map((key) => (
        <div className="loyalty-activity-row is-skeleton" key={key} />
      ))}
    </div>
  )
}

export default function LoyaltyActivityFeed({
  activity,
  isLoading,
  requestError,
  onRefresh,
}) {
  return (
    <section
      className="loyalty-activity-feed"
      aria-labelledby="loyalty-activity-title"
    >
      <div className="loyalty-activity-toolbar">
        <div>
          <h2 id="loyalty-activity-title">Recent activity</h2>
          <p>See how customers are earning and redeeming rewards.</p>
        </div>
        <button
          type="button"
          className="loyalty-activity-refresh"
          onClick={onRefresh}
        >
          <RefreshCw size={14} aria-hidden="true" />
          Refresh
        </button>
      </div>

      {requestError && (
        <div className="auth-error loyalty-request-error" role="alert">
          {requestError}
          <button type="button" onClick={onRefresh}>
            Try again
          </button>
        </div>
      )}

      {isLoading && <LoyaltyActivityFeedSkeleton />}

      {!isLoading && !requestError && activity.length === 0 && (
        <p className="loyalty-activity-empty">
          No loyalty activity yet. Earning and redemption events will show up
          here as customers use your programmes.
        </p>
      )}

      {!isLoading &&
        activity.map((item) => (
          <div className="loyalty-activity-row" key={item.id}>
            <span
              className={`loyalty-activity-badge is-${item.type === 'reward_redeemed' ? 'redeem' : 'earn'}`}
            >
              {item.type === 'reward_redeemed' ? (
                <Gift size={14} aria-hidden="true" />
              ) : (
                <Sparkles size={14} aria-hidden="true" />
              )}
              {item.type === 'reward_redeemed'
                ? 'Redeemed'
                : item.type === 'reward_earned'
                  ? 'Reward earned'
                  : 'Progress added'}
            </span>
            <div className="loyalty-activity-main">
              <p className="loyalty-activity-programme">{item.programmeName}</p>
              <p className="loyalty-activity-detail">
                {item.detail}
                {' · '}
                {item.customerLabel}
              </p>
            </div>
            <time className="loyalty-activity-time" dateTime={item.occurredAt}>
              {formatOccurredAt(item.occurredAt)}
            </time>
          </div>
        ))}
    </section>
  )
}
