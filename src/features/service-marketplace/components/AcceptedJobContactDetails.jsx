import { Mail, MapPin, Phone, ShieldCheck, UserRound } from 'lucide-react'

function ContactRow({ icon: Icon, label, children }) {
  if (!Icon || !children) return null

  return (
    <div>
      <dt>
        <Icon aria-hidden="true" />
        {label}
      </dt>
      <dd>{children}</dd>
    </div>
  )
}

export default function AcceptedJobContactDetails({ contactDetails, viewer }) {
  if (!contactDetails) return null

  const viewingAsConsumer = viewer === 'consumer'
  const name = viewingAsConsumer
    ? contactDetails.provider_name
    : contactDetails.consumer_name
  const contactName = viewingAsConsumer
    ? contactDetails.provider_contact_name
    : null
  const email = viewingAsConsumer
    ? contactDetails.provider_email
    : contactDetails.consumer_email
  const phone = viewingAsConsumer
    ? contactDetails.provider_phone
    : contactDetails.consumer_phone
  const address = viewingAsConsumer
    ? contactDetails.provider_address
    : contactDetails.consumer_address
  const title = viewingAsConsumer
    ? 'Accepted provider contact'
    : 'Customer contact'

  return (
    <section className="accepted-job-contact" aria-label={title}>
      <div className="accepted-job-contact-heading">
        <span className="accepted-job-contact-icon" aria-hidden="true">
          <ShieldCheck />
        </span>
        <div>
          <h3>{title}</h3>
          <p>
            Shared securely after acceptance and visible only to this customer
            and the accepted provider.
          </p>
        </div>
      </div>

      <dl className="accepted-job-contact-list">
        <ContactRow icon={UserRound} label="Name">
          {name || 'Not provided'}
          {contactName && contactName !== name ? ` · ${contactName}` : ''}
        </ContactRow>
        <ContactRow icon={Mail} label="Email">
          {email ? <a href={`mailto:${email}`}>{email}</a> : 'Not provided'}
        </ContactRow>
        {phone && (
          <ContactRow icon={Phone} label="Phone">
            <a href={`tel:${phone}`}>{phone}</a>
          </ContactRow>
        )}
        <ContactRow icon={MapPin} label="Saved address">
          {address || 'Not provided — confirm the job location by email.'}
        </ContactRow>
      </dl>
    </section>
  )
}
