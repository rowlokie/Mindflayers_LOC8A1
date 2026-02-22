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
const BUDGET_LABELS = {
    '0-10k': 'Under $10K',
    '10k-50k': '$10K - $50K',
    '50k-100k': '$50K - $100K',
    '100k-500k': '$100K - $500K',
    '500k-1m': '$500K - $1M',
    '1m+': 'Over $1M',
}

/* ── Single profile card ──────────────────────────────────────── */
function ProfileCard({ entry, onAction, busy }) {
    const { user: u, score, source, aiReason, breakdown } = entry
    const p = u?.tradeProfile || {}
    const isDataset = source === 'Dataset'
    const bg = isDataset ? 'linear-gradient(135deg, #7c3aed, #4c1d95)' : (REGION_BG[p.region] || 'var(--accent-gradient)')

    return (
        <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            className="content-card card-glass"
            style={{
                borderRadius: 24, overflow: 'hidden',
                width: '100%', maxWidth: 520, padding: 0,
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-lg)'
            }}
        >
            {/* Header / Gradient */}
            <div style={{ background: bg, padding: '2.5rem 2rem 2rem', color: 'white', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem' }}>
                    <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        style={{
                            width: 72, height: 72, borderRadius: 18,
                            background: 'rgba(255,255,255,0.2)',
                            backdropFilter: 'blur(8px)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '2rem', flexShrink: 0,
                            boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                        }}>
                        {INDUSTRY_EMOJI[p.industry] || '🏢'}
                    </motion.div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.4rem', letterSpacing: '-0.02em' }}>
                            {p.companyName || u.name}
                        </h2>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.875rem', opacity: 0.95 }}><MapPin size={14} />{p.country}</span>
                            <span style={{ fontSize: '0.875rem', opacity: 0.95 }}>🌍 {p.region}</span>
                        </div>
                    </div>

                    <div style={{
                        flexShrink: 0, width: 64, height: 64, borderRadius: '50%',
                        background: 'rgba(255,255,255,0.25)',
                        backdropFilter: 'blur(10px)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        border: '2px solid rgba(255,255,255,0.3)',
                        boxShadow: 'var(--shadow-md)'
                    }}>
                        <span style={{ fontSize: '1.25rem', fontWeight: 900, lineHeight: 1 }}>{score}</span>
                        <span style={{ fontSize: '0.55rem', fontWeight: 800, letterSpacing: '0.05em', opacity: 0.9 }}>SCORE</span>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', position: 'absolute', bottom: -12, right: 24 }}>
                    <span style={{
                        background: 'var(--bg-white)', color: 'var(--accent)',
                        padding: '0.375rem 1rem', borderRadius: 99,
                        fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase',
                        boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)'
                    }}>{u.role}</span>
                    {isDataset && (
                        <span style={{
                            background: '#faf5ff', color: '#7c3aed',
                            padding: '0.375rem 1rem', borderRadius: 99,
                            fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase',
                            boxShadow: 'var(--shadow-sm)', border: '1px solid #ddd6fe'
                        }}>📊 Dataset Lead</span>
                    )}
                </div>
            </div>

            {/* AI Insight Bar */}
            <div style={{ background: isDataset ? '#f5f3ff' : 'var(--accent-light)', padding: '0.75rem 2rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Zap size={14} className={isDataset ? 'text-purple-600' : 'text-accent'} fill="currentColor" />
                <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600, color: isDataset ? '#5b21b6' : 'var(--accent)', fontStyle: 'italic' }}>
                    "{aiReason || 'Strategic industry alignment detected.'}"
                </p>
            </div>

            {/* Body */}
            <div style={{ padding: '2.5rem 2rem 2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    {[
                        [' Industry', p.industry],
                        [' Budget', BUDGET_LABELS[p.budgetRange] || p.budgetRange],
                        [' Capacity', p.capacity || (p.exporterSize ? p.exporterSize : 'Mid-size')],
                        [' Urgency', p.deliveryUrgency || 'Immediate'],
                    ].filter(([, v]) => v).map(([k, v]) => (
                        <div key={k} style={{ background: 'var(--bg-subtle)', borderRadius: 14, padding: '0.875rem 1.125rem', border: '1px solid var(--border)' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>{k}</div>
                            <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>{v}</div>
                        </div>
                    ))}
                </div>

                {/* Products Tags */}
                {u.role === 'exporter' && (p.productsCategories || []).length > 0 && (
                    <div style={{ marginBottom: '1.25rem' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Portfolio Overview</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {p.productsCategories.map(c => (
                                <span key={c} style={{ fontSize: '0.75rem', padding: '0.375rem 0.875rem', background: 'var(--accent-light)', borderRadius: 10, border: '1px solid var(--accent)', color: 'var(--accent)', fontWeight: 600 }}>{c}</span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Certifications Row */}
                {[...(p.certifications || []), ...(p.certificationRequired || [])].slice(0, 4).length > 0 && (
                    <div style={{ marginBottom: '1.25rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {[...(p.certifications || []), ...(p.certificationRequired || [])].slice(0, 4).map(c => (
                            <span key={c} style={{ fontSize: '0.75rem', padding: '0.375rem 0.875rem', background: '#ecfdf5', borderRadius: 10, border: '1px solid #10b981', color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Award size={14} />{c}
                            </span>
                        ))}
                    </div>
                )}

                {/* Dynamic Quote / Bio */}
                {p.buyingRequirements && (
                    <div style={{ background: 'var(--bg-subtle)', borderRadius: 16, padding: '1.25rem', border: '1px solid var(--border)', marginBottom: '0.5rem', position: 'relative' }}>
                        <div style={{ position: 'absolute', top: -10, left: 16, background: 'var(--bg-white)', px: '0.5rem', fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)' }}>MANDATE</div>
                        <p style={{ fontSize: '0.9375rem', color: 'var(--text-primary)', lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>
                            "{p.buyingRequirements.slice(0, 160)}{p.buyingRequirements.length > 160 ? '…' : ''}"
                        </p>
                    </div>
                )}
            </div>

            {/* The 3 action buttons */}
            <div style={{ padding: '0 2rem 2.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', gap: '1rem' }}>
                <button
                    disabled={busy}
                    onClick={() => onAction('pass')}
                    style={{
                        padding: '1rem', borderRadius: 16, border: '1px solid #fca5a5',
                        background: '#fff5f5', color: '#dc2626', cursor: busy ? 'not-allowed' : 'pointer',
                        fontFamily: 'inherit', fontWeight: 800, fontSize: '0.75rem',
                        transition: 'all 0.2s', opacity: busy ? 0.6 : 1,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#fff5f5'; e.currentTarget.style.transform = 'none' }}
                >
                    <X size={20} strokeWidth={2.5} /> PASS
                </button>

                <button
                    disabled={busy}
                    onClick={() => onAction('skip')}
                    style={{
                        padding: '1rem', borderRadius: 16, border: '1px solid var(--border)',
                        background: 'var(--bg-subtle)', color: 'var(--text-secondary)', cursor: busy ? 'not-allowed' : 'pointer',
                        fontFamily: 'inherit', fontWeight: 800, fontSize: '0.75rem',
                        transition: 'all 0.2s', opacity: busy ? 0.6 : 1,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-white)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-subtle)'; e.currentTarget.style.transform = 'none' }}
                >
                    <SkipForward size={20} strokeWidth={2.5} /> SKIP
                </button>

                <button
                    disabled={busy}
                    onClick={() => onAction('like')}
                    className="btn-primary btn-glow"
                    style={{
                        borderRadius: 16, height: '100%',
                        cursor: busy ? 'not-allowed' : 'pointer',
                        fontWeight: 800, fontSize: '0.875rem',
                        opacity: busy ? 0.6 : 1,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <CheckCircle2 size={18} strokeWidth={3} /> INTERESTED
                    </div>
                    <span style={{ fontSize: '0.6rem', opacity: 0.8 }}>ESTABLISH LINK</span>
                </button>
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
            body: JSON.stringify({ targetId: current.user.id, action }),
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
                                key={current?.user?.id || index}
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
