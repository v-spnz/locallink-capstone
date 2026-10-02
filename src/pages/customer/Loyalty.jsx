import {
  Award,
  Gift,
  History,
  ScanLine,
  Search,
  UserPlus,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import Button from '../../components/ui/Button'
import QrCodeScanner from '../../components/ui/QrCodeScanner'
import ProgramCard from '../../features/loyalty/components/ProgramCard'
import useJoinLoyaltyProgramme from '../../features/loyalty/hooks/useJoinLoyaltyProgramme'
import useLoyaltyDiscovery from '../../features/loyalty/hooks/useLoyaltyDiscovery'
import useLoyaltyPrograms from '../../features/loyalty/hooks/useLoyaltyPrograms'
import { isEarlyEndGracePeriodActive } from '../../features/loyalty/businessLoyaltyTemplates'
import '../../features/loyalty/Loyalty.css'

export default function Loyalty() {
  const routerLocation = useLocation()
  const [searchParams] = useSearchParams()
  const requestedTab = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState(
    ['discover', 'cards', 'past'].includes(requestedTab)
      ? requestedTab
      : 'cards',
  )
  const [slide, setSlide] = useState('none')
  const discovery = useLoyaltyDiscovery()
  const loyalty = useLoyaltyPrograms()
  const { reload: reloadLoyaltyPrograms } = loyalty
  const [isCodeFormOpen, setIsCodeFormOpen] = useState(false)
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const join = useJoinLoyaltyProgramme(() => {
    setIsCodeFormOpen(false)
    setIsScannerOpen(false)
    discovery.reload()
    loyalty.reload()
  })

  const [autoOpenRecordId, setAutoOpenRecordId] = useState(() =>
    new URLSearchParams(routerLocation.search).get('record'),
  )
  const effectiveActiveTab = autoOpenRecordId ? 'cards' : activeTab

  useEffect(() => {
    const recordId = new URLSearchParams(routerLocation.search).get('record')
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (recordId) setAutoOpenRecordId(recordId)
  }, [routerLocation.search])

  function handleAutoOpenHandled() {
    setAutoOpenRecordId(null)
    const url = new URL(window.location.href)
    if (url.searchParams.has('record')) {
      url.searchParams.delete('record')
      window.history.replaceState(window.history.state, '', url)
    }
  }

  function switchTab(nextTab) {
    if (nextTab === activeTab) return
    const order = ['discover', 'cards', 'past']
    setSlide(
      order.indexOf(nextTab) > order.indexOf(activeTab) ? 'right' : 'left',
    )
    setIsCodeFormOpen(false)
    setIsScannerOpen(false)
    setActiveTab(nextTab)
  }

  useEffect(() => {
    if (effectiveActiveTab !== 'cards') return undefined
    const interval = window.setInterval(() => {
      reloadLoyaltyPrograms({ silent: true })
    }, 5000)
    return () => window.clearInterval(interval)
  }, [effectiveActiveTab, reloadLoyaltyPrograms])

  async function handleDiscoverJoin(joinCode) {
    const joined = await join.handleScannedCode(joinCode)
    if (joined) {
      discovery.reload()
      loyalty.reload()
      return true
    }
    return join.error || 'Unable to join right now. Please try again.'
  }

  function handleLeaveProgramme() {
    discovery.reload()
    loyalty.reload()
  }

  const [discoverySearch, setDiscoverySearch] = useState('')

  const notStartedBusinesses = discovery.businesses.filter(
    (business) => !business.isJoined,
  )
  const searchedDiscoverBusinesses = discoverySearch.trim()
    ? notStartedBusinesses.filter((business) => {
        const query = discoverySearch.trim().toLowerCase()
        return (
          business.businessName?.toLowerCase().includes(query) ||
          business.programmeName?.toLowerCase().includes(query)
        )
      })
    : notStartedBusinesses

  const activePrograms = loyalty.programs.filter(
    (program) =>
      program.programmeStatus === 'active' ||
      isEarlyEndGracePeriodActive(program),
  )
  const completedPrograms = loyalty.programs.filter(
    (program) =>
      program.programmeStatus === 'expired' ||
      (program.programmeStatus === 'ended_early' &&
        !isEarlyEndGracePeriodActive(program)),
  )

  const sortedActivePrograms = [...activePrograms].sort(
    (a, b) => (b.rewardEligible ? 1 : 0) - (a.rewardEligible ? 1 : 0),
  )

  return (
    <>
      <div className="page-header ly-page-header">
        <h2>Loyalty Programmes</h2>
        <p>Track your rewards and show your loyalty QR when you visit.</p>
      </div>

      <div className="ly-tabs" role="tablist" aria-label="Loyalty">
        <button
          type="button"
          role="tab"
          aria-selected={effectiveActiveTab === 'discover'}
          className={`ly-tab${effectiveActiveTab === 'discover' ? ' ly-tab--active' : ''}`}
          onClick={() => switchTab('discover')}
        >
          <Search aria-hidden="true" />
          Discover
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={effectiveActiveTab === 'cards'}
          className={`ly-tab${effectiveActiveTab === 'cards' ? ' ly-tab--active' : ''}`}
          onClick={() => switchTab('cards')}
        >
          <Award aria-hidden="true" />
          Your Loyalty Cards
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={effectiveActiveTab === 'past'}
          className={`ly-tab${effectiveActiveTab === 'past' ? ' ly-tab--active' : ''}`}
          onClick={() => switchTab('past')}
        >
          <History aria-hidden="true" />
          Previous Loyalty Programmes
        </button>
      </div>

      <div key={effectiveActiveTab} className={`ly-pane ly-pane--${slide}`}>
        {effectiveActiveTab === 'discover' && (
          <>
            {!isCodeFormOpen ? (
              <button
                type="button"
                className="ly-join-toggle"
                onClick={() => setIsCodeFormOpen(true)}
              >
                <UserPlus aria-hidden="true" />
                Have a join code instead?
              </button>
            ) : (
              <form
                className="ly-join-form"
                onSubmit={join.handleJoin}
                noValidate
              >
                <label htmlFor="ly-join-code">
                  Enter the business's join code
                </label>
                <div className="ly-join-controls">
                  <input
                    id="ly-join-code"
                    type="text"
                    inputMode="text"
                    autoCapitalize="characters"
                    autoCorrect="off"
                    autoComplete="off"
                    spellCheck="false"
                    placeholder="LJ-XXXX-XXXX"
                    value={join.code}
                    onChange={(event) => join.updateCode(event.target.value)}
                    disabled={join.isJoining}
                  />
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={() => setIsScannerOpen(true)}
                    disabled={join.isJoining}
                  >
                    <ScanLine aria-hidden="true" />
                    Scan
                  </Button>
                  <Button type="submit" disabled={join.isJoining}>
                    <Search aria-hidden="true" />
                    {join.isJoining ? 'Joining…' : 'Join'}
                  </Button>
                  <button
                    type="button"
                    className="ly-join-close"
                    aria-label="Cancel joining a programme"
                    onClick={() => {
                      setIsCodeFormOpen(false)
                      setIsScannerOpen(false)
                    }}
                  >
                    <X aria-hidden="true" />
                  </button>
                </div>
                {join.error && (
                  <div className="auth-error" role="alert">
                    {join.error}
                  </div>
                )}
              </form>
            )}

            {isScannerOpen && (
              <QrCodeScanner
                onCodeScanned={join.handleScannedCode}
                onClose={() => setIsScannerOpen(false)}
                title="Scan the business's join code"
                instructions="Hold the business's loyalty join code inside the camera frame."
                cameraErrorMessage="Camera access was unavailable. Enter the code instead."
              />
            )}

            <input
              type="text"
              className="ly-search"
              placeholder="Search businesses or programmes..."
              value={discoverySearch}
              onChange={(event) => setDiscoverySearch(event.target.value)}
            />

            {discovery.error && (
              <div className="auth-error" role="alert">
                {discovery.error}
              </div>
            )}

            {discovery.isLoading ? (
              <div className="loyalty-empty-state">
                Loading loyalty programmes near you…
              </div>
            ) : searchedDiscoverBusinesses.length > 0 ? (
              <div className="loyalty-program-grid">
                {searchedDiscoverBusinesses.map((business, index) => (
                  <ProgramCard
                    key={business.programmeId}
                    program={business}
                    index={index}
                    onJoin={handleDiscoverJoin}
                  />
                ))}
              </div>
            ) : (
              <div className="ly-empty-state">
                <span className="ly-empty-state-icon" aria-hidden="true">
                  <Gift />
                </span>
                <p>
                  {discoverySearch.trim()
                    ? `No businesses or programmes match "${discoverySearch.trim()}".`
                    : 'No new loyalty programmes to start in your suburb right now.'}
                </p>
              </div>
            )}
          </>
        )}

        {effectiveActiveTab === 'cards' && (
          <>
            <input
              type="text"
              className="ly-search"
              placeholder="Search your loyalty programmes..."
              value={loyalty.search}
              onChange={(event) => loyalty.setSearch(event.target.value)}
            />

            {loyalty.error && (
              <div className="auth-error loyalty-error" role="alert">
                {loyalty.error}
              </div>
            )}

            {loyalty.isLoading ? (
              <div className="loyalty-empty-state">
                Loading your programmes…
              </div>
            ) : sortedActivePrograms.length > 0 ? (
              <div className="loyalty-program-grid">
                {sortedActivePrograms.map((program, index) => (
                  <ProgramCard
                    key={program.id}
                    program={program}
                    index={index}
                    autoOpen={program.id === autoOpenRecordId}
                    onAutoOpenHandled={handleAutoOpenHandled}
                    onLeave={handleLeaveProgramme}
                  />
                ))}
              </div>
            ) : (
              <div className="ly-empty-state">
                <span className="ly-empty-state-icon" aria-hidden="true">
                  <Award />
                </span>
                <p>
                  No active programmes yet. Join one from the Discover tab to
                  start earning rewards.
                </p>
              </div>
            )}
          </>
        )}

        {effectiveActiveTab === 'past' && (
          <>
            {loyalty.isLoading ? (
              <div className="loyalty-empty-state">
                Loading your programmes…
              </div>
            ) : completedPrograms.length > 0 ? (
              <div className="loyalty-program-grid">
                {completedPrograms.map((program, index) => (
                  <ProgramCard
                    key={program.id}
                    program={program}
                    index={index}
                  />
                ))}
              </div>
            ) : (
              <div className="ly-empty-state">
                <span className="ly-empty-state-icon" aria-hidden="true">
                  <History />
                </span>
                <p>
                  No previous programmes yet. Programmes move here once they
                  expire.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
