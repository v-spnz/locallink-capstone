import {
  Award,
  BadgeCheck,
  Gift,
  ScanLine,
  Search,
  UserPlus,
  X,
} from 'lucide-react'
import { useState } from 'react'
import Button from '../../components/ui/Button'
import QrCodeScanner from '../../components/ui/QrCodeScanner'
import DiscoverLoyaltyCard from '../../features/loyalty/components/DiscoverLoyaltyCard'
import ProgramCard from '../../features/loyalty/components/ProgramCard'
import useJoinLoyaltyProgramme from '../../features/loyalty/hooks/useJoinLoyaltyProgramme'
import useLoyaltyDiscovery from '../../features/loyalty/hooks/useLoyaltyDiscovery'
import useLoyaltyPrograms from '../../features/loyalty/hooks/useLoyaltyPrograms'
import '../../features/loyalty/Loyalty.css'
import '../../features/service-marketplace/ServiceMarketplace.css'

export default function Loyalty() {
  const [activeTab, setActiveTab] = useState('discover')
  const discovery = useLoyaltyDiscovery()
  const loyalty = useLoyaltyPrograms()
  const [isCodeFormOpen, setIsCodeFormOpen] = useState(false)
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const join = useJoinLoyaltyProgramme(() => {
    setIsCodeFormOpen(false)
    setIsScannerOpen(false)
    discovery.reload()
    loyalty.reload()
  })

  async function handleDiscoverJoin(joinCode) {
    const joined = await join.handleScannedCode(joinCode)
    if (joined) {
      discovery.reload()
      loyalty.reload()
      return true
    }
    // join.error now holds the real reason (e.g. the Postgres message
    // from join_loyalty_programme) rather than a generic fallback.
    return join.error || 'Unable to join right now. Please try again.'
  }

  // A joined-but-not-yet-stamped card (progress still at 0) stays visible
  // in Discover ("Joined — 0/X"), but doesn't clutter this tab until the
  // customer has actually gained some progress.
  const activePrograms = loyalty.programs.filter(
    (program) =>
      program.programmeStatus === 'active' && program.currentProgress > 0,
  )
  const pastPrograms = loyalty.programs.filter(
    (program) =>
      program.programmeStatus !== 'active' && program.currentProgress > 0,
  )
  const activeInProgress = activePrograms.filter(
    (program) => !program.rewardEligible,
  )
  const activeRewardReady = activePrograms.filter(
    (program) => program.rewardEligible,
  )
  const cardsList =
    loyalty.tab === 'inprogress' ? activeInProgress : activeRewardReady

  return (
    <>
      <div className="page-header">
        <h2>Loyalty Programmes</h2>
        <p>Track your rewards and show your loyalty QR when you visit.</p>
      </div>

      <div className="sm-tabs" role="tablist" aria-label="Loyalty">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'discover'}
          className={activeTab === 'discover' ? 'active' : ''}
          onClick={() => setActiveTab('discover')}
        >
          <Search aria-hidden="true" />
          Discover
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'cards'}
          className={activeTab === 'cards' ? 'active' : ''}
          onClick={() => setActiveTab('cards')}
        >
          <Award aria-hidden="true" />
          Your Loyalty Cards
          <span className="marketplace-tab-count">
            {activePrograms.length}
          </span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'past'}
          className={activeTab === 'past' ? 'active' : ''}
          onClick={() => setActiveTab('past')}
        >
          <BadgeCheck aria-hidden="true" />
          Past Loyalty Cards
          <span className="marketplace-tab-count">{pastPrograms.length}</span>
        </button>
      </div>

      {activeTab === 'discover' && (
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
                  onClick={() => setIsCodeFormOpen(false)}
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

          {discovery.error && (
            <div className="auth-error" role="alert">
              {discovery.error}
            </div>
          )}

          {discovery.isLoading ? (
            <div className="loyalty-empty-state">
              Loading loyalty programmes near you…
            </div>
          ) : discovery.businesses.length > 0 ? (
            <div className="loyalty-program-grid">
              {discovery.businesses.map((business) => (
                <DiscoverLoyaltyCard
                  key={business.programmeId}
                  business={business}
                  onJoin={handleDiscoverJoin}
                />
              ))}
            </div>
          ) : (
            <div className="loyalty-empty-state">
              <div aria-hidden="true">
                <Gift />
              </div>
              No loyalty programmes are active in your suburb right now.
            </div>
          )}
        </>
      )}

      {activeTab === 'cards' && (
        <>
          <input
            type="text"
            className="ly-search"
            placeholder="Search your loyalty programmes..."
            value={loyalty.search}
            onChange={(event) => loyalty.setSearch(event.target.value)}
          />

          <div className="tab-row">
            <button
              className={`tab-btn${loyalty.tab === 'inprogress' ? ' active' : ''}`}
              onClick={() => loyalty.setTab('inprogress')}
            >
              In Progress ({activeInProgress.length})
            </button>
            <button
              className={`tab-btn${loyalty.tab === 'ready' ? ' active' : ''}`}
              onClick={() => loyalty.setTab('ready')}
            >
              Reward ready ({activeRewardReady.length})
            </button>
          </div>

          {loyalty.error && (
            <div className="auth-error loyalty-error" role="alert">
              {loyalty.error}
            </div>
          )}

          {loyalty.isLoading ? (
            <div className="loyalty-empty-state">
              Loading your programmes…
            </div>
          ) : cardsList.length > 0 ? (
            <div className="loyalty-program-grid">
              {cardsList.map((program, index) => (
                <ProgramCard key={program.id} program={program} index={index} />
              ))}
            </div>
          ) : (
            <div className="loyalty-empty-state">
              <div aria-hidden="true">
                {loyalty.tab === 'inprogress' ? '☕' : '🎉'}
              </div>
              {loyalty.tab === 'inprogress'
                ? 'No active programmes yet — join one from Discover!'
                : 'No rewards are ready yet — keep going!'}
            </div>
          )}
        </>
      )}

      {activeTab === 'past' && (
        <>
          {loyalty.isLoading ? (
            <div className="loyalty-empty-state">
              Loading your programmes…
            </div>
          ) : pastPrograms.length > 0 ? (
            <div className="loyalty-program-grid">
              {pastPrograms.map((program, index) => (
                <ProgramCard key={program.id} program={program} index={index} />
              ))}
            </div>
          ) : (
            <div className="loyalty-empty-state">
              <div aria-hidden="true">
                <BadgeCheck />
              </div>
              No past loyalty cards yet — cards move here once a programme
              ends.
            </div>
          )}
        </>
      )}
    </>
  )
}
