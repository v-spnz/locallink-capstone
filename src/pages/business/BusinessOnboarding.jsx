import { useState } from 'react'
import {
  ArrowRight,
  BadgePercent,
  BriefcaseBusiness,
  Check,
  Gift,
} from 'lucide-react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import AuthPageHeader from '../../components/auth/AuthPageHeader'
import useBusiness from '../../business/useBusiness'
import { supabase } from '../../lib/supabase'
import './BusinessOnboarding.css'

const CAPABILITY_OPTIONS = [
  {
    key: 'deals',
    label: 'Promote deals',
    description: 'Publish useful local offers for nearby customers.',
    icon: BadgePercent,
  },
  {
    key: 'loyalty',
    label: 'Run loyalty programmes',
    description: 'Create repeat-visit rewards and loyalty cards.',
    icon: Gift,
  },
  {
    key: 'serviceMarketplace',
    label: 'Receive service requests',
    description: 'Find local job leads and send quotes.',
    icon: BriefcaseBusiness,
  },
]

function listFromInput(value) {
  return [
    ...new Set(
      value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ]
}

export default function BusinessOnboarding() {
  const navigate = useNavigate()
  const { membership, isLoading, refreshBusiness } = useBusiness()
  const [form, setForm] = useState({
    businessName: '',
    description: '',
    deals: true,
    loyalty: false,
    serviceMarketplace: false,
    serviceDescription: '',
    availability: '',
    categories: '',
    areas: '',
    locations: '',
  })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  function toggleCapability(key) {
    setForm((current) => ({ ...current, [key]: !current[key] }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (form.businessName.trim().length < 2) {
      setError('Enter your business name.')
      return
    }

    if (!form.deals && !form.loyalty && !form.serviceMarketplace) {
      setError('Select at least one way to use LocalLink.')
      return
    }

    const categories = listFromInput(form.categories)
    const areas = listFromInput(form.areas)
    const locations = listFromInput(form.locations)

    if (form.deals && locations.length === 0) {
      setError('Enter at least one location that can participate in deals.')
      return
    }

    if (
      form.serviceMarketplace &&
      (form.serviceDescription.trim().length < 10 ||
        !form.availability.trim() ||
        categories.length === 0 ||
        areas.length === 0)
    ) {
      setError('Complete all Service Marketplace details.')
      return
    }

    setIsSubmitting(true)

    const { error: createError } = await supabase.rpc(
      'create_business_with_owner',
      {
        p_business_name: form.businessName.trim(),
        p_description: form.description.trim(),
        p_deals_enabled: form.deals,
        p_loyalty_enabled: form.loyalty,
        p_service_marketplace_enabled: form.serviceMarketplace,
        p_service_description: form.serviceMarketplace
          ? form.serviceDescription.trim()
          : null,
        p_availability: form.serviceMarketplace
          ? form.availability.trim()
          : null,
        p_categories: form.serviceMarketplace ? categories : [],
        p_areas: form.serviceMarketplace ? areas : [],
        p_locations: form.deals ? locations : [],
      },
    )

    if (createError) {
      setError('Unable to create the business account. Please try again.')
      setIsSubmitting(false)
      return
    }

    await refreshBusiness()
    navigate('/business/analytics', { replace: true })
  }

  if (isLoading) {
    return <div className="business-onboarding-state">Loading account…</div>
  }

  if (membership) {
    return <Navigate to="/business/analytics" replace />
  }

  return (
    <div className="business-onboarding-page">
      <AuthPageHeader />

      <main className="business-onboarding-main">
        <section className="business-onboarding-intro">
          <div className="business-onboarding-mark" aria-hidden="true">
            <BriefcaseBusiness />
          </div>
          <div className="business-onboarding-eyebrow">Business setup</div>
          <h1>Bring your business to LocalLink.</h1>
          <p>
            Choose the tools you need now. Your personal LocalLink access stays
            available, and more business capabilities can be added later.
          </p>
          <Link to="/home">Continue with personal access instead</Link>
        </section>

        <section className="business-onboarding-card">
          <form onSubmit={handleSubmit} noValidate>
            <div className="business-onboarding-section">
              <span className="business-step">01</span>
              <div>
                <h2>Business details</h2>
                <p>Tell customers who they will be dealing with.</p>
              </div>
            </div>

            <label className="business-onboarding-field">
              <span>Business name</span>
              <input
                name="businessName"
                value={form.businessName}
                onChange={updateField}
                placeholder="e.g. Morgan Plumbing"
                disabled={isSubmitting}
                required
              />
            </label>

            <label className="business-onboarding-field">
              <span>Business description</span>
              <textarea
                name="description"
                value={form.description}
                onChange={updateField}
                placeholder="A short introduction to your business"
                rows="3"
                maxLength="1000"
                disabled={isSubmitting}
              />
            </label>

            <div className="business-onboarding-section capability-heading">
              <span className="business-step">02</span>
              <div>
                <h2>How will you use LocalLink?</h2>
                <p>Select one or more capabilities.</p>
              </div>
            </div>

            <div className="business-capability-options">
              {CAPABILITY_OPTIONS.map((option) => {
                const Icon = option.icon
                const selected = form[option.key]

                return (
                  <button
                    key={option.key}
                    type="button"
                    className={selected ? 'selected' : ''}
                    onClick={() => toggleCapability(option.key)}
                    aria-pressed={selected}
                    disabled={isSubmitting}
                  >
                    <span className="business-capability-icon">
                      <Icon aria-hidden="true" />
                    </span>
                    <span>
                      <strong>{option.label}</strong>
                      <small>{option.description}</small>
                    </span>
                    <Check className="business-capability-check" />
                  </button>
                )
              })}
            </div>

            {form.deals && (
              <label className="business-onboarding-field">
                <span>Business locations</span>
                <input
                  name="locations"
                  value={form.locations}
                  onChange={updateField}
                  placeholder="Ponsonby store, Newmarket store"
                  disabled={isSubmitting}
                  required
                />
                <small>
                  Separate locations with commas. You can choose from these when
                  preparing a deal.
                </small>
              </label>
            )}

            {form.serviceMarketplace && (
              <div className="business-service-setup">
                <div className="business-onboarding-section">
                  <span className="business-step">03</span>
                  <div>
                    <h2>Service Marketplace details</h2>
                    <p>
                      Used to match your business with suitable local leads.
                    </p>
                  </div>
                </div>

                <label className="business-onboarding-field">
                  <span>Service description</span>
                  <textarea
                    name="serviceDescription"
                    value={form.serviceDescription}
                    onChange={updateField}
                    placeholder="Describe the services you provide"
                    rows="3"
                    disabled={isSubmitting}
                    required
                  />
                </label>

                <div className="business-onboarding-field-grid">
                  <label className="business-onboarding-field">
                    <span>Service categories</span>
                    <input
                      name="categories"
                      value={form.categories}
                      onChange={updateField}
                      placeholder="Plumbing, Roofing"
                      disabled={isSubmitting}
                      required
                    />
                    <small>Separate multiple categories with commas.</small>
                  </label>

                  <label className="business-onboarding-field">
                    <span>Service areas</span>
                    <input
                      name="areas"
                      value={form.areas}
                      onChange={updateField}
                      placeholder="Takapuna, Albany"
                      disabled={isSubmitting}
                      required
                    />
                    <small>Separate multiple areas with commas.</small>
                  </label>
                </div>

                <label className="business-onboarding-field">
                  <span>Availability</span>
                  <input
                    name="availability"
                    value={form.availability}
                    onChange={updateField}
                    placeholder="e.g. Monday–Friday, 8am–5pm"
                    disabled={isSubmitting}
                    required
                  />
                </label>

                <p className="business-verification-note">
                  Service Marketplace verification starts as pending. Required
                  evidence and approval steps can be added once confirmed.
                </p>
              </div>
            )}

            {error && (
              <div
                className="auth-error business-onboarding-error"
                role="alert"
              >
                {error}
              </div>
            )}

            <button
              className="business-onboarding-submit"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating business…' : 'Open business dashboard'}
              {!isSubmitting && <ArrowRight aria-hidden="true" />}
            </button>
          </form>
        </section>
      </main>
    </div>
  )
}
