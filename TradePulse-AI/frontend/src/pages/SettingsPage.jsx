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
        <>
            <div className="page-header">
                <h1 className="page-title">Settings</h1>
                <p className="page-subtitle">Customize your TradePulse experience</p>
            </div>

            <div className="page-body" style={{ maxWidth: 680 }}>

                {/* Profile summary card */}
                <div style={{
                    background: 'linear-gradient(135deg,#111827,#374151)', color: 'white',
                    borderRadius: 16, padding: '1.25rem 1.5rem', marginBottom: '1.5rem',
                    display: 'flex', alignItems: 'center', gap: '1rem',
                }}>
                    <div style={{
                        width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 800, fontSize: '1.25rem',
                    }}>
                        {(backendUser?.name || '?')[0].toUpperCase()}
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '1rem' }}>{backendUser?.name}</div>
                        <div style={{ fontSize: '0.775rem', opacity: 0.75 }}>
                            {backendUser?.email} · <span style={{ textTransform: 'capitalize' }}>{backendUser?.role}</span>
                            {p.companyName && ` · ${p.companyName}`}
                        </div>
                    </div>
                    <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                        <div style={{ fontSize: '0.65rem', opacity: 0.65, marginBottom: '0.25rem' }}>VERIFICATION</div>
                        <span style={{
                            background: backendUser?.verificationStatus === 'approved' ? '#4ade8033' : '#fbbf2433',
                            border: `1px solid ${backendUser?.verificationStatus === 'approved' ? '#4ade80' : '#fbbf24'}`,
                            borderRadius: 99, padding: '0.2rem 0.75rem', fontSize: '0.7rem', fontWeight: 600, textTransform: 'capitalize',
                        }}>{backendUser?.verificationStatus}</span>
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

                {/* ── Privacy & Visibility ────────────────────────────── */}
                <Section title="Privacy & Visibility" icon={Eye} description="Control who can see your profile">
                    <Row label="Profile Visible" description="Allow verified users to see your profile in their discovery queue">
                        <Toggle id="visible" value={g('profileVisible', true)} onChange={v => set('profileVisible', v)} />
                    </Row>
                    <Row label="Show Online Status" description="Display when you're actively using the platform">
                        <Toggle id="online-status" value={g('showOnline', true)} onChange={v => set('showOnline', v)} />
                    </Row>
                    <Row label="Show Email to Connections" description="Your email is shared once you connect">
                        <Toggle id="share-email" value={g('shareEmail', false)} onChange={v => set('shareEmail', v)} />
                    </Row>
                </Section>

                {/* ── Match Preferences ───────────────────────────────── */}
                <Section title="Match Preferences" icon={Sliders} description="Fine-tune who you're shown in Discover">
                    <Row label="Minimum Match Score" description="Only show partners above this score">
                        <SelectInput value={g('minScore', '40')} onChange={v => set('minScore', v)}
                            options={[['0', 'No minimum'], ['30', '30+'], ['40', '40+'], ['60', '60+'], ['75', '75+ (Top matches)']]} />
                    </Row>
                    <Row label="Preferred Region" description="Prioritize partners from specific regions">
                        <SelectInput value={g('prefRegion', 'any')} onChange={v => set('prefRegion', v)}
                            options={[['any', 'Any Region'], ['Asia', 'Asia'], ['Europe', 'Europe'], ['North America', 'North America'], ['Middle East', 'Middle East'], ['South America', 'South America'], ['Africa', 'Africa']]} />
                    </Row>
                    <Row label="AI Auto-Message" description="Automatically send AI outreach when you click Interested">
                        <Toggle id="auto-msg" value={g('autoMessage', true)} onChange={v => set('autoMessage', v)} />
                    </Row>
                    <Row label="Show Only Certified Partners" description="Filter to partners with at least one certification">
                        <Toggle id="cert-only" value={g('certOnly', false)} onChange={v => set('certOnly', v)} />
                    </Row>
                </Section>

                {/* ── AI & Automation ─────────────────────────────────── */}
                <Section title="AI & Automation" icon={Zap} description="Configure AI-powered features">
                    <Row label="AI Chatbot" description="Enable the floating TradePulse AI assistant">
                        <Toggle id="ai-chatbot" value={g('aiChatbot', true)} onChange={v => set('aiChatbot', v)} />
                    </Row>
                    <Row label="Auto Trade Insights" description="Run AI profile analysis weekly">
                        <Toggle id="ai-insights" value={g('aiInsights', true)} onChange={v => set('aiInsights', v)} />
                    </Row>
                    <Row label="Smart Ranking" description="Sort discovery queue by AI match scores">
                        <Toggle id="smart-rank" value={g('smartRank', true)} onChange={v => set('smartRank', v)} />
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
                {saved && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)',
                            background: '#111827', color: 'white', borderRadius: 10, padding: '0.625rem 1.25rem',
                            fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem', zIndex: 9990,
                        }}>
                        <CheckCircle2 size={15} color="#4ade80" />Settings saved
                    </motion.div>
                )}
            </div>
        </>
    )
}
