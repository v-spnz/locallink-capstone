import { useNavigate } from 'react-router-dom'

export default function Login() {
  const navigate = useNavigate()

  return (
    <div style={{ maxWidth: 420, margin: '0 auto' }}>
      <div
        className="page-header"
        style={{ textAlign: 'center', marginBottom: 32 }}
      >
        <h2>Business Portal</h2>
        <p>Sign in to manage your LocalLink business presence.</p>
      </div>
      <div className="tab-row" style={{ margin: '0 auto 24px' }}>
        <button className="tab-btn active">Login</button>
        <button className="tab-btn">Register</button>
      </div>
      <div className="form-group">
        <label className="form-label">Business Email</label>
        <input
          className="form-input"
          type="email"
          placeholder="hello@yourbusiness.co.nz"
          disabled
        />
      </div>
      <div className="form-group">
        <label className="form-label">Password</label>
        <input
          className="form-input"
          type="password"
          placeholder="••••••••"
          disabled
        />
      </div>
      <button
        className="btn-primary"
        style={{ width: '100%', marginTop: 8 }}
        onClick={() => navigate('/business/analytics')}
      >
        Enter Dashboard →
      </button>
    </div>
  )
}
