import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
    Moon, Sun, Bell, BellOff, Eye, EyeOff, Shield, Download,
    Trash2, Globe, Sliders, CheckCircle2, Info, Palette, Zap,
} from 'lucide-react'

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

function Toggle({ value, onChange, id }) {
    return (
        <button id={id} onClick={() => onChange(!value)} role="switch" aria-checked={value}
            style={{
                width: 44, height: 24, borderRadius: 99, border: 'none', cursor: 'pointer',
                background: value ? '#111827' : '#d1d5db',
                position: 'relative', transition: 'background 0.2s', flexShrink: 0,
            }}>
            <span style={{
                position: 'absolute', top: 3, left: value ? 23 : 3,
                width: 18, height: 18, borderRadius: '50%', background: 'white',
                transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }} />
        </button>
    )
}

function Section({ title, icon: Icon, children, description }) {
    return (
        <div style={{ background: 'var(--bg-white)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', marginBottom: '1.25rem' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={17} color="var(--text-secondary)" />
                </div>
                <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{title}</div>
                    {description && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{description}</div>}
                </div>
            </div>
            <div style={{ padding: '0.25rem 0' }}>{children}</div>
        </div>
    )
}

function Row({ label, description, children, danger }) {
    return (
        <div style={{
            padding: '0.875rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem',
            borderBottom: '1px solid var(--border)', ':lastChild': { borderBottom: 'none' },
        }}>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, fontSize: '0.875rem', color: danger ? 'var(--danger)' : 'var(--text-primary)' }}>{label}</div>
                {description && <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{description}</div>}
            </div>
            {children}
        </div>
    )
}

function SelectInput({ value, onChange, options }) {
    return (
        <select value={value} onChange={e => onChange(e.target.value)}
            style={{
                padding: '0.4rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)',
                background: 'var(--bg-subtle)', color: 'var(--text-primary)', fontFamily: 'inherit',
                fontSize: '0.8125rem', cursor: 'pointer', outline: 'none',
            }}>
            {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
    )
}

export default function SettingsPage({ backendUser, darkMode, setDarkMode }) {
    // Load from localStorage or defaults
    const [prefs, setPrefs] = useState(() => {
        try { return JSON.parse(localStorage.getItem('tp_prefs') || '{}') } catch { return {} }
    })

    const set = (key, val) => {
        const next = { ...prefs, [key]: val }
        setPrefs(next)
        localStorage.setItem('tp_prefs', JSON.stringify(next))
    }

    const g = (key, def) => prefs[key] ?? def

    const [saved, setSaved] = useState(false)
    const [delConf, setDelConf] = useState(false)

    const saveFlash = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

    const exportData = () => {
        const data = { user: backendUser, exportedAt: new Date().toISOString(), settings: prefs }
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a'); a.href = url; a.download = 'tradepulse-data.json'; a.click()
    }

    const p = backendUser?.tradeProfile || {}

    return (
        <div style={{ maxWidth: 800, margin: '0 auto', paddingBottom: '5rem' }}>
            <div className="page-header" style={{ marginBottom: '3rem', borderBottom: '1px solid var(--border)', paddingBottom: '2rem' }}>
                <h1 className="page-title" style={{ fontSize: '2.5rem', letterSpacing: '-0.03em' }}>Node Configurations</h1>
                <p className="page-subtitle" style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>Manage your TradePulse endpoint security, intelligence feeds, and interface parameters.</p>
            </div>

            <div className="page-body" style={{ maxWidth: 680 }}>

                {/* Profile summary card */}
                <div style={{
                    background: 'var(--bg-glass)', border: '1px solid var(--border)',
                    borderRadius: 24, padding: '2rem', marginBottom: '3rem',
                    display: 'flex', alignItems: 'center', gap: '1.5rem',
                    boxShadow: 'var(--shadow-md)'
                }}>
                    <div style={{
                        width: 72, height: 72, borderRadius: 20, background: 'var(--accent-gradient)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                        fontWeight: 900, fontSize: '2rem', flexShrink: 0,
                        boxShadow: '0 10px 25px rgba(37, 99, 235, 0.4)'
                    }}>
                        {(backendUser?.name || '?')[0].toUpperCase()}
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                            <div style={{ fontWeight: 900, fontSize: '1.5rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{backendUser?.name}</div>
                            <span style={{
                                background: backendUser?.verificationStatus === 'approved' ? '#ecfdf5' : '#fffbeb',
                                border: `1px solid ${backendUser?.verificationStatus === 'approved' ? '#a7f3d0' : '#fde68a'}`,
                                color: backendUser?.verificationStatus === 'approved' ? '#059669' : '#d97706',
                                borderRadius: 99, padding: '0.25rem 0.75rem', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em'
                            }}>{backendUser?.verificationStatus}</span>
                        </div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ color: 'var(--accent)' }}>{backendUser?.email}</span>
                            <span>•</span>
                            <span style={{ textTransform: 'capitalize' }}>{backendUser?.role}</span>
                            {p.companyName && <><span>•</span> <span>{p.companyName}</span></>}
                        </div>
                    </div>
                </div>

                {/* ── Appearance ──────────────────────────────────────── */}
                <Section title="Appearance" icon={Palette} description="Theme, display, and visual preferences">
                    <Row label="Dark Mode" description="Easy on the eyes — great for late-night sessions">
                        <Toggle id="dark-mode" value={darkMode} onChange={v => { setDarkMode(v); saveFlash() }} />
                    </Row>
                    <Row label="Font Size" description="Adjust text size across the platform">
                        <SelectInput value={g('fontSize', 'medium')} onChange={v => { set('fontSize', v); saveFlash() }}
                            options={[['small', 'Small'], ['medium', 'Medium'], ['large', 'Large']]} />
                    </Row>
                    <Row label="Compact Mode" description="Reduce padding for denser information display">
                        <Toggle id="compact" value={g('compactMode', false)} onChange={v => { set('compactMode', v); saveFlash() }} />
                    </Row>
                    <Row label="Animations" description="UI motion effects and transitions">
                        <Toggle id="animations" value={g('animations', true)} onChange={v => { set('animations', v); saveFlash() }} />
                    </Row>
                </Section>

                {/* ── Notifications ───────────────────────────────────── */}
                <Section title="Notifications" icon={Bell} description="Control when and how you're notified">
                    <Row label="New Connections" description="Alert when someone connects with you">
                        <Toggle id="notif-conn" value={g('notifConnections', true)} onChange={v => set('notifConnections', v)} />
                    </Row>
                    <Row label="Meeting Requests" description="Alert when a partner proposes a meeting">
                        <Toggle id="notif-meeting" value={g('notifMeetings', true)} onChange={v => set('notifMeetings', v)} />
                    </Row>
                    <Row label="New Messages" description="Alert on incoming chat messages">
                        <Toggle id="notif-msg" value={g('notifMessages', true)} onChange={v => set('notifMessages', v)} />
                    </Row>
                    <Row label="AI Insights" description="Weekly AI-generated profile improvement tips">
                        <Toggle id="notif-ai" value={g('notifAI', true)} onChange={v => set('notifAI', v)} />
                    </Row>
                </Section>

                {/* ── Privacy & Match Settings (Coming Soon) ────────────────────────────── */}
                <Section title="Account & Platform Settings" icon={Shield} description="Manage your preferences">
                    <Row label="Profile Visible" description="Allow verified users to see your profile in their discovery queue">
                        <Toggle id="visible" value={g('profileVisible', true)} onChange={v => set('profileVisible', v)} />
                    </Row>
                    <Row label="Minimum Match Score" description="Only show partners above this score">
                        <SelectInput value={g('minScore', '40')} onChange={v => set('minScore', v)}
                            options={[['0', 'No minimum'], ['30', '30+'], ['40', '40+'], ['60', '60+'], ['75', '75+ (Top matches)']]} />
                    </Row>
                </Section>

                {/* ── Data & Account ──────────────────────────────────── */}
                <Section title="Data & Account" icon={Shield} description="Manage your data and account">
                    <Row label="Export My Data" description="Download all your TradePulse data as JSON">
                        <button onClick={exportData}
                            style={{ padding: '0.4rem 0.875rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-subtle)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: 5 }}>
                            <Download size={13} />Export
                        </button>
                    </Row>
                    <Row label="Platform Version" description="Current build info">
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>v2.0.0-alpha</span>
                    </Row>
                    <Row label="Delete Account" description="Permanently remove your account and all data" danger>
                        {!delConf ? (
                            <button onClick={() => setDelConf(true)}
                                style={{ padding: '0.4rem 0.875rem', borderRadius: 8, border: '1px solid #fca5a5', background: '#fff5f5', color: '#dc2626', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: 5 }}>
                                <Trash2 size={13} />Delete
                            </button>
                        ) : (
                            <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center', fontSize: '0.775rem' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Are you sure?</span>
                                <button onClick={() => setDelConf(false)}
                                    style={{ padding: '0.3rem 0.625rem', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-subtle)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.775rem' }}>
                                    Cancel
                                </button>
                                <button onClick={() => alert('Account deletion would require email confirmation — contact support.')}
                                    style={{ padding: '0.3rem 0.625rem', borderRadius: 6, border: 'none', background: '#dc2626', color: 'white', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.775rem' }}>
                                    Confirm
                                </button>
                            </div>
                        )}
                    </Row>
                </Section>

                {/* Saved flash */}
                <AnimatePresence>
                    {saved && (
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            style={{
                                position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)',
                                background: 'var(--text-primary)', color: 'var(--bg-white)', borderRadius: 16, padding: '0.75rem 1.5rem',
                                fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.75rem', zIndex: 9990,
                                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                            }}>
                            <CheckCircle2 size={18} color="#4ade80" /> Memory Configured Successfully.
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
