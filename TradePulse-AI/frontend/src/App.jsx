import React, { useState, useEffect, useCallback } from 'react'
console.log('TradePulse App.jsx Loaded');
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Globe, Package, Target, BarChart3, TrendingUp,
  LogOut, User as UserIcon, Settings, Zap, Clock, CheckCircle,
  XCircle, Shield, ChevronRight, Star, MapPin, Award, AlertCircle,
  Users, Trash2, Ban, UserCheck, RotateCcw, Search, ChevronDown, FileText,
  Heart, MessageSquare, Video, Calendar, Moon, Sun, Sparkles, Beaker,
} from 'lucide-react'
import { auth, signInWithGoogle, loginWithEmail, registerWithEmail, logout } from './firebase'
import { onAuthStateChanged } from 'firebase/auth'
import SwipePage from './pages/SwipePage'
import ConnectionsPage from './pages/ConnectionsPage'
import MeetingsPage from './pages/MeetingsPage'
import SettingsPage from './pages/SettingsPage'
import MatchesPage from './pages/MatchesPage'
import AnalyticsPage from './pages/AnalyticsPage'
import AlgorithmLab from './pages/AlgorithmLab'
import AIChatbot from './components/AIChatbot'
import './index.css'

/* ── Constants ──────────────────────────────────────────────────── */
const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

const INDUSTRIES = ['Steel', 'Textile', 'Electronics', 'Pharma', 'Agriculture', 'Chemicals', 'Automotive', 'Food & Beverages', 'Machinery', 'Medical Devices']
const COUNTRIES = ['USA', 'Germany', 'India', 'UAE', 'UK', 'China', 'Japan', 'France', 'Canada', 'Australia', 'Brazil', 'Saudi Arabia', 'South Korea', 'Netherlands', 'Italy', 'Spain', 'Singapore', 'Malaysia']
const REGIONS = ['Asia', 'Europe', 'North America', 'South America', 'Middle East', 'Africa', 'Oceania']
const CERTS = ['ISO 9001', 'ISO 14001', 'FDA', 'CE', 'OEKO-TEX', 'GMP', 'HACCP', 'BRC', 'SA8000', 'REACH']
const URGENCIES = ['Immediate', '1 Month', '3 Months', '6 Months']
const SIZES = ['Small business', 'Mid-size', 'Large enterprise']
const RISKS = ['low', 'medium', 'high']
const BUDGET_LABELS = { low: '$10k – $50k', medium: '$50k – $500k', high: '$500k+' }

const fade = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0, transition: { duration: 0.2 } }, exit: { opacity: 0, transition: { duration: 0.12 } } }

/* ── API helpers ────────────────────────────────────────────────── */
const api = async (path, opts = {}) => {
  const token = localStorage.getItem('tp_token')
  const res = await fetch(`${BACKEND}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...opts,
  })
  return res.json()
}

/* ── Logo ───────────────────────────────────────────────────────── */
function LogoMark({ size = 28 }) {
  return (
    <div style={{ width: size, height: size, background: '#111827', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Zap size={size * 0.55} color="white" strokeWidth={2.5} />
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   AUTH PAGE
══════════════════════════════════════════════════════════════════ */
function AuthPage() {
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleGoogle = async () => {
    setError(''); setLoading(true)
    try { await signInWithGoogle() }
    catch (e) { setError(friendlyError(e.code)); setLoading(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      if (mode === 'register') {
        if (!name.trim()) throw { code: 'custom/name' }
        await registerWithEmail(email, password, name.trim())
      } else {
        await loginWithEmail(email, password)
      }
    } catch (e) { setError(friendlyError(e.code)); setLoading(false) }
  }

  return (
    <div className="auth-page">
      <motion.div {...fade} className="auth-card">
        <div className="auth-logo"><LogoMark size={32} /><span className="auth-logo-text">TradePulse AI</span></div>
        <h1 className="auth-title">{mode === 'login' ? 'Welcome back' : 'Create account'}</h1>
        <p className="auth-subtitle">{mode === 'login' ? 'Sign in to your workspace.' : 'Start your trade journey.'}</p>

        <button id="btn-google" className="btn-google" onClick={handleGoogle} disabled={loading}>
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
          {loading ? 'Please wait…' : 'Continue with Google'}
        </button>

        <div className="divider">or</div>
        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" type="text" placeholder="Jane Smith" value={name} onChange={e => setName(e.target.value)} required />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" placeholder={mode === 'register' ? 'Min. 6 characters' : '••••••••'} value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
          </div>
          <button id="btn-submit" type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '0.25rem' }}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <div className="auth-toggle">
          {mode === 'login' ? <>Don't have an account? <button onClick={() => { setMode('register'); setError('') }}>Sign up</button></>
            : <>Already have an account? <button onClick={() => { setMode('login'); setError('') }}>Sign in</button></>}
        </div>
      </motion.div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   ROLE SELECTION — one-time, locked forever
══════════════════════════════════════════════════════════════════ */
function RolePage({ firebaseUser, onRoleSet }) {
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleContinue = async () => {
    if (!selected) return
    setLoading(true); setError('')
    try {
      const data = await api('/api/profile/role', { method: 'POST', body: JSON.stringify({ role: selected }) })
      if (data.role) onRoleSet(data.role)
      else setError(data.message || 'Failed to set role.')
    } catch { setError('Network error.') }
    setLoading(false)
  }

  const ROLES = [
    { id: 'exporter', label: 'Exporter', icon: Globe, desc: 'Scale global sales & find buyers' },
    { id: 'importer', label: 'Importer', icon: Package, desc: 'Source elite suppliers worldwide' },
  ]

  return (
    <div className="role-page">
      <motion.div {...fade} className="role-card-wrapper">
        <div className="auth-logo" style={{ marginBottom: '1.5rem' }}><LogoMark size={28} /><span className="auth-logo-text">TradePulse AI</span></div>
        <h1 className="auth-title" style={{ fontSize: '1.25rem' }}>What best describes you?</h1>
        <p className="auth-subtitle" style={{ marginBottom: 0 }}>
          Hi {firebaseUser?.displayName?.split(' ')[0] || 'there'} — choose your trade role.{' '}
          <strong>This cannot be changed later.</strong>
        </p>
        <div className="role-grid">
          {ROLES.map(({ id, label, icon: Icon, desc }) => (
            <div key={id} className={`role-item${selected === id ? ' selected' : ''}`} onClick={() => setSelected(id)}>
              <div className="role-item-icon"><Icon size={28} strokeWidth={1.75} /></div>
              <h3>{label}</h3><p>{desc}</p>
            </div>
          ))}
        </div>
        {error && <div className="error-banner">{error}</div>}
        <button className="btn-primary" disabled={!selected || loading} onClick={handleContinue}>
          {loading ? 'Saving…' : <>Continue <ChevronRight size={16} style={{ display: 'inline', marginLeft: '0.25rem' }} /></>}
        </button>
      </motion.div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   ONBOARDING FORM — rich trade profile
══════════════════════════════════════════════════════════════════ */
function OnboardingPage({ role, onComplete }) {
  const [step, setStep] = useState(1)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    companyName: '', website: '', phone: '', linkedinProfile: '',
    country: role === 'importer' ? '' : 'India',
    region: '', industry: '', certifications: [],
    deliveryUrgency: '1 Month', sustainabilityOnly: false,
    // Importer
    importerCountry: '', preferredRegion: '', quantityRequired: '', quantityUnit: 'units',
    budgetRange: 'medium', certificationRequired: [], preferredExporterSize: 'Mid-size',
    minReliabilityScore: 60, riskSensitivity: 'medium', buyingRequirements: '',
    // Exporter
    productsCategories: '', exportingTo: '', capacity: '', exporterSize: 'Mid-size',
  })

  const set = k => e => setForm(f => ({ ...f, [k]: e.target?.type === 'checkbox' ? e.target.checked : e.target?.value ?? e }))
  const toggleArr = (key, val) => setForm(f => ({ ...f, [key]: f[key].includes(val) ? f[key].filter(x => x !== val) : [...f[key], val] }))

  const handleSubmit = async () => {
    setLoading(true); setError('')
    try {
      const payload = {
        ...form,
        productsCategories: (form.productsCategories || '').split(',').map(s => s.trim()).filter(Boolean),
        exportingTo: (form.exportingTo || '').split(',').map(s => s.trim()).filter(Boolean),
        quantityRequired: Number(form.quantityRequired) || 0,
        minReliabilityScore: Number(form.minReliabilityScore) || 0,
      }
      const data = await api('/api/profile/onboarding', { method: 'POST', body: JSON.stringify(payload) })
      if (data.verificationStatus) onComplete()
      else setError(data.message || 'Submission failed.')
    } catch { setError('Network error.') }
    setLoading(false)
  }

  const SelectField = ({ label, k, options }) => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <select className="form-input" value={form[k]} onChange={set(k)}>
        <option value="">Select…</option>
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
    </div>
  )

  const CheckGroup = ({ label, k, options }) => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.375rem' }}>
        {options.map(o => (
          <label key={o} style={{
            display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', cursor: 'pointer',
            background: form[k].includes(o) ? 'var(--accent-light)' : 'var(--bg-subtle)',
            border: `1px solid ${form[k].includes(o) ? 'var(--border-focus)' : 'var(--border)'}`,
            borderRadius: 'var(--radius-sm)', padding: '0.3rem 0.625rem'
          }}>
            <input type="checkbox" style={{ accentColor: 'var(--accent)' }} checked={form[k].includes(o)} onChange={() => toggleArr(k, o)} />{o}
          </label>
        ))}
      </div>
    </div>
  )

  const SliderField = ({ label, k, min, max, suffix = '' }) => (
    <div className="form-group">
      <label className="form-label">{label} — <strong>{form[k]}{suffix}</strong></label>
      <input type="range" min={min} max={max} value={form[k]} onChange={set(k)}
        style={{ width: '100%', accentColor: 'var(--accent)', marginTop: '0.375rem' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
        <span>{min}{suffix}</span><span>{max}{suffix}</span>
      </div>
    </div>
  )

  return (
    <div className="auth-page" style={{ alignItems: 'flex-start', paddingTop: '2rem', paddingBottom: '2rem' }}>
      <motion.div {...fade} className="auth-card" style={{ maxWidth: '540px' }}>
        <div className="auth-logo"><LogoMark size={28} /><span className="auth-logo-text">TradePulse AI</span></div>

        {/* Progress */}
        <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '1.5rem' }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{
              flex: 1, height: 3, borderRadius: 2,
              background: step >= s ? 'var(--accent)' : 'var(--border)', transition: 'background 0.3s'
            }} />
          ))}
        </div>

        <span className="badge-role">{role} — Step {step} of 3</span>
        <h1 className="auth-title" style={{ fontSize: '1.2rem', marginTop: '0.75rem' }}>
          {step === 1 ? 'Company Information' : step === 2 ? 'Trade Requirements' : 'Preferences'}
        </h1>

        {/* STEP 1: Company Info */}
        {step === 1 && (
          <>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Company Name *</label>
                <input className="form-input" type="text" placeholder="Acme Corp" value={form.companyName} onChange={set('companyName')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Country *</label>
                <select className="form-input" value={form.country} onChange={set('country')}>
                  <option value="">Select…</option>
                  {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Website</label>
                <input className="form-input" type="url" placeholder="https://..." value={form.website} onChange={set('website')} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" type="tel" placeholder="+1 234 567 890" value={form.phone} onChange={set('phone')} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">LinkedIn Profile</label>
              <input className="form-input" type="url" placeholder="https://linkedin.com/in/..." value={form.linkedinProfile} onChange={set('linkedinProfile')} />
            </div>
            <SelectField label="Region" k="region" options={REGIONS} />
          </>
        )}

        {/* STEP 2: Trade Requirements */}
        {step === 2 && (
          <>
            <SelectField label="Industry / Product Category *" k="industry" options={INDUSTRIES} />
            {role === 'importer' ? (
              <>
                <SelectField label="Your Country (Importer) *" k="importerCountry" options={COUNTRIES} />
                <SelectField label="Preferred Region to Import From *" k="preferredRegion" options={REGIONS} />
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Quantity Required *</label>
                    <input className="form-input" type="number" placeholder="500" value={form.quantityRequired} onChange={set('quantityRequired')} min="1" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Unit</label>
                    <select className="form-input" value={form.quantityUnit} onChange={set('quantityUnit')}>
                      {['units', 'tons', 'kg', 'liters', 'pieces', 'containers'].map(u => <option key={u}>{u}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Budget Range</label>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.375rem' }}>
                    {Object.entries(BUDGET_LABELS).map(([k, v]) => (
                      <button key={k} type="button" onClick={() => setForm(f => ({ ...f, budgetRange: k }))}
                        style={{
                          flex: 1, padding: '0.5rem 0.25rem', borderRadius: 'var(--radius-sm)', border: `1px solid ${form.budgetRange === k ? 'var(--border-focus)' : 'var(--border)'}`,
                          background: form.budgetRange === k ? 'var(--accent-light)' : 'transparent', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'inherit'
                        }}>
                        <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{k}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{v}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <CheckGroup label="Certifications Required" k="certificationRequired" options={CERTS} />
              </>
            ) : (
              <>
                <div className="form-group">
                  <label className="form-label">Products / Categories *</label>
                  <input className="form-input" type="text" placeholder="Cotton Fabrics, Denim (comma separated)" value={form.productsCategories} onChange={set('productsCategories')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Target Countries *</label>
                  <input className="form-input" type="text" placeholder="USA, Germany, UAE (comma separated)" value={form.exportingTo} onChange={set('exportingTo')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Production Capacity</label>
                  <input className="form-input" type="text" placeholder="50,000 units/month" value={form.capacity} onChange={set('capacity')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Budget Compatibility</label>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.375rem' }}>
                    {Object.entries(BUDGET_LABELS).map(([k, v]) => (
                      <button key={k} type="button" onClick={() => setForm(f => ({ ...f, budgetRange: k }))}
                        style={{
                          flex: 1, padding: '0.5rem 0.25rem', borderRadius: 'var(--radius-sm)', border: `1px solid ${form.budgetRange === k ? 'var(--border-focus)' : 'var(--border)'}`,
                          background: form.budgetRange === k ? 'var(--accent-light)' : 'transparent', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'inherit'
                        }}>
                        <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{k}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{v}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <CheckGroup label="Certifications Held" k="certifications" options={CERTS} />
              </>
            )}
          </>
        )}

        {/* STEP 3: Preferences */}
        {step === 3 && (
          <>
            {role === 'importer' && (
              <>
                <div className="form-group">
                  <label className="form-label">Preferred Exporter Size</label>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.375rem' }}>
                    {SIZES.map(s => (
                      <button key={s} type="button" onClick={() => setForm(f => ({ ...f, preferredExporterSize: s }))}
                        style={{
                          flex: 1, padding: '0.5rem 0.25rem', borderRadius: 'var(--radius-sm)', border: `1px solid ${form.preferredExporterSize === s ? 'var(--border-focus)' : 'var(--border)'}`,
                          background: form.preferredExporterSize === s ? 'var(--accent-light)' : 'transparent', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600
                        }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <SliderField label="Minimum Reliability Score" k="minReliabilityScore" min={0} max={100} suffix="%" />
                <div className="form-group">
                  <label className="form-label">Risk Sensitivity</label>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.375rem' }}>
                    {RISKS.map(r => (
                      <button key={r} type="button" onClick={() => setForm(f => ({ ...f, riskSensitivity: r }))}
                        style={{
                          flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: `1px solid ${form.riskSensitivity === r ? 'var(--border-focus)' : 'var(--border)'}`,
                          background: form.riskSensitivity === r ? 'var(--accent-light)' : 'transparent', fontSize: '0.8125rem', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, textTransform: 'capitalize'
                        }}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Buying Requirements</label>
                  <textarea className="form-input" rows={3} placeholder="Describe what you need…" value={form.buyingRequirements} onChange={set('buyingRequirements')} style={{ resize: 'none' }} />
                </div>
              </>
            )}
            {role === 'exporter' && (
              <>
                <div className="form-group">
                  <label className="form-label">Company Size</label>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.375rem' }}>
                    {SIZES.map(s => (
                      <button key={s} type="button" onClick={() => setForm(f => ({ ...f, exporterSize: s }))}
                        style={{
                          flex: 1, padding: '0.5rem 0.25rem', borderRadius: 'var(--radius-sm)', border: `1px solid ${form.exporterSize === s ? 'var(--border-focus)' : 'var(--border)'}`,
                          background: form.exporterSize === s ? 'var(--accent-light)' : 'transparent', fontSize: '0.7rem', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600
                        }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
            <SelectField label="Delivery Urgency" k="deliveryUrgency" options={URGENCIES} />
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer', marginTop: '0.5rem' }}>
              <input type="checkbox" style={{ accentColor: 'var(--accent)' }} checked={form.sustainabilityOnly} onChange={set('sustainabilityOnly')} />
              Prefer eco-friendly / sustainable partners only
            </label>
          </>
        )}

        {error && <div className="error-banner" style={{ marginTop: '1rem' }}>{error}</div>}

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
          {step > 1 && <button type="button" className="btn-secondary" onClick={() => setStep(s => s - 1)}>Back</button>}
          {step < 3 ? (
            <button className="btn-primary" onClick={() => {
              if (step === 1 && (!form.companyName || !form.country)) { setError('Company name and country are required.'); return; }
              if (step === 2 && !form.industry) { setError('Please select an industry.'); return; }
              setError(''); setStep(s => s + 1);
            }}>Next</button>
          ) : (
            <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Submitting…' : 'Submit for Verification'}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   PENDING VERIFICATION SCREEN
══════════════════════════════════════════════════════════════════ */
function PendingPage({ onLogout }) {
  return (
    <div className="auth-page">
      <motion.div {...fade} className="auth-card" style={{ textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
          <Clock size={28} color="#6b7280" />
        </div>
        <h1 className="auth-title">Under Review</h1>
        <p className="auth-subtitle" style={{ marginBottom: '1.5rem' }}>
          Your profile has been submitted and is awaiting admin verification. You'll get access to the dashboard once approved. This usually takes 24–48 hours.
        </p>
        <div style={{ background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1.5rem', textAlign: 'left' }}>
          <p style={{ fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.5rem' }}>What happens next?</p>
          {['Admin reviews your trade profile', 'Your credentials are verified', 'You get full dashboard access with AI recommendations'].map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.375rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>0{i + 1}.</span>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{s}</span>
            </div>
          ))}
        </div>
        <button className="btn-danger" onClick={onLogout}><LogOut size={14} style={{ display: 'inline', marginRight: '0.375rem' }} />Sign out</button>
      </motion.div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   REJECTED SCREEN
══════════════════════════════════════════════════════════════════ */
function RejectedPage({ note, onLogout }) {
  return (
    <div className="auth-page">
      <motion.div {...fade} className="auth-card" style={{ textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--danger-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
          <XCircle size={28} color="var(--danger)" />
        </div>
        <h1 className="auth-title">Verification Not Approved</h1>
        {note && <div className="error-banner" style={{ textAlign: 'left', marginBottom: '1rem' }}>Reason: {note}</div>}
        <p className="auth-subtitle" style={{ marginBottom: '1.5rem' }}>Contact support at support@tradepulse.ai to appeal or reapply.</p>
        <button className="btn-danger" onClick={onLogout}><LogOut size={14} style={{ display: 'inline', marginRight: '0.375rem' }} />Sign out</button>
      </motion.div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   MATCH CARD
══════════════════════════════════════════════════════════════════ */
function MatchCard({ rec, myRole }) {
  const p = rec.user?.tradeProfile || {}
  const isDataset = rec.source === 'Dataset'

  return (
    <div className="content-card card-glass" style={{ marginBottom: '1rem', padding: '1.25rem', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: isDataset ? 'linear-gradient(135deg, #7c3aed, #a855f7)' : 'var(--accent-gradient)',
          color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, flexShrink: 0, fontSize: '1.125rem',
          boxShadow: isDataset ? '0 4px 12px rgba(124, 58, 237, 0.2)' : 'none'
        }}>
          {(rec.user?.name || '?')[0].toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {p.companyName || rec.user?.name}
            </span>
            <span className="badge-role" style={{ fontSize: '0.65rem' }}>{rec.user?.role}</span>
            {isDataset && (
              <span style={{ fontSize: '0.6rem', padding: '1px 6px', borderRadius: 99, background: '#faf5ff', color: '#7c3aed', border: '1px solid #ddd6fe', fontWeight: 700 }}>
                📊 Dataset Lead
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <MapPin size={12} /> {p.country}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Target size={12} /> {p.industry}
            </span>
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{
            fontSize: '1.25rem', fontWeight: 900,
            color: rec.score >= 80 ? '#10b981' : rec.score >= 60 ? '#3b82f6' : '#f59e0b',
            lineHeight: 1
          }}>
            {rec.score}%
          </div>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginTop: 2 }}>Synergy</div>
        </div>
      </div>

      {/* AI Insight */}
      <div style={{
        background: isDataset ? '#f5f3ff' : 'var(--accent-light)',
        padding: '0.6rem 0.875rem', borderRadius: 8,
        border: `1px solid ${isDataset ? '#ddd6fe' : 'var(--border)'}`,
        marginBottom: '1rem', position: 'relative'
      }}>
        <div style={{ position: 'absolute', top: -8, right: 8, background: isDataset ? '#7c3aed' : 'var(--accent)', color: 'white', borderRadius: 4, padding: '0 4px', fontSize: '0.55rem', fontWeight: 800 }}>
          AI
        </div>
        <p style={{ margin: 0, fontSize: '0.75rem', lineHeight: 1.5, color: isDataset ? '#5b21b6' : 'var(--text-primary)', fontWeight: 500, fontStyle: 'italic' }}>
          "{rec.aiReason || 'Strong market alignment was detected.'}"
        </p>
      </div>

      <div style={{ background: 'var(--bg-subtle)', borderRadius: 6, height: 4, marginBottom: '1rem', overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${rec.score}%` }}
          style={{ height: '100%', background: isDataset ? 'linear-gradient(90deg, #7c3aed, #a855f7)' : 'var(--accent-gradient)', borderRadius: 6 }}
        />
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginTop: 'auto' }}>
        {Object.entries(rec.breakdown || {}).slice(0, 3).map(([k, v]) => (
          <span key={k} style={{
            fontSize: '0.6rem', padding: '2px 8px', borderRadius: 6,
            background: 'var(--bg-white)', color: 'var(--text-secondary)', fontWeight: 700, border: '1px solid var(--border)'
          }}>
            {k.replace('_', ' ')}: {v}%
          </span>
        ))}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   DASHBOARD PAGE
══════════════════════════════════════════════════════════════════ */
function DashboardPage({ backendUser, onNavigate }) {
  const [recs, setRecs] = useState([])
  const [meetings, setMeetings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const hdrs = { Authorization: `Bearer ${localStorage.getItem('tp_token')}` }
    const BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

    Promise.all([
      fetch(`${BASE}/api/match/recommendations`, { headers: hdrs }).then(r => r.json()),
      fetch(`${BASE}/api/connections/meetings`, { headers: hdrs }).then(r => r.json()),
    ]).then(([m, meet]) => {
      setRecs(m.recommendations || [])
      setMeetings(meet.meetings || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const upcoming = meetings
    .filter(m => m.meetingStatus === 'confirmed' && new Date(m.meetingTime) > Date.now())
    .sort((a, b) => new Date(a.meetingTime) - new Date(b.meetingTime))[0]

  const isSoon = upcoming && (new Date(upcoming.meetingTime) - Date.now()) < 1800000

  const p = backendUser?.tradeProfile || {}
  const stats = [
    { label: 'Match Score', value: recs.length ? Math.round(recs.reduce((s, r) => s + r.score, 0) / recs.length) + '%' : '—', sub: 'Profile health' },
    { label: 'Market Hunter', value: recs.length, sub: 'Target leads found' },
    { label: 'Industry Focus', value: p.industry || '—', sub: 'Your trade sector' },
    { label: 'Presence', value: p.region || '—', sub: 'Global footprint' },
  ]

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } }
  const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } }

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      <div className="page-header">
        <h1 className="page-title">Intelligence Hub</h1>
        <p className="page-subtitle">Welcome back, {backendUser?.name}. Your trade network is active.</p>
      </div>
      <div className="page-body">

        {isSoon && (
          <motion.div variants={item}
            style={{ background: 'var(--accent-gradient)', color: 'white', borderRadius: 20, padding: '1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Video size={24} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: '1.125rem' }}>Active Meeting Protocol</div>
              <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Partner: {upcoming.partner?.tradeProfile?.companyName || upcoming.partner?.name} · Starts in {Math.round((new Date(upcoming.meetingTime) - Date.now()) / 60000)}m</div>
            </div>
            <button className="btn-primary" style={{ background: 'white', color: 'var(--accent)', px: '1.5rem', fontWeight: 800, border: 'none' }} onClick={() => onNavigate('meetings')}>
              Enter Room
            </button>
          </motion.div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
          {[{ label: 'Discover Partners', icon: Heart, id: 'swipe', bg: '#fee2e2', color: '#ef4444' },
          { label: 'Target Leads', icon: Target, id: 'matches', bg: '#eff6ff', color: '#3b82f6' },
          { label: 'Market Intelligence', icon: BarChart3, id: 'analytics', bg: '#f5f3ff', color: '#8b5cf6' },
          { label: 'Trade Calendar', icon: Calendar, id: 'meetings', bg: '#fff7ed', color: '#f59e0b' },
          ].map(a => (
            <motion.button variants={item} key={a.id} onClick={() => onNavigate(a.id)}
              className="content-card card-glass"
              style={{ padding: '1.5rem', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '1.25rem', margin: 0 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: a.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <a.icon size={22} color={a.color} />
              </div>
              <div style={{ fontWeight: 800, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>{a.label}</div>
            </motion.button>
          ))}
        </div>

        <motion.div variants={container} className="stats-grid">
          {stats.map(s => (
            <motion.div variants={item} className="stat-card" key={s.label}>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-sub">{s.sub}</div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div variants={item} className="content-card">
          <div className="card-title">
            <Sparkles size={18} color="var(--accent)" /> High-Synergy Recommendations
            {recs.length > 0 && <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.8125rem', marginLeft: '0.5rem' }}>({recs.length} matches)</span>}
          </div>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /><p style={{ marginTop: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Analyzing market vectors...</p></div>
          ) : recs.length === 0 ? (
            <div className="empty-state"><Star size={44} strokeWidth={1} style={{ opacity: 0.3, marginBottom: '1rem' }} /><p style={{ fontWeight: 600 }}>Optimize your profile to unlock precision matching.</p></div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
              {recs.slice(0, 4).map((r, i) => <MatchCard key={i} rec={r} myRole={backendUser?.role} />)}
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   PROFILE PAGE
══════════════════════════════════════════════════════════════════ */
function ProfilePage({ firebaseUser, backendUser }) {
  const p = backendUser?.tradeProfile || {}
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    companyName: p.companyName || '',
    website: p.website || '',
    phone: p.phone || '',
    country: p.country || '',
    region: p.region || '',
    linkedinProfile: p.linkedinProfile || '',
    industry: p.industry || '',
    capacity: p.capacity || '',
    productsCategories: (p.productsCategories || []).join(', '),
    exportingTo: (p.exportingTo || []).join(', '),
    buyingRequirements: p.buyingRequirements || '',
    deliveryUrgency: p.deliveryUrgency || '',
  })

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSave = async (e) => {
    e.preventDefault()
    await api('/api/profile/me', { method: 'PUT', body: JSON.stringify(form) })
    setSaved(true); setTimeout(() => setSaved(false), 2500)
  }

  const initials = (firebaseUser?.displayName || firebaseUser?.email || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Profile</h1>
        <p className="page-subtitle">Manage your trade details — role is locked</p>
      </div>
      <div className="page-body">
        <div className="content-card">
          <div className="profile-avatar-section">
            <div className="profile-avatar">
              {firebaseUser?.photoURL ? <img src={firebaseUser.photoURL} alt="avatar" referrerPolicy="no-referrer" /> : initials}
            </div>
            <div className="profile-avatar-info">
              <h3>{firebaseUser?.displayName || 'User'}</h3><p>{firebaseUser?.email}</p>
            </div>
            <span className="badge-role" style={{ marginLeft: 'auto' }}>{backendUser?.role} <Shield size={10} style={{ display: 'inline' }} /></span>
          </div>
          <hr className="section-divider" />

          <form onSubmit={handleSave}>
            <p className="card-title" style={{ marginBottom: '1rem' }}>Company Details</p>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Company Name</label>
                <input className="form-input" value={form.companyName} onChange={set('companyName')} /></div>
              <div className="form-group"><label className="form-label">Country</label>
                <select className="form-input" value={form.country} onChange={set('country')}>
                  {COUNTRIES.map(c => <option key={c}>{c}</option>)}</select></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Website</label>
                <input className="form-input" type="url" value={form.website} onChange={set('website')} /></div>
              <div className="form-group"><label className="form-label">Phone</label>
                <input className="form-input" type="tel" value={form.phone} onChange={set('phone')} /></div>
            </div>
            <div className="form-group"><label className="form-label">LinkedIn</label>
              <input className="form-input" type="url" value={form.linkedinProfile} onChange={set('linkedinProfile')} /></div>

            <hr className="section-divider" />
            <p className="card-title" style={{ marginBottom: '1rem' }}>Trade Profile</p>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Industry</label>
                <select className="form-input" value={form.industry} onChange={set('industry')}>
                  {INDUSTRIES.map(i => <option key={i}>{i}</option>)}</select></div>
              <div className="form-group"><label className="form-label">Region</label>
                <select className="form-input" value={form.region} onChange={set('region')}>
                  {REGIONS.map(r => <option key={r}>{r}</option>)}</select></div>
            </div>
            {backendUser?.role === 'exporter' && (
              <>
                <div className="form-group"><label className="form-label">Products</label>
                  <input className="form-input" placeholder="Cotton, Denim (comma separated)" value={form.productsCategories} onChange={set('productsCategories')} /></div>
                <div className="form-group"><label className="form-label">Target Countries</label>
                  <input className="form-input" placeholder="USA, UK (comma separated)" value={form.exportingTo} onChange={set('exportingTo')} /></div>
                <div className="form-group"><label className="form-label">Capacity</label>
                  <input className="form-input" placeholder="50,000 units/month" value={form.capacity} onChange={set('capacity')} /></div>
              </>
            )}
            {backendUser?.role === 'importer' && (
              <div className="form-group"><label className="form-label">Buying Requirements</label>
                <textarea className="form-input" rows={3} style={{ resize: 'none' }} value={form.buyingRequirements} onChange={set('buyingRequirements')} /></div>
            )}
            <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }}>
              {saved ? '✓ Saved' : 'Save Changes'}
            </button>
          </form>

          <hr className="section-divider" />
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Verification: <strong style={{ textTransform: 'capitalize', color: backendUser?.verificationStatus === 'approved' ? '#16a34a' : 'var(--text-secondary)' }}>{backendUser?.verificationStatus}</strong>
            &nbsp;·&nbsp;UID: {firebaseUser?.uid?.slice(0, 16)}…
          </p>
        </div>
      </div>
    </>
  )
}

/* ══════════════════════════════════════════════════════════════════
   BANNED SCREEN
══════════════════════════════════════════════════════════════════ */
function BannedPage({ reason, onLogout }) {
  return (
    <div className="auth-page">
      <motion.div {...fade} className="auth-card" style={{ textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--danger-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
          <Ban size={28} color="var(--danger)" />
        </div>
        <h1 className="auth-title">Account Suspended</h1>
        <p className="auth-subtitle" style={{ marginBottom: '1rem' }}>Your account has been suspended by an administrator.</p>
        {reason && (
          <div className="error-banner" style={{ textAlign: 'left', marginBottom: '1rem' }}>
            <strong>Reason:</strong> {reason}
          </div>
        )}
        <p className="auth-subtitle" style={{ marginBottom: '1.5rem', fontSize: '0.8rem' }}>
          If you believe this is a mistake, contact <strong>support@tradepulse.ai</strong>
        </p>
        <button className="btn-danger" onClick={onLogout}>
          <LogOut size={14} style={{ display: 'inline', marginRight: '0.375rem' }} />Sign out
        </button>
      </motion.div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   ADMIN PANEL — Full production-grade
══════════════════════════════════════════════════════════════════ */
const STATUS_COLOR = { approved: '#16a34a', pending: '#d97706', rejected: '#dc2626' }

function UserRow({ u, onAction, actionNote, setActionNote, expandedId, setExpandedId }) {
  const p = u.tradeProfile || {}
  const isOpen = expandedId === u._id
  const [note, setNote] = useState('')

  const act = (action, extra = {}) => onAction(u._id, action, { note, ...extra })

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', marginBottom: '0.5rem', overflow: 'hidden' }}>
      {/* Row header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', cursor: 'pointer', background: isOpen ? 'var(--bg-subtle)' : 'transparent' }}
        onClick={() => setExpandedId(isOpen ? null : u._id)}>
        <div className="sidebar-avatar" style={{ width: 34, height: 34, fontSize: '0.8rem', flexShrink: 0 }}>
          {(u.name || '?')[0].toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
            {p.companyName || u.name}
            <span className="badge-role">{u.role}</span>
            {u.isBanned && <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem', borderRadius: 99, background: 'var(--danger-light)', color: 'var(--danger)', border: '1px solid #fca5a5' }}>BANNED</span>}
            {u.isDemo && <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem', borderRadius: 99, background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe' }}>demo</span>}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.1rem' }}>
            <span>{u.email}</span>
            <span style={{ color: STATUS_COLOR[u.verificationStatus] || 'var(--text-muted)', fontWeight: 600, textTransform: 'capitalize' }}>{u.verificationStatus}</span>
            {p.industry && <span>{p.industry}</span>}
            {p.country && <span><MapPin size={10} style={{ display: 'inline' }} /> {p.country}</span>}
          </div>
        </div>
        <ChevronDown size={14} style={{ flexShrink: 0, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: 'var(--text-muted)' }} />
      </div>

      {/* Expanded actions */}
      {isOpen && (
        <div style={{ padding: '1rem', borderTop: '1px solid var(--border)', background: '#fafafa' }}>
          <div className="form-row" style={{ marginBottom: '0.75rem' }}>
            <div style={{ flex: 2 }}>
              <label className="form-label">Note / Reason (used by Reject / Ban)</label>
              <input className="form-input" style={{ fontSize: '0.8125rem' }} placeholder="Enter reason…" value={note} onChange={e => setNote(e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {/* Verification actions */}
            {u.verificationStatus !== 'approved' && (
              <button className="btn-primary" style={{ padding: '0.375rem 0.875rem', fontSize: '0.775rem' }} onClick={() => act('approve')}>
                <CheckCircle size={12} style={{ display: 'inline', marginRight: 4 }} />Approve
              </button>
            )}
            {u.verificationStatus !== 'rejected' && (
              <button className="btn-danger" style={{ padding: '0.375rem 0.875rem', fontSize: '0.775rem', background: '#d97706' }} onClick={() => act('reject')}>
                <XCircle size={12} style={{ display: 'inline', marginRight: 4 }} />Reject
              </button>
            )}
            {u.verificationStatus !== 'pending' && (
              <button onClick={() => act('reset')} style={{ padding: '0.375rem 0.875rem', fontSize: '0.775rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
                <RotateCcw size={12} />Reset to Pending
              </button>
            )}

            <div style={{ width: 1, background: 'var(--border)', margin: '0 0.25rem' }} />

            {/* Ban / Unban */}
            {!u.isBanned ? (
              <button className="btn-danger" style={{ padding: '0.375rem 0.875rem', fontSize: '0.775rem' }} onClick={() => act('ban')}>
                <Ban size={12} style={{ display: 'inline', marginRight: 4 }} />Ban User
              </button>
            ) : (
              <button onClick={() => act('unban')} style={{ padding: '0.375rem 0.875rem', fontSize: '0.775rem', borderRadius: 'var(--radius-sm)', border: '1px solid #16a34a', color: '#16a34a', background: '#f0fdf4', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
                <UserCheck size={12} />Unban
              </button>
            )}

            <div style={{ width: 1, background: 'var(--border)', margin: '0 0.25rem' }} />

            {/* Promote / Demote */}
            {u.role !== 'admin' ? (
              <button onClick={() => act('promote')} style={{ padding: '0.375rem 0.875rem', fontSize: '0.775rem', borderRadius: 'var(--radius-sm)', border: '1px solid #7c3aed', color: '#7c3aed', background: '#f5f3ff', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Shield size={12} />Make Admin
              </button>
            ) : (
              <button onClick={() => act('demote')} style={{ padding: '0.375rem 0.875rem', fontSize: '0.775rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
                Demote Admin
              </button>
            )}

            {/* Delete */}
            <button onClick={() => { if (window.confirm(`Permanently delete ${u.name}?`)) act('delete') }}
              style={{ padding: '0.375rem 0.875rem', fontSize: '0.775rem', borderRadius: 'var(--radius-sm)', border: '1px solid #fca5a5', color: '#dc2626', background: 'var(--danger-light)', cursor: 'pointer', fontFamily: 'inherit', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Trash2 size={12} />Delete
            </button>
          </div>

          {/* Profile details */}
          {(p.companyName || p.industry) && (
            <div style={{ marginTop: '0.875rem', padding: '0.75rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.375rem' }}>
              {p.companyName && <span><strong>Company:</strong> {p.companyName}</span>}
              {p.industry && <span><strong>Industry:</strong> {p.industry}</span>}
              {p.country && <span><strong>Country:</strong> {p.country}</span>}
              {p.region && <span><strong>Region:</strong> {p.region}</span>}
              {p.budgetRange && <span><strong>Budget:</strong> {p.budgetRange}</span>}
              {p.exporterSize && <span><strong>Size:</strong> {p.exporterSize}</span>}
              {p.website && <a href={p.website} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>{p.website}</a>}
              {u.isBanned && u.banReason && <span style={{ color: 'var(--danger)' }}><strong>Ban reason:</strong> {u.banReason}</span>}
              {u.adminNote && <span><strong>Admin note:</strong> {u.adminNote}</span>}
              <span><strong>Joined:</strong> {new Date(u.createdAt).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function AdminPage() {
  const [tab, setTab] = useState('pending')
  const [pending, setPending] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [bannedUsers, setBannedUsers] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [feedback, setFeedback] = useState('')

  const loadAll = useCallback(async () => {
    setLoading(true)
    const [p, s, a, b] = await Promise.all([
      api('/api/admin/pending'),
      api('/api/admin/stats'),
      api(`/api/admin/all-users?limit=50&search=${encodeURIComponent(search)}&role=${filterRole}&status=${filterStatus}`),
      api('/api/admin/all-users?banned=true&limit=50'),
    ])
    setPending(p.users || [])
    setStats(s)
    setAllUsers(a.users || [])
    setBannedUsers(b.users || [])
    setLoading(false)
  }, [search, filterRole, filterStatus])

  useEffect(() => { loadAll() }, [loadAll])

  const handleAction = async (id, action, extra = {}) => {
    setFeedback('')
    let res
    if (action === 'approve') res = await api(`/api/admin/verify/${id}`, { method: 'PUT', body: JSON.stringify({ status: 'approved' }) })
    else if (action === 'reject') res = await api(`/api/admin/verify/${id}`, { method: 'PUT', body: JSON.stringify({ status: 'rejected', note: extra.note }) })
    else if (action === 'reset') res = await api(`/api/admin/reset-verification/${id}`, { method: 'PUT', body: JSON.stringify({}) })
    else if (action === 'ban') res = await api(`/api/admin/ban/${id}`, { method: 'PUT', body: JSON.stringify({ reason: extra.note }) })
    else if (action === 'unban') res = await api(`/api/admin/unban/${id}`, { method: 'PUT', body: JSON.stringify({}) })
    else if (action === 'promote') res = await api(`/api/admin/promote/${id}`, { method: 'PUT', body: JSON.stringify({}) })
    else if (action === 'demote') res = await api(`/api/admin/demote/${id}`, { method: 'PUT', body: JSON.stringify({ role: 'exporter' }) })
    else if (action === 'delete') res = await api(`/api/admin/delete/${id}`, { method: 'DELETE' })
    setFeedback(res?.message || 'Done.')
    setExpandedId(null)
    setTimeout(() => setFeedback(''), 3000)
    loadAll()
  }

  const bulkApprove = async () => {
    const res = await api('/api/admin/bulk-approve', { method: 'POST', body: '{}' })
    setFeedback(res?.message || 'Done.')
    setTimeout(() => setFeedback(''), 3000)
    loadAll()
  }

  const TABS = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'pending', label: `Pending`, icon: Clock, count: pending.length },
    { id: 'all', label: 'All Users', icon: Users, count: allUsers.length },
    { id: 'banned', label: 'Banned', icon: Ban, count: bannedUsers.length },
  ]

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Admin Panel</h1>
        <p className="page-subtitle">Full platform management — users, verifications, bans &amp; more</p>
      </div>
      <div className="page-body">

        {/* Feedback toast */}
        <AnimatePresence>
          {feedback && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.875rem', color: '#15803d', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle size={14} />  {feedback}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          {TABS.map(({ id, label, icon: Icon, count }) => (
            <button key={id} onClick={() => setTab(id)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 0.875rem', borderRadius: 'var(--radius-sm)', border: `1px solid ${tab === id ? 'var(--border-focus)' : 'var(--border)'}`, background: tab === id ? 'var(--accent)' : 'var(--bg-white)', color: tab === id ? '#fff' : 'var(--text-secondary)', fontFamily: 'inherit', fontSize: '0.8125rem', fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s' }}>
              <Icon size={13} />{label}{count != null && count > 0 && <span style={{ background: tab === id ? 'rgba(255,255,255,0.25)' : 'var(--bg-subtle)', borderRadius: 99, padding: '0 6px', fontSize: '0.7rem' }}>{count}</span>}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {tab === 'overview' && (
          <>
            <div className="stats-grid">
              {[['Total Users', stats.total], ['Pending', stats.pending], ['Approved', stats.approved], ['Rejected', stats.rejected], ['Exporters', stats.exporters], ['Importers', stats.importers], ['Banned', stats.banned]].map(([l, v]) => (
                <div className="stat-card" key={l}>
                  <div className="stat-label">{l}</div>
                  <div className="stat-value" style={{ fontSize: '1.625rem' }}>{v ?? 0}</div>
                </div>
              ))}
            </div>
            <div className="content-card">
              <div className="card-title">Quick Actions</div>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                <button className="btn-primary" onClick={bulkApprove} style={{ width: 'auto' }}>
                  <CheckCircle size={14} style={{ display: 'inline', marginRight: 6 }} />Bulk Approve All Pending
                </button>
                <button onClick={() => setTab('pending')} style={{ padding: '0.625rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.875rem' }}>
                  View Pending ({pending.length})
                </button>
                <button onClick={() => setTab('banned')} style={{ padding: '0.625rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid #fca5a5', color: 'var(--danger)', background: 'var(--danger-light)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.875rem' }}>
                  View Banned ({bannedUsers.length})
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── PENDING ── */}
        {tab === 'pending' && (
          <div className="content-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div className="card-title" style={{ marginBottom: 0 }}>Pending Verifications ({pending.length})</div>
              {pending.length > 0 && (
                <button className="btn-primary" style={{ width: 'auto', padding: '0.4rem 1rem', fontSize: '0.8125rem' }} onClick={bulkApprove}>
                  Approve All
                </button>
              )}
            </div>
            {loading ? (
              <div className="empty-state"><div className="spinner" /></div>
            ) : pending.length === 0 ? (
              <div className="empty-state"><CheckCircle size={28} strokeWidth={1.5} /><p>All caught up! No pending verifications.</p></div>
            ) : pending.map(u => (
              <UserRow key={u._id} u={u} onAction={handleAction} expandedId={expandedId} setExpandedId={setExpandedId} />
            ))}
          </div>
        )}

        {/* ── ALL USERS ── */}
        {tab === 'all' && (
          <div className="content-card">
            {/* Search + filter bar */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 2, position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input className="form-input" style={{ paddingLeft: '2rem', fontSize: '0.8125rem' }} placeholder="Search by name, email, company…" value={search}
                  onChange={e => setSearch(e.target.value)} />
              </div>
              <select className="form-input" style={{ maxWidth: 140, fontSize: '0.8125rem' }} value={filterRole} onChange={e => setFilterRole(e.target.value)}>
                <option value="all">All roles</option>
                <option value="exporter">Exporters</option>
                <option value="importer">Importers</option>
              </select>
              <select className="form-input" style={{ maxWidth: 150, fontSize: '0.8125rem' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="all">Any status</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div className="card-title" style={{ marginBottom: '0.75rem' }}>Users ({allUsers.length})</div>
            {loading ? (
              <div className="empty-state"><div className="spinner" /></div>
            ) : allUsers.length === 0 ? (
              <div className="empty-state"><Users size={28} strokeWidth={1.5} /><p>No users found.</p></div>
            ) : allUsers.map(u => (
              <UserRow key={u._id} u={u} onAction={handleAction} expandedId={expandedId} setExpandedId={setExpandedId} />
            ))}
          </div>
        )}

        {/* ── BANNED ── */}
        {tab === 'banned' && (
          <div className="content-card">
            <div className="card-title" style={{ marginBottom: '0.75rem' }}>Banned Users ({bannedUsers.length})</div>
            {loading ? (
              <div className="empty-state"><div className="spinner" /></div>
            ) : bannedUsers.length === 0 ? (
              <div className="empty-state"><CheckCircle size={28} strokeWidth={1.5} /><p>No banned users.</p></div>
            ) : bannedUsers.map(u => (
              <UserRow key={u._id} u={u} onAction={handleAction} expandedId={expandedId} setExpandedId={setExpandedId} />
            ))}
          </div>
        )}

      </div>
    </>
  )
}

/* ══════════════════════════════════════════════════════════════════
   SIDEBAR
══════════════════════════════════════════════════════════════════ */
const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'swipe', label: 'Discover', icon: Heart },
  { id: 'connections', label: 'Connections', icon: MessageSquare },
  { id: 'meetings', label: 'Meetings', icon: Video },
  { id: 'matches', label: 'AI Matches', icon: Target },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  // { id: 'lab', label: 'Algorithm Lab', icon: Beaker },
]

function Sidebar({ firebaseUser, backendUser, activePage, onNavigate, onLogout, connectionCount, meetingCount, darkMode, setDarkMode }) {
  const initials = (firebaseUser?.displayName || firebaseUser?.email || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const isAdmin = backendUser?.role === 'admin'

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo-icon"><Zap size={14} strokeWidth={2.5} /></div>
        <span className="sidebar-logo-text">TradePulse AI</span>
        {/* Dark mode toggle in header */}
        <button onClick={() => setDarkMode(d => !d)} title={darkMode ? 'Light mode' : 'Dark mode'}
          style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem', borderRadius: 6 }}>
          {darkMode ? <Sun size={14} /> : <Moon size={14} />}
        </button>
      </div>
      <nav className="sidebar-nav">
        <p className="nav-label">Main</p>
        {NAV.map(({ id, label, icon: Icon }) => (
          <button key={id} className={`nav-item${activePage === id ? ' active' : ''}`} onClick={() => onNavigate(id)}
            style={{ position: 'relative' }}>
            <Icon size={16} strokeWidth={1.75} />{label}
            {id === 'connections' && connectionCount > 0 && (
              <span style={{ marginLeft: 'auto', background: 'var(--accent)', color: 'white', borderRadius: 99, padding: '0.05rem 0.45rem', fontSize: '0.65rem', fontWeight: 700 }}>{connectionCount}</span>
            )}
            {id === 'meetings' && meetingCount > 0 && (
              <span style={{ marginLeft: 'auto', background: '#f59e0b', color: 'white', borderRadius: 99, padding: '0.05rem 0.45rem', fontSize: '0.65rem', fontWeight: 700 }}>{meetingCount}</span>
            )}
          </button>
        ))}
        <p className="nav-label" style={{ marginTop: '1.25rem' }}>Account</p>
        <button className={`nav-item${activePage === 'profile' ? ' active' : ''}`} onClick={() => onNavigate('profile')}>
          <UserIcon size={16} strokeWidth={1.75} />Profile
        </button>
        {isAdmin && (
          <button className={`nav-item${activePage === 'admin' ? ' active' : ''}`} onClick={() => onNavigate('admin')}>
            <Shield size={16} strokeWidth={1.75} />Admin Panel
          </button>
        )}
        <button className={`nav-item${activePage === 'settings' ? ' active' : ''}`} onClick={() => onNavigate('settings')}>
          <Settings size={16} strokeWidth={1.75} />Settings
        </button>
      </nav>
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {firebaseUser?.photoURL ? <img src={firebaseUser.photoURL} alt="avatar" referrerPolicy="no-referrer" /> : initials}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{firebaseUser?.displayName || firebaseUser?.email?.split('@')[0]}</div>
            <div className="sidebar-user-role" style={{ textTransform: 'capitalize' }}>{backendUser?.role}</div>
          </div>
          <button className="btn-ghost" onClick={onLogout} title="Sign out" style={{ padding: '0.25rem' }}><LogOut size={15} /></button>
        </div>
      </div>
    </aside>
  )
}

/* ══════════════════════════════════════════════════════════════════
   DASHBOARD SHELL
══════════════════════════════════════════════════════════════════ */
function DashboardShell({ firebaseUser, backendUser, onLogout }) {
  const [page, setPage] = useState('dashboard')
  const [connCount, setConnCount] = useState(0)
  const [meetCount, setMeetCount] = useState(0)
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('tp_dark') === 'true')

  // Apply dark mode to <html>
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light')
    localStorage.setItem('tp_dark', darkMode)
  }, [darkMode])

  // Keep connection + meeting counts fresh
  useEffect(() => {
    const BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'
    const hdrs = () => ({ Authorization: `Bearer ${localStorage.getItem('tp_token')}` })
    const load = async () => {
      try {
        const [c, m] = await Promise.all([
          fetch(`${BASE}/api/connections`, { headers: hdrs() }).then(r => r.json()),
          fetch(`${BASE}/api/connections/meetings`, { headers: hdrs() }).then(r => r.json()),
        ])
        setConnCount((c.connections || []).length)
        // Badge = pending requests
        setMeetCount((m.meetings || []).filter(x => x.meetingStatus === 'proposed' && !x.iProposed && !x.iConfirmed).length)
      } catch { }
    }
    load()
    const t = setInterval(load, 30000)
    return () => clearInterval(t)
  }, [])

  // Listen for navigation events from child pages
  useEffect(() => {
    const handler = (e) => { if (e.detail) setPage(e.detail) }
    window.addEventListener('navigate', handler)
    return () => window.removeEventListener('navigate', handler)
  }, [])

  const content = () => {
    switch (page) {
      case 'dashboard': return <DashboardPage backendUser={backendUser} onNavigate={setPage} />
      case 'swipe': return <SwipePage backendUser={backendUser} />
      case 'connections': return <ConnectionsPage backendUser={backendUser} />
      case 'meetings': return <MeetingsPage backendUser={backendUser} />
      case 'profile': return <ProfilePage firebaseUser={firebaseUser} backendUser={backendUser} />
      case 'admin': return <AdminPage />
      case 'settings': return <SettingsPage backendUser={backendUser} darkMode={darkMode} setDarkMode={setDarkMode} />
      case 'matches': return <MatchesPage backendUser={backendUser} />
      case 'analytics': return <AnalyticsPage />
      case 'lab': return <AlgorithmLab />
      default: return <DashboardPage backendUser={backendUser} onNavigate={setPage} />
    }
  }

  const noScroll = page === 'connections' || page === 'meetings'

  return (
    <div className="app-shell">
      <Sidebar
        firebaseUser={firebaseUser} backendUser={backendUser}
        activePage={page} onNavigate={setPage} onLogout={onLogout}
        connectionCount={connCount} meetingCount={meetCount}
        darkMode={darkMode} setDarkMode={setDarkMode}
      />
      <main className="main-content" style={noScroll ? { overflow: 'hidden', padding: 0 } : {}}>
        <AnimatePresence mode="wait">
          <motion.div key={page} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0, transition: { duration: 0.18 } }} exit={{ opacity: 0 }}
            style={noScroll ? { height: '100%' } : {}}>
            {content()}
          </motion.div>
        </AnimatePresence>
      </main>
      {/* Floating AI Chatbot — always visible */}
      <AIChatbot backendUser={backendUser} />
    </div>
  )
}

function PlaceholderPage({ title, subtitle, icon: Icon }) {
  return (
    <>
      <div className="page-header"><h1 className="page-title">{title}</h1><p className="page-subtitle">{subtitle}</p></div>
      <div className="page-body"><div className="content-card"><div className="empty-state"><Icon size={32} strokeWidth={1.5} /><p>This section is coming soon.</p></div></div></div>
    </>
  )
}

/* ══════════════════════════════════════════════════════════════════
   ROOT APP — single source of truth
══════════════════════════════════════════════════════════════════ */
export default function App() {
  const [firebaseUser, setFirebaseUser] = useState(null)
  const [backendUser, setBackendUser] = useState(null)
  const [ready, setReady] = useState(false)

  const syncToBackend = useCallback(async (fbUser) => {
    try {
      const data = await api('/api/auth/google', {
        method: 'POST',
        body: JSON.stringify({ name: fbUser.displayName || fbUser.email, email: fbUser.email, googleId: fbUser.uid, photoURL: fbUser.photoURL || '' })
      })
      if (data.token) { localStorage.setItem('tp_token', data.token); setBackendUser(data.user) }
    } catch (e) { console.warn('Backend sync failed:', e.message) }
  }, [])

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser)
      if (fbUser) await syncToBackend(fbUser)
      else { setBackendUser(null); localStorage.removeItem('tp_token') }
      setReady(true)
    })
    return unsub
  }, [syncToBackend])

  const handleLogout = async () => { await logout() }

  const handleRoleSet = (role) => setBackendUser(u => ({ ...u, role }))
  const handleOnboardingComplete = () => setBackendUser(u => ({ ...u, isOnboarded: true, verificationStatus: 'pending' }))

  if (!ready) return <div className="loading-screen"><div className="spinner" /></div>

  /* ── Routing logic ── */
  if (!firebaseUser) return <motion.div {...fade}><AuthPage /></motion.div>
  if (backendUser?.isBanned) return <motion.div {...fade}><BannedPage reason={backendUser.banReason} onLogout={handleLogout} /></motion.div>
  if (!backendUser?.role) return <motion.div {...fade}><RolePage firebaseUser={firebaseUser} onRoleSet={handleRoleSet} /></motion.div>
  if (!backendUser?.isOnboarded && backendUser?.role !== 'admin') return <motion.div {...fade}><OnboardingPage role={backendUser.role} onComplete={handleOnboardingComplete} /></motion.div>
  if (backendUser?.verificationStatus === 'pending' && backendUser?.role !== 'admin') return <motion.div {...fade}><PendingPage onLogout={handleLogout} /></motion.div>
  if (backendUser?.verificationStatus === 'rejected' && backendUser?.role !== 'admin') return <motion.div {...fade}><RejectedPage note={backendUser.verificationNote} onLogout={handleLogout} /></motion.div>

  return (
    <motion.div {...fade} style={{ height: '100vh' }}>
      <DashboardShell firebaseUser={firebaseUser} backendUser={backendUser} onLogout={handleLogout} />
    </motion.div>
  )
}

/* ── Helpers ────────────────────────────────────────────────────── */
function friendlyError(code) {
  const m = { 'auth/user-not-found': 'No account found with this email.', 'auth/wrong-password': 'Incorrect password.', 'auth/invalid-credential': 'Invalid email or password.', 'auth/email-already-in-use': 'Email already registered.', 'auth/weak-password': 'Password must be at least 6 characters.', 'auth/invalid-email': 'Invalid email address.', 'auth/too-many-requests': 'Too many attempts. Wait and try again.', 'custom/name': 'Please enter your full name.' }
  return m[code] || 'Something went wrong. Please try again.'
}
