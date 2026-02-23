import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    BarChart3, TrendingUp, Globe, Users, PieChart, Activity,
    Briefcase, Zap, Map, ArrowUpRight, ShieldCheck, Search
} from 'lucide-react'

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'
const api = async (path, opts = {}) => {
    const token = localStorage.getItem('tp_token')
    const res = await fetch(`${BACKEND}${path}`, {
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        ...opts,
    })
    return res.json()
}

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
}

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', damping: 22, stiffness: 100 } }
}

function ProgressCircle({ value, label, color, icon: Icon }) {
    const radius = 38
    const circ = 2 * Math.PI * radius
    const offset = circ - (value / 100) * circ

    return (
        <div style={{ textAlign: 'center' }}>
            <div style={{ position: 'relative', width: 110, height: 110, margin: '0 auto' }}>
                <svg style={{ transform: 'rotate(-90deg)', width: 110, height: 110 }}>
                    <circle cx="55" cy="55" r={radius} stroke="var(--bg-subtle)" strokeWidth="10" fill="transparent" />
                    <motion.circle
                        cx="55" cy="55" r={radius} stroke={color} strokeWidth="10" fill="transparent"
                        strokeDasharray={circ}
                        initial={{ strokeDashoffset: circ }}
                        animate={{ strokeDashoffset: offset }}
                        transition={{ duration: 2, ease: 'circOut' }}
                        strokeLinecap="round"
                    />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontWeight: 900, fontSize: '1.5rem', color: 'var(--text-primary)', lineHeight: 1 }}>{value}%</span>
                    {Icon && <Icon size={14} style={{ marginTop: 4, opacity: 0.6 }} />}
                </div>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
        </div>
    )
}

function BarGroup({ name, count, total, color }) {
    const pct = total > 0 ? (count / total) * 100 : 0
    return (
        <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600 }}>
                <span style={{ color: 'var(--text-primary)' }}>{name}</span>
                <span style={{ color: 'var(--text-muted)', background: 'var(--bg-subtle)', px: '0.5rem', borderRadius: 6, fontSize: '0.75rem' }}>{count} Matches</span>
            </div>
            <div style={{ height: 10, background: 'var(--bg-subtle)', borderRadius: 5, overflow: 'hidden' }}>
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1.2, ease: 'anticipate' }}
                    style={{
                        height: '100%',
                        background: color,
                        borderRadius: 5,
                        boxShadow: `0 0 10px ${color}33`
                    }}
                />
            </div>
        </div>
    )
}

/* ── Live Market Map Visual ────────────────────────────────── */
function MarketMap() {
    return (
        <div style={{ position: 'relative', width: '100%', height: 200, background: 'var(--bg-subtle)', borderRadius: 16, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Globe size={120} color="var(--border)" strokeWidth={0.5} style={{ opacity: 0.3 }} />
            {/* Animated nodes to simulate activity */}
            {[
                { t: '10%', l: '20%', c: '#3b82f6' },
                { t: '40%', l: '70%', c: '#10b981' },
                { t: '60%', l: '30%', c: '#f59e0b' },
                { t: '25%', l: '80%', c: '#ef4444' }
            ].map((n, i) => (
                <motion.div
                    key={i}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 0] }}
                    transition={{ repeat: Infinity, duration: 3, delay: i * 0.7 }}
                    style={{
                        position: 'absolute', top: n.t, left: n.l,
                        width: 12, height: 12, borderRadius: '50%', background: n.c,
                        boxShadow: `0 0 15px ${n.c}`
                    }}
                />
            ))}
            <div style={{ position: 'absolute', bottom: 12, left: 12, display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
                LIVE NETWORK LATENCY: 24ms
            </div>
        </div>
    )
}

export default function AnalyticsPage() {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)

    const load = useCallback(async () => {
        try {
            const res = await api('/api/swipe/analytics/overview')
            setData(res)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { load() }, [load])

    if (loading) return (
        <div style={{ padding: '10rem 0', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 1.5rem' }} />
            <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Syncing with global trade ledger...</p>
        </div>
    )

    const maxCount = Math.max(...(data?.topIndustries || []).map(i => i.count), 1)

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div className="page-header" style={{ marginBottom: '3rem', borderBottom: '1px solid var(--border)', paddingBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div style={{
                        width: 60, height: 60, borderRadius: 16,
                        background: 'var(--accent-gradient)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                        boxShadow: '0 8px 25px rgba(37, 99, 235, 0.35)'
                    }}>
                        <BarChart3 size={28} />
                    </div>
                    <div>
                        <h1 className="page-title" style={{ fontSize: '2.5rem', letterSpacing: '-0.03em', marginBottom: '0.25rem' }}>Network Intelligence</h1>
                        <p className="page-subtitle" style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>Real-time telemetry and funnel effectiveness metrics.</p>
                    </div>
                </div>
            </div>

            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="page-body"
            >
                {/* Top Summary Section */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                    <motion.div variants={item} className="content-card card-glass" style={{ padding: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <div style={{ fontWeight: 800, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <TrendingUp size={18} color="var(--accent)" /> Trade Funnel
                            </div>
                            <span style={{ fontSize: '0.75rem', background: 'var(--bg-subtle)', px: '0.6rem', py: '0.2rem', borderRadius: 6, color: 'var(--text-muted)' }}>LIVE</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                            <ProgressCircle value={data?.matchRate || 0} label="Match Efficacy" color="#3b82f6" icon={Zap} />
                            <ProgressCircle value={data?.profileStrength || 0} label="Profile Power" color="#10b981" icon={ShieldCheck} />
                        </div>
                    </motion.div>

                    <motion.div variants={item} className="content-card card-glass" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ fontWeight: 800, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.5rem' }}>
                            <Activity size={18} color="#ef4444" /> Market Pulse
                        </div>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>{data?.activeToday || 0}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, marginTop: '0.5rem' }}>ACTIVE LEADS</div>
                            </div>
                            <div style={{ width: 1, height: '60%', background: 'var(--border)' }} />
                            <div>
                                <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <ArrowUpRight size={18} /> +12%
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>VS YESTERDAY</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 4, marginTop: '1.5rem' }}>
                            {Array.from({ length: 14 }).map((_, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ height: 10 }}
                                    animate={{ height: [10, Math.random() * 30 + 10, 15] }}
                                    transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.1 }}
                                    style={{ flex: 1, background: 'var(--accent)', opacity: 0.3 + (i / 14), borderRadius: 2 }}
                                />
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Intelligence Breakdown */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
                    {/* Industry Trends */}
                    <motion.div variants={item} className="content-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                            <div style={{ fontWeight: 800, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Briefcase size={18} color="var(--text-muted)" /> Industry Dominance
                            </div>
                            <PieChart size={18} color="var(--text-muted)" />
                        </div>
                        <div style={{ padding: '0.5rem' }}>
                            {(data?.topIndustries || []).map((ind, i) => (
                                <BarGroup
                                    key={ind.name}
                                    name={ind.name}
                                    count={ind.count}
                                    total={maxCount}
                                    color={i === 0 ? 'var(--accent)' : i === 1 ? '#3b82f6' : '#64748b'}
                                />
                            ))}
                        </div>
                    </motion.div>

                    {/* Network Activity */}
                    <motion.div variants={item} className="content-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <div style={{ fontWeight: 800, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Globe size={18} color="var(--text-muted)" /> Global Intelligence Map
                            </div>
                            <Map size={18} color="var(--text-muted)" />
                        </div>

                        <MarketMap />

                        <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            {(data?.regions || []).map(r => (
                                <div key={r.name} style={{ background: 'var(--bg-subtle)', padding: '0.75rem', borderRadius: 12, border: '1px solid var(--border)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: r.color }} />
                                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{r.name.toUpperCase()}</span>
                                    </div>
                                    <div style={{ fontSize: '1.125rem', fontWeight: 900 }}>{r.value}%</div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* AI Insight Bar */}
                <motion.div
                    variants={item}
                    style={{
                        marginTop: '3rem', padding: '2rem',
                        background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)', borderRadius: 24,
                        color: 'white', display: 'flex', alignItems: 'center', gap: '2rem',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                        border: '1px solid #374151'
                    }}>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(59, 130, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(59, 130, 246, 0.5)' }}>
                        <Zap size={32} color="#60a5fa" fill="#60a5fa" />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 900, letterSpacing: '0.15em', color: '#9ca3af', marginBottom: 8 }}>GROQ INTELLIGENCE SUMMARY</div>
                        <div style={{ fontSize: '1.125rem', fontWeight: 600, color: '#f3f4f6', lineHeight: 1.6 }}>"Your conversion topography in the <strong style={{ color: '#60a5fa' }}>{data?.topIndustries?.[0]?.name || 'current'}</strong> sector shows a 15% positive delta vs the network baseline. Re-allocating bandwidth to verifiable actors in <strong style={{ color: '#60a5fa' }}>Europe</strong> will optimize the outcome."</div>
                    </div>
                    <button className="btn-primary btn-glow" style={{ background: 'var(--accent)', color: 'white', border: 'none', fontWeight: 800, width: 'auto', padding: '1rem 2rem', borderRadius: 14 }} onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'matches' }))}>
                        Deploy Hunter <ArrowUpRight size={18} />
                    </button>
                </motion.div>
            </motion.div>
        </div>
    )
}
