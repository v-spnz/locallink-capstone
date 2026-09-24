import { useLocation } from 'react-router-dom'
import ActiveClaimBanner from '../components/navigation/ActiveClaimBanner'

export default function PortalLayout({ navigation, children }) {
  const location = useLocation()
  const hideBanner =
    location.pathname === '/profile' ||
    location.pathname.startsWith('/business')

  return (
    <>
      {navigation}
      {!hideBanner && <ActiveClaimBanner />}
      <main className="portal-main">
        <div className="portal-main-content">{children}</div>
      </main>
    </>
  )
}
