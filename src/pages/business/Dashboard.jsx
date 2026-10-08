import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BadgePercent, BriefcaseBusiness, Gift } from 'lucide-react'
import useBusiness from '../../business/useBusiness'
import BusinessProfileSnapshot from '../../features/dashboard/components/BusinessProfileSnapshot'
import DashboardHeader from '../../features/dashboard/components/DashboardHeader'
import DashboardQuickLinks from '../../features/dashboard/components/DashboardQuickLinks'
import CategoryPerformanceSection from '../../features/dashboard/components/CategoryPerformanceSection'
import DealPerformanceSection from '../../features/dashboard/components/DealPerformanceSection'
import DealStatusOverview from '../../features/dashboard/components/DealStatusOverview'
import PerformanceOverview from '../../features/dashboard/components/PerformanceOverview'
import RedemptionCallToAction from '../../features/dashboard/components/RedemptionCallToAction'
import WorkspaceModules from '../../features/dashboard/components/WorkspaceModules'
import {
  formatRecordedCurrency,
  getDealStatusSummary,
  getDefaultDashboardDateRange,
} from '../../features/dashboard/dashboardPresentation'
import useBusinessDashboardAnalytics from '../../features/dashboard/hooks/useBusinessDashboardAnalytics'
import '../../features/dashboard/Dashboard.css'

export default function Dashboard() {
  const {
    business,
    capabilities,
    membership,
    serviceProfile,
    serviceCategories,
    serviceAreas,
  } = useBusiness()
  const analyticsPeriod = useMemo(() => getDefaultDashboardDateRange(), [])
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedDealId = searchParams.get('deal')

  function selectDeal(dealId) {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      next.set('deal', dealId)
      return next
    })
  }

  function clearSelectedDeal() {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      next.delete('deal')
      return next
    })
  }
  const {
    metrics,
    dealPerformance,
    deals,
    dealsFailed,
    dealsLoading,
    isLoading,
    error,
    reload,
  } = useBusinessDashboardAnalytics(analyticsPeriod)
  const dealSummary = useMemo(() => getDealStatusSummary(deals), [deals])
  const verificationLabel = business.verification_status
    .replaceAll('_', ' ')
    .replace(/^\w/, (character) => character.toUpperCase())
  const modules = [
    capabilities.deals_enabled && {
      title: 'Deals',
      description: 'Create and manage offers for nearby customers.',
      detail: 'Location-based promotions',
      to: '/business/create-deal',
      icon: BadgePercent,
      className: 'is-deals',
    },
    capabilities.loyalty_enabled && {
      title: 'Loyalty',
      description: 'Build programmes that reward repeat visits.',
      detail: 'Private programme drafts',
      to: '/business/create-loyalty',
      icon: Gift,
      className: 'is-loyalty',
    },
    capabilities.service_marketplace_enabled && {
      title: 'Services',
      description: 'Review matched job leads, quotes and active work.',
      detail: `${serviceCategories.length} ${serviceCategories.length === 1 ? 'category' : 'categories'}, ${serviceAreas.length} ${serviceAreas.length === 1 ? 'area' : 'areas'}`,
      to: '/business/services',
      icon: BriefcaseBusiness,
      className: 'is-services',
    },
  ].filter(Boolean)
  const recordedTransactionValue = formatRecordedCurrency(
    metrics?.recordedTransactionValueCents,
  )
  const recordedCustomerSavings = formatRecordedCurrency(
    metrics?.recordedCustomerSavingsCents,
  )
  const recordedAverageTransaction = formatRecordedCurrency(
    metrics?.averageRecordedTransactionCents,
  )

  return (
    <div className="business-dashboard">
      <DashboardHeader business={business} membership={membership} />

      <PerformanceOverview
        analyticsPeriod={analyticsPeriod}
        metrics={metrics}
        capabilities={capabilities}
        moduleCount={modules.length}
        isLoading={isLoading}
        error={error}
        reload={reload}
        recordedTransactionValue={recordedTransactionValue}
        recordedCustomerSavings={recordedCustomerSavings}
        recordedAverageTransaction={recordedAverageTransaction}
      />

      {capabilities.deals_enabled &&
        !dealsLoading &&
        (dealsFailed ? (
          <section className="business-dashboard-section">
            <div className="business-performance-error" role="alert">
              <div>
                <strong>Deal status is unavailable</strong>
                <p>Unable to load your deals. Please try again.</p>
              </div>
              <button type="button" onClick={reload}>
                Try again
              </button>
            </div>
          </section>
        ) : (
          <DealStatusOverview summary={dealSummary} />
        ))}

      {capabilities.deals_enabled && !isLoading && !error && metrics && (
        <DealPerformanceSection
          deals={dealPerformance}
          period={analyticsPeriod}
          selectedDealId={selectedDealId}
          onSelect={selectDeal}
          onBack={clearSelectedDeal}
        />
      )}

      {capabilities.deals_enabled &&
        !isLoading &&
        !error &&
        metrics &&
        !selectedDealId && (
          <CategoryPerformanceSection
            deals={dealPerformance}
            period={analyticsPeriod}
            onSelect={selectDeal}
          />
        )}

      {capabilities.deals_enabled && <RedemptionCallToAction />}

      <WorkspaceModules modules={modules} />

      <div className="business-dashboard-lower-grid">
        <BusinessProfileSnapshot
          business={business}
          verificationLabel={verificationLabel}
          moduleCount={modules.length}
          capabilities={capabilities}
          serviceAreas={serviceAreas}
          serviceProfile={serviceProfile}
        />

        <DashboardQuickLinks capabilities={capabilities} />
      </div>
    </div>
  )
}
