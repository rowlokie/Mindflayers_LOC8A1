import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Globe,
  Package,
  Target,
  BarChart3,
  TrendingUp,
  LogOut,
  User as UserIcon,
  Settings,
  Eye,
  Zap,
  ChevronRight,
} from 'lucide-react'
import {
  auth,
  signInWithGoogle,
  loginWithEmail,
  registerWithEmail,
  logout,
} from './firebase'
import { onAuthStateChanged } from 'firebase/auth'
import './index.css'

/* ─────────────────────────────────────────────
   Framer Motion preset
───────────────────────────────────────────── */
const fade = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.12 } },
}

/* ─────────────────────────────────────────────
   Logo Mark
───────────────────────────────────────────── */
function LogoMark({ size = 28 }) {
  return (
    <div style={{
      width: size, height: size,
      background: '#111827',
      borderRadius: 6,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <Zap size={size * 0.55} color="white" strokeWidth={2.5} />
    </div>
  )
}

/* ═══════════════════════════════════════════
   AUTH PAGE  (login + register tabs)
═══════════════════════════════════════════ */
function AuthPage() {
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  /* Google — popup flow */
  const handleGoogle = async () => {
    setError('')
    setLoading(true)
    try {
      await signInWithGoogle()
      // onAuthStateChanged in App will detect the user and switch to dashboard
    } catch (err) {
      setError(friendlyError(err.code))
      setLoading(false)
    }
  }

  /* Email submit */
  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'register') {
        if (!name.trim()) throw { code: 'custom/name-required' }
        await registerWithEmail(email, password, name.trim())
      } else {
        await loginWithEmail(email, password)
      }
      // onAuthStateChanged in App will do the rest
    } catch (err) {
      setError(friendlyError(err.code))
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <motion.div {...fade} className="auth-card">

        {/* Brand */}
        <div className="auth-logo">
          <LogoMark size={32} />
          <span className="auth-logo-text">TradePulse AI</span>
        </div>

        <h1 className="auth-title">
          {mode === 'login' ? 'Welcome back' : 'Create account'}
        </h1>
        <p className="auth-subtitle">
          {mode === 'login'
            ? 'Sign in to your workspace.'
            : 'Get started — it\'s free.'}
        </p>

        {/* Google */}
        <button
          id="btn-google"
          className="btn-google"
          onClick={handleGoogle}
          disabled={loading}
        >
          <GoogleIcon />
          {loading && mode !== 'register' ? 'Redirecting…' : 'Continue with Google'}
        </button>

        <div className="divider">or</div>

        {/* Error */}
        {error && <div className="error-banner">{error}</div>}

        {/* Email form */}
        <form onSubmit={handleEmailSubmit} id="auth-form">
          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label" htmlFor="i-name">Full Name</label>
              <input id="i-name" className="form-input" type="text"
                placeholder="Jane Smith" value={name}
                onChange={e => setName(e.target.value)} required />
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="i-email">Email</label>
            <input id="i-email" className="form-input" type="email"
              placeholder="you@company.com" value={email}
              onChange={e => setEmail(e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="i-password">Password</label>
            <input id="i-password" className="form-input" type="password"
              placeholder={mode === 'register' ? 'Min. 6 characters' : '••••••••'}
              value={password} onChange={e => setPassword(e.target.value)}
              required minLength={6} />
          </div>

          <button
            id="btn-submit"
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ marginTop: '0.25rem' }}
          >
            {loading
              ? 'Please wait…'
              : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <div className="auth-toggle">
          {mode === 'login' ? (
            <>Don't have an account?{' '}
              <button id="btn-to-register" onClick={() => { setMode('register'); setError('') }}>
                Sign up
              </button>
            </>
          ) : (
            <>Already have an account?{' '}
              <button id="btn-to-login" onClick={() => { setMode('login'); setError('') }}>
                Sign in
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   SIDEBAR
═══════════════════════════════════════════ */
const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'signals', label: 'Signals', icon: TrendingUp },
  { id: 'targets', label: 'Targets', icon: Target },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
]

function Sidebar({ user, activePage, onNavigate, onLogout }) {
  const initials = (user?.displayName || user?.email || 'U')
    .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-header">
        <div className="sidebar-logo-icon">
          <Zap size={14} strokeWidth={2.5} />
        </div>
        <span className="sidebar-logo-text">TradePulse AI</span>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <p className="nav-label">Main</p>
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            id={`nav-${id}`}
            className={`nav-item${activePage === id ? ' active' : ''}`}
            onClick={() => onNavigate(id)}
          >
            <Icon size={16} strokeWidth={1.75} />
            {label}
          </button>
        ))}

        <p className="nav-label" style={{ marginTop: '1.25rem' }}>Account</p>
        <button
          id="nav-profile"
          className={`nav-item${activePage === 'profile' ? ' active' : ''}`}
          onClick={() => onNavigate('profile')}
        >
          <UserIcon size={16} strokeWidth={1.75} />
          Profile
        </button>
        <button
          id="nav-settings"
          className={`nav-item${activePage === 'settings' ? ' active' : ''}`}
          onClick={() => onNavigate('settings')}
        >
          <Settings size={16} strokeWidth={1.75} />
          Settings
        </button>
      </nav>

      {/* User strip */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {user?.photoURL
              ? <img src={user.photoURL} alt="avatar" referrerPolicy="no-referrer" />
              : initials}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">
              {user?.displayName || user?.email?.split('@')[0] || 'User'}
            </div>
            <div className="sidebar-user-role">
              {user?.email}
            </div>
          </div>
          <button
            id="btn-logout"
            className="btn-ghost"
            onClick={onLogout}
            title="Sign out"
            style={{ padding: '0.25rem' }}
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  )
}

/* ═══════════════════════════════════════════
   DASHBOARD PAGE
═══════════════════════════════════════════ */
function DashboardPage({ user }) {
  const stats = [
    { label: 'Active Signals', value: '1,204', sub: '+12% this week' },
    { label: 'Qualified Leads', value: '87', sub: 'Ready for outreach' },
    { label: 'Intent Score', value: '91%', sub: 'Avg. this month' },
    { label: 'Markets Tracked', value: '24', sub: 'Across 6 regions' },
  ]

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">
          Welcome back, {user?.displayName?.split(' ')[0] || 'there'} — here's your intelligence snapshot
        </p>
      </div>
      <div className="page-body">
        <div className="stats-grid">
          {stats.map(s => (
            <div className="stat-card" key={s.label}>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-sub">{s.sub}</div>
            </div>
          ))}
        </div>

        <div className="content-card">
          <div className="card-title">Recent Signals</div>
          <div className="empty-state">
            <Eye size={28} strokeWidth={1.5} />
            <p>No signals yet. Your feed will populate once the agent scans markets.</p>
          </div>
        </div>

        <div className="content-card">
          <div className="card-title">Top Targets</div>
          <div className="empty-state">
            <Target size={28} strokeWidth={1.5} />
            <p>Run a market scan to discover and qualify trade leads.</p>
          </div>
        </div>
      </div>
    </>
  )
}

/* ═══════════════════════════════════════════
   PROFILE PAGE
═══════════════════════════════════════════ */
function ProfilePage({ user }) {
  const [role, setRole] = useState('exporter')
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    displayName: user?.displayName || '',
    phone: '',
    country: '',
    companyName: '',
    website: '',
    linkedinProfile: '',
    products: '',
    targetCountries: '',
    buyingRequirements: '',
    companySize: '',
    annualBudget: '',
  })

  const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }))

  const initials = (user?.displayName || user?.email || 'U')
    .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  const handleSave = e => {
    e.preventDefault()
    // TODO: POST to /api/profile/me with Bearer token
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Profile</h1>
        <p className="page-subtitle">Manage your account and trade details</p>
      </div>
      <div className="page-body">
        <div className="content-card">

          {/* Avatar row */}
          <div className="profile-avatar-section">
            <div className="profile-avatar">
              {user?.photoURL
                ? <img src={user.photoURL} alt="avatar" referrerPolicy="no-referrer" />
                : initials}
            </div>
            <div className="profile-avatar-info">
              <h3>{user?.displayName || 'User'}</h3>
              <p>{user?.email}</p>
            </div>
          </div>

          <hr className="section-divider" />

          <form id="profile-form" onSubmit={handleSave}>

            {/* Role chooser */}
            <p className="form-label" style={{ marginBottom: '0.625rem' }}>Your Role</p>
            <div className="role-grid" style={{ marginBottom: '1.25rem' }}>
              {[
                { id: 'exporter', label: 'Exporter', icon: Globe, desc: 'Scaling global sales' },
                { id: 'importer', label: 'Importer', icon: Package, desc: 'Sourcing elite suppliers' },
              ].map(({ id, label, icon: Icon, desc }) => (
                <div
                  key={id}
                  id={`role-${id}`}
                  className={`role-item${role === id ? ' selected' : ''}`}
                  onClick={() => setRole(id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="role-item-icon"><Icon size={24} strokeWidth={1.75} /></div>
                  <h3>{label}</h3>
                  <p>{desc}</p>
                </div>
              ))}
            </div>

            <hr className="section-divider" />
            <p className="card-title" style={{ marginBottom: '1rem' }}>Personal Details</p>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="pf-name">Display Name</label>
                <input id="pf-name" className="form-input" type="text"
                  value={form.displayName} onChange={set('displayName')} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="pf-email">Email</label>
                <input id="pf-email" className="form-input" type="email"
                  value={user?.email || ''} disabled style={{ opacity: 0.55 }} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="pf-phone">Phone</label>
                <input id="pf-phone" className="form-input" type="tel"
                  placeholder="+91 98765 43210" value={form.phone} onChange={set('phone')} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="pf-country">Country</label>
                <input id="pf-country" className="form-input" type="text"
                  placeholder="India" value={form.country} onChange={set('country')} />
              </div>
            </div>

            <hr className="section-divider" />
            <p className="card-title" style={{ marginBottom: '1rem' }}>Company Details</p>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="pf-company">Company Name</label>
                <input id="pf-company" className="form-input" type="text"
                  placeholder="Acme Corp" value={form.companyName} onChange={set('companyName')} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="pf-website">Website</label>
                <input id="pf-website" className="form-input" type="url"
                  placeholder="https://..." value={form.website} onChange={set('website')} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="pf-linkedin">LinkedIn</label>
              <input id="pf-linkedin" className="form-input" type="url"
                placeholder="https://linkedin.com/in/..." value={form.linkedinProfile} onChange={set('linkedinProfile')} />
            </div>

            <hr className="section-divider" />

            {/* Role-specific fields */}
            {role === 'exporter' ? (
              <>
                <p className="card-title" style={{ marginBottom: '1rem' }}>Exporter Details</p>
                <div className="form-group">
                  <label className="form-label" htmlFor="pf-products">Products / Categories</label>
                  <input id="pf-products" className="form-input" type="text"
                    placeholder="Textiles, Spices, Electronics" value={form.products} onChange={set('products')} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="pf-target">Target Countries</label>
                  <input id="pf-target" className="form-input" type="text"
                    placeholder="USA, UK, Germany" value={form.targetCountries} onChange={set('targetCountries')} />
                </div>
              </>
            ) : (
              <>
                <p className="card-title" style={{ marginBottom: '1rem' }}>Importer Details</p>
                <div className="form-group">
                  <label className="form-label" htmlFor="pf-buying">Buying Requirements</label>
                  <input id="pf-buying" className="form-input" type="text"
                    placeholder="Industrial machinery, raw materials" value={form.buyingRequirements} onChange={set('buyingRequirements')} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="pf-size">Company Size</label>
                    <select id="pf-size" className="form-input" value={form.companySize} onChange={set('companySize')}>
                      <option value="">Select…</option>
                      <option>1–10</option><option>11–50</option>
                      <option>51–200</option><option>200+</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="pf-budget">Annual Budget (USD)</label>
                    <input id="pf-budget" className="form-input" type="number"
                      placeholder="500000" value={form.annualBudget} onChange={set('annualBudget')} />
                  </div>
                </div>
              </>
            )}

            <button
              id="btn-save-profile"
              type="submit"
              className="btn-primary"
              style={{ marginTop: '0.5rem' }}
            >
              {saved ? '✓ Saved' : 'Save Changes'}
            </button>
          </form>

          <hr className="section-divider" />
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', wordBreak: 'break-all' }}>
            UID: {user?.uid}
          </p>
        </div>
      </div>
    </>
  )
}

/* ═══════════════════════════════════════════
   PLACEHOLDER PAGES
═══════════════════════════════════════════ */
function PlaceholderPage({ title, subtitle, icon: Icon }) {
  return (
    <>
      <div className="page-header">
        <h1 className="page-title">{title}</h1>
        <p className="page-subtitle">{subtitle}</p>
      </div>
      <div className="page-body">
        <div className="content-card">
          <div className="empty-state">
            <Icon size={32} strokeWidth={1.5} />
            <p>This section is coming soon.</p>
          </div>
        </div>
      </div>
    </>
  )
}

/* ═══════════════════════════════════════════
   DASHBOARD SHELL  (sidebar + content area)
═══════════════════════════════════════════ */
function DashboardShell({ user, onLogout }) {
  const [page, setPage] = useState('dashboard')

  const content = () => {
    switch (page) {
      case 'dashboard': return <DashboardPage user={user} />
      case 'signals': return <PlaceholderPage title="Signals" subtitle="Live intent signals from global markets" icon={TrendingUp} />
      case 'targets': return <PlaceholderPage title="Targets" subtitle="Qualified leads ready for outreach" icon={Target} />
      case 'analytics': return <PlaceholderPage title="Analytics" subtitle="Performance & channel insights" icon={BarChart3} />
      case 'profile': return <ProfilePage user={user} />
      case 'settings': return <PlaceholderPage title="Settings" subtitle="Configure your workspace" icon={Settings} />
      default: return <DashboardPage user={user} />
    }
  }

  return (
    <div className="app-shell">
      <Sidebar
        user={user}
        activePage={page}
        onNavigate={setPage}
        onLogout={onLogout}
      />
      <main className="main-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.18 } }}
            exit={{ opacity: 0 }}
          >
            {content()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}

/* ═══════════════════════════════════════════
   BACKEND SYNC — saves Firebase user to MongoDB
═══════════════════════════════════════════ */
const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

async function syncUserToBackend(firebaseUser) {
  try {
    const res = await fetch(`${BACKEND}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: firebaseUser.displayName || firebaseUser.email,
        email: firebaseUser.email,
        googleId: firebaseUser.uid,
        photoURL: firebaseUser.photoURL || '',
      }),
    })
    const data = await res.json()
    if (data.token) {
      localStorage.setItem('tp_token', data.token)
      console.log('✓ User synced to MongoDB:', data.user?.email)
    }
  } catch (err) {
    // Non-fatal: Firebase auth still works even if backend sync fails
    console.warn('Backend sync failed (non-fatal):', err.message)
  }
}

/* ═══════════════════════════════════════════
   ROOT APP  — single source of truth for auth state
═══════════════════════════════════════════ */
export default function App() {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Subscribe to Firebase auth — this is the ONLY router
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      setReady(true)

      if (firebaseUser) {
        // Sync to MongoDB every time a user session is detected
        await syncUserToBackend(firebaseUser)
      } else {
        localStorage.removeItem('tp_token')
      }
    })
    return unsub
  }, [])

  const handleLogout = async () => {
    await logout()
    // onAuthStateChanged will fire with null and update state automatically
  }

  if (!ready) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    )
  }

  return (
    <AnimatePresence mode="wait">
      {!user ? (
        <motion.div key="auth" {...fade} style={{ width: '100%' }}>
          <AuthPage />
        </motion.div>
      ) : (
        <motion.div key="dashboard" {...fade} style={{ height: '100vh', width: '100%' }}>
          <DashboardShell user={user} onLogout={handleLogout} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}


/* ═══════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════ */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

function friendlyError(code) {
  const map = {
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/invalid-credential': 'Invalid email or password.',
    'auth/email-already-in-use': 'This email is already registered.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/invalid-email': 'Please enter a valid email.',
    'auth/popup-closed-by-user': 'Sign-in was cancelled.',
    'auth/too-many-requests': 'Too many attempts. Please wait and try again.',
    'custom/name-required': 'Please enter your full name.',
  }
  return map[code] || 'Something went wrong. Please try again.'
}
