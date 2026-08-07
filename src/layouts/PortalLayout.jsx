export default function PortalLayout({ navigation, children }) {
  return (
    <>
      {navigation}
      <main className="portal-main">
        <div className="portal-main-content">{children}</div>
      </main>
    </>
  )
}
