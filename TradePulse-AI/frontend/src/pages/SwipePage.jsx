import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Award, RotateCcw, CheckCircle2, X, SkipForward, Zap, Globe, Building2 } from 'lucide-react'

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'
const api = async (path, opts = {}) => {
    const token = localStorage.getItem('tp_token')
    const res = await fetch(`${BACKEND}${path}`, {
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        ...opts,
    })
    return res.json()
}

const INDUSTRY_EMOJI = {
    Steel: '⚙️', Textile: '🧵', Electronics: '💡', Pharma: '💊',
    Agriculture: '🌾', Chemicals: '🧪', Automotive: '🚗',
    'Food & Beverages': '🍽️', Machinery: '🔧', 'Medical Devices': '🏥',
}
const REGION_BG = {
    Asia: 'linear-gradient(135deg,#1d4ed8,#111827)',
    Europe: 'linear-gradient(135deg,#6d28d9,#111827)',
    'North America': 'linear-gradient(135deg,#047857,#111827)',
    'South America': 'linear-gradient(135deg,#b45309,#111827)',
    'Middle East': 'linear-gradient(135deg,#b91c1c,#111827)',
    Africa: 'linear-gradient(135deg,#c2410c,#111827)',
    Oceania: 'linear-gradient(135deg,#0e7490,#111827)',
}

/* ── Single profile card ──────────────────────────────────────── */
function ProfileCard({ entry, onAction, busy }) {
    const { user: u, score } = entry
    const p = u?.tradeProfile || {}
    const bg = REGION_BG[p.region] || 'linear-gradient(135deg,#374151,#111827)'

    return (
        <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.22 }}
            style={{
                background: 'white', borderRadius: 20, overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(0,0,0,0.10)', border: '1px solid #e5e7eb',
                width: '100%', maxWidth: 520,
            }}
        >
            {/* Gradient header */}
            <div style={{ background: bg, padding: '1.75rem 1.5rem 1.5rem', color: 'white' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                    {/* Industry icon */}
                    <div style={{
                        width: 64, height: 64, borderRadius: 16,
                        background: 'rgba(255,255,255,0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.875rem', flexShrink: 0,
                    }}>
                        {INDUSTRY_EMOJI[p.industry] || '🏢'}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.25rem', lineHeight: 1.2 }}>
                            {p.companyName || u.name}
                        </h2>
                        <div style={{ fontSize: '0.8rem', opacity: 0.85, display: 'flex', flexWrap: 'wrap', gap: '0.625rem', alignItems: 'center' }}>
                            {p.country && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><MapPin size={11} />{p.country}</span>}
                            {p.region && <span>🌍 {p.region}</span>}
                            <span style={{
                                background: 'rgba(255,255,255,0.2)', borderRadius: 99,
                                padding: '0.1rem 0.6rem', fontSize: '0.7rem', textTransform: 'capitalize',
                            }}>{u.role}</span>
                        </div>
                    </div>

                    {/* Match score badge */}
                    <div style={{
                        flexShrink: 0, width: 54, height: 54, borderRadius: '50%',
                        background: 'rgba(255,255,255,0.15)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        border: '1.5px solid rgba(255,255,255,0.3)',
                    }}>
                        <span style={{ fontSize: '1.05rem', fontWeight: 900, lineHeight: 1 }}>{score}</span>
                        <span style={{ fontSize: '0.5rem', opacity: 0.8, letterSpacing: '0.04em', marginTop: 1 }}>MATCH</span>
                    </div>
                </div>
            </div>

            {/* Body */}
            <div style={{ padding: '1.25rem 1.5rem' }}>

                {/* Stats grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem', marginBottom: '1rem' }}>
                    {[
                        ['🏭 Industry', p.industry],
                        ['💰 Budget', p.budgetRange],
                        ['📦 Size', p.exporterSize || p.preferredExporterSize],
                        ['⚡ Urgency', p.deliveryUrgency],
                    ].filter(([, v]) => v).map(([k, v]) => (
                        <div key={k} style={{ background: '#f9fafb', borderRadius: 10, padding: '0.6rem 0.75rem', border: '1px solid #f0f0f0' }}>
                            <div style={{ fontSize: '0.65rem', color: '#9ca3af', marginBottom: '0.2rem' }}>{k}</div>
                            <div style={{ fontSize: '0.8125rem', fontWeight: 600, textTransform: 'capitalize', color: '#111827' }}>{v}</div>
                        </div>
                    ))}
                </div>

                {/* Products */}
                {u.role === 'exporter' && (p.productsCategories || []).length > 0 && (
                    <div style={{ marginBottom: '0.875rem' }}>
                        <div style={{ fontSize: '0.65rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>Products</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                            {p.productsCategories.map(c => (
                                <span key={c} style={{ fontSize: '0.75rem', padding: '0.2rem 0.625rem', background: '#f3f4f6', borderRadius: 99, border: '1px solid #e5e7eb', color: '#374151' }}>{c}</span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Target export countries */}
                {u.role === 'exporter' && (p.exportingTo || []).length > 0 && (
                    <div style={{ marginBottom: '0.875rem' }}>
                        <div style={{ fontSize: '0.65rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>
                            <Globe size={10} style={{ display: 'inline', marginRight: 3 }} />Exports to
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                            {p.exportingTo.map(c => (
                                <span key={c} style={{ fontSize: '0.75rem', padding: '0.2rem 0.625rem', background: '#eff6ff', borderRadius: 99, border: '1px solid #bfdbfe', color: '#2563eb' }}>{c}</span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Certifications */}
                {[...(p.certifications || []), ...(p.certificationRequired || [])].slice(0, 4).length > 0 && (
                    <div style={{ marginBottom: '0.875rem', display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                        {[...(p.certifications || []), ...(p.certificationRequired || [])].slice(0, 4).map(c => (
                            <span key={c} style={{ fontSize: '0.7rem', padding: '0.2rem 0.55rem', background: '#f0fdf4', borderRadius: 99, border: '1px solid #bbf7d0', color: '#15803d' }}>
                                <Award size={9} style={{ display: 'inline', marginRight: 3 }} />{c}
                            </span>
                        ))}
                    </div>
                )}

                {/* Buying requirements */}
                {p.buyingRequirements && (
                    <div style={{ background: '#fafafa', borderRadius: 10, padding: '0.75rem', border: '1px solid #f0f0f0', marginBottom: '0.875rem' }}>
                        <div style={{ fontSize: '0.65rem', color: '#9ca3af', marginBottom: '0.3rem' }}>BUYING REQUIREMENTS</div>
                        <p style={{ fontSize: '0.8125rem', color: '#4b5563', lineHeight: 1.55, margin: 0 }}>
                            "{p.buyingRequirements.slice(0, 140)}{p.buyingRequirements.length > 140 ? '…' : ''}"
                        </p>
                    </div>
                )}

                {/* ─── The 3 action buttons ─────────────────────────────── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.625rem', marginTop: '0.25rem' }}>
                    {/* Not Interested */}
                    <button
                        disabled={busy}
                        onClick={() => onAction('pass')}
                        style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem',
                            padding: '0.75rem 0.5rem', borderRadius: 12, border: '1.5px solid #fca5a5',
                            background: '#fff5f5', color: '#dc2626', cursor: busy ? 'not-allowed' : 'pointer',
                            fontFamily: 'inherit', fontWeight: 600, fontSize: '0.775rem',
                            transition: 'all 0.15s', opacity: busy ? 0.6 : 1,
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.transform = 'scale(1.03)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#fff5f5'; e.currentTarget.style.transform = 'scale(1)' }}
                    >
                        <X size={20} strokeWidth={2.5} />
                        Not Interested
                    </button>

                    {/* Skip */}
                    <button
                        disabled={busy}
                        onClick={() => onAction('skip')}
                        style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem',
                            padding: '0.75rem 0.5rem', borderRadius: 12, border: '1.5px solid #e5e7eb',
                            background: '#f9fafb', color: '#6b7280', cursor: busy ? 'not-allowed' : 'pointer',
                            fontFamily: 'inherit', fontWeight: 600, fontSize: '0.775rem',
                            transition: 'all 0.15s', opacity: busy ? 0.6 : 1,
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.transform = 'scale(1.03)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.transform = 'scale(1)' }}
                    >
                        <SkipForward size={20} strokeWidth={2} />
                        Skip
                    </button>

                    {/* Interested */}
                    <button
                        disabled={busy}
                        onClick={() => onAction('like')}
                        style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem',
                            padding: '0.75rem 0.5rem', borderRadius: 12, border: 'none',
                            background: 'linear-gradient(135deg,#111827,#374151)', color: 'white',
                            cursor: busy ? 'not-allowed' : 'pointer',
                            fontFamily: 'inherit', fontWeight: 700, fontSize: '0.775rem',
                            transition: 'all 0.15s', opacity: busy ? 0.6 : 1,
                            boxShadow: '0 2px 12px rgba(17,24,39,0.25)',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(17,24,39,0.38)' }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(17,24,39,0.25)' }}
                    >
                        <CheckCircle2 size={20} strokeWidth={2.5} />
                        Interested
                    </button>
                </div>
            </div>
        </motion.div>
    )
}

/* ── Connection flash banner ─────────────────────────────────── */
function ConnectedBanner({ name, onViewConnections, onDismiss }) {
    useEffect(() => {
        const t = setTimeout(onDismiss, 4500)
        return () => clearTimeout(t)
    }, [onDismiss])

    return (
        <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            style={{
                position: 'fixed', top: '1.25rem', left: '50%', transform: 'translateX(-50%)',
                zIndex: 9999, background: '#111827', color: 'white', borderRadius: 14,
                padding: '0.875rem 1.25rem', display: 'flex', alignItems: 'center',
                gap: '0.875rem', boxShadow: '0 8px 32px rgba(0,0,0,0.25)', whiteSpace: 'nowrap',
            }}
        >
            <CheckCircle2 size={18} color="#4ade80" />
            <span style={{ fontSize: '0.9rem' }}>
                Connected with <strong>{name}</strong>! AI message sent.
            </span>
            <button
                onClick={onViewConnections}
                style={{
                    background: 'white', color: '#111827', border: 'none', borderRadius: 8,
                    padding: '0.3rem 0.75rem', fontSize: '0.775rem', fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'inherit',
                }}
            >
                View →
            </button>
            <button onClick={onDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#9ca3af' }}>
                <X size={14} />
            </button>
        </motion.div>
    )
}

/* ══════════════════════════════════════════════════════════════
   MAIN SwipePage
══════════════════════════════════════════════════════════════ */
export default function SwipePage({ backendUser }) {
    const [queue, setQueue] = useState([])
    const [index, setIndex] = useState(0)
    const [loading, setLoading] = useState(true)
    const [busy, setBusy] = useState(false)
    const [stats, setStats] = useState({ interested: 0, notInterested: 0, connections: 0 })
    const [banner, setBanner] = useState(null)  // { name }

    const loadQueue = useCallback(async () => {
        setLoading(true)
        const [q, s] = await Promise.all([api('/api/swipe/queue'), api('/api/swipe/stats')])
        setQueue(q.queue || [])
        setStats(s)
        setIndex(0)
        setLoading(false)
    }, [])

    useEffect(() => { loadQueue() }, [loadQueue])

    const current = queue[index]

    const handleAction = async (action) => {
        if (!current || busy) return
        setBusy(true)

        const res = await api('/api/swipe', {
            method: 'POST',
            body: JSON.stringify({ targetId: current.user._id, action }),
        })

        if (action === 'like' && res.connected) {
            setBanner({ name: res.partnerName || current.user.tradeProfile?.companyName || current.user.name })
            setStats(s => ({ ...s, connections: s.connections + 1, interested: s.interested + 1 }))
        } else if (action === 'pass') {
            setStats(s => ({ ...s, notInterested: s.notInterested + 1 }))
        }

        setIndex(i => i + 1)
        setBusy(false)
    }

    const progressPct = queue.length > 0 ? Math.min((index / queue.length) * 100, 100) : 0

    return (
        <div style={{ position: 'relative' }}>
            {/* Connection banner */}
            <AnimatePresence>
                {banner && (
                    <ConnectedBanner
                        name={banner.name}
                        onViewConnections={() => {
                            setBanner(null)
                            window.dispatchEvent(new CustomEvent('navigate', { detail: 'connections' }))
                        }}
                        onDismiss={() => setBanner(null)}
                    />
                )}
            </AnimatePresence>

            <div className="page-header">
                <h1 className="page-title">Discover Partners</h1>
                <p className="page-subtitle">Browse trade profiles and connect instantly with one click</p>
            </div>

            <div className="page-body">

                {/* Stats */}
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                    {[
                        ['✅ Interested', stats.interested, '#f0fdf4', '#15803d', '#bbf7d0'],
                        ['❌ Not Interested', stats.notInterested, '#fff5f5', '#dc2626', '#fca5a5'],
                        ['🤝 Connections', stats.connections, '#eff6ff', '#2563eb', '#bfdbfe'],
                        ['📋 In Queue', Math.max(0, queue.length - index), '#f9fafb', '#374151', '#e5e7eb'],
                    ].map(([label, value, bg, color, border]) => (
                        <div key={label} style={{
                            flex: '1 1 110px', background: bg, border: `1px solid ${border}`,
                            borderRadius: 12, padding: '0.75rem 1rem',
                        }}>
                            <div style={{ fontSize: '0.65rem', color, fontWeight: 600, marginBottom: '0.25rem' }}>{label}</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 900, color }}>{value}</div>
                        </div>
                    ))}
                </div>

                {/* Progress bar */}
                {queue.length > 0 && (
                    <div style={{ background: '#e5e7eb', borderRadius: 4, height: 3, marginBottom: '1.5rem', overflow: 'hidden' }}>
                        <motion.div
                            animate={{ width: `${progressPct}%` }}
                            transition={{ duration: 0.4 }}
                            style={{ height: '100%', background: '#111827', borderRadius: 4 }}
                        />
                    </div>
                )}

                {/* Content */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                    {loading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '4rem' }}>
                            <div className="spinner" />
                            <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Finding your best matches…</p>
                        </div>
                    ) : index >= queue.length ? (
                        /* Empty state */
                        <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✨</div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>You've seen everyone!</h3>
                            <p style={{ color: '#9ca3af', marginBottom: '2rem', fontSize: '0.9rem' }}>
                                New verified users are onboarded daily. Check back tomorrow, or refresh the queue.
                            </p>
                            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                                <button className="btn-primary" style={{ width: 'auto' }} onClick={loadQueue}>
                                    <RotateCcw size={14} style={{ display: 'inline', marginRight: 6 }} />Refresh Queue
                                </button>
                                <button
                                    onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'connections' }))}
                                    style={{
                                        padding: '0.625rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
                                        background: 'white', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.875rem', fontWeight: 500,
                                    }}
                                >
                                    View Connections ({stats.connections})
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Profile card */
                        <AnimatePresence mode="wait">
                            <ProfileCard
                                key={current?.user?._id || index}
                                entry={current}
                                onAction={handleAction}
                                busy={busy}
                            />
                        </AnimatePresence>
                    )}
                </div>

                {/* Legend */}
                {!loading && index < queue.length && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '0.75rem', fontSize: '0.7rem', color: '#9ca3af' }}>
                        <span>❌ Never show again</span>
                        <span>⏭️ Come back later</span>
                        <span>✅ Connect instantly</span>
                    </div>
                )}
            </div>
        </div>
    )
}
