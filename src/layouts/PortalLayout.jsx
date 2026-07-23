export default function PortalLayout({ navigation, children }) {
  return (
    <>
      {navigation}
      <main style={styles.main}>
        <div style={styles.content}>{children}</div>
      </main>
    </>
  )
}

const styles = {
  main: {
    minHeight: 'calc(100vh - 60px)',
    background: 'var(--bg)',
    padding: '40px 24px',
  },
  content: { maxWidth: 860, margin: '0 auto', width: '100%' },
}
