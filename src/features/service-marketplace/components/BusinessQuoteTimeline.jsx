import { Check } from 'lucide-react'
import {
  getBusinessQuoteResponseDeadline,
  getBusinessQuoteTimeline,
} from '../quoteTracking'

export default function BusinessQuoteTimeline({ quote }) {
  const steps = getBusinessQuoteTimeline(quote)
  const responseDeadline = getBusinessQuoteResponseDeadline(quote)
  const timelineTone =
    quote.quote_status === 'accepted'
      ? 'success'
      : quote.quote_status === 'awaiting_response'
        ? 'progress'
        : 'terminal'

  return (
    <ol
      className={`service-quote-timeline is-${timelineTone}`}
      aria-label="Quote progress"
    >
      {steps.map((step, index) => (
        <li
          className={`service-quote-timeline-step is-${step.state}`}
          key={step.label}
          aria-current={step.state === 'current' ? 'step' : undefined}
        >
          <span className="service-quote-timeline-marker" aria-hidden="true">
            {step.state === 'complete' ? <Check /> : index + 1}
          </span>
          <span className="service-quote-timeline-copy">
            <span className="service-quote-timeline-label">{step.label}</span>
            {quote.quote_status === 'awaiting_response' &&
              step.label === 'Awaiting response' && (
                <span className="service-quote-timeline-deadline">
                  {responseDeadline ? (
                    <>
                      Consumer deadline:{' '}
                      {responseDeadline.toLocaleDateString('en-NZ', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </>
                  ) : (
                    'Consumer deadline unavailable'
                  )}
                </span>
              )}
          </span>
        </li>
      ))}
    </ol>
  )
}
