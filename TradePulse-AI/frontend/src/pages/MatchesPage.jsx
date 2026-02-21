import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Target, Star, MapPin, Award, ArrowRight, TrendingUp, Info, Users, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react'

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
    hidden: { opacity: 0, scale: 0.95, y: 15 },
    show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', damping: 20, stiffness: 100 } }
}

function MatchCard({ m }) {
    const p = m.user.tradeProfile || {}
    const [connecting, setConnecting] = useState(false)
    const [done, setDone] = useState(false)

    const handleConnect = async () => {
        setConnecting(true)
        try {
            const res = await api('/api/swipe', { method: 'POST', body: JSON.stringify({ targetId: m.user._id, action: 'like' }) })
            if (res.connected) setDone(true)
        } finally {
            setConnecting(false)
        }
    }

    return (
        <motion.div variants={item} className="content-card card-glass" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{
                            width: 56, height: 56, borderRadius: 16, background: 'var(--accent-gradient)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: 'white', fontSize: '1.25rem',
                            boxShadow: '0 8px 16px rgba(37, 99, 235, 0.2)'
                        }}>
                            {(m.user.name || '?')[0].toUpperCase()}
                        </div>
                        <div>
                            <div style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>{p.companyName || m.user.name}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                                <span className="badge-role" style={{ fontSize: '0.65rem', padding: '1px 8px' }}>{m.user.role}</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.industry}</span>
                            </div>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: m.score >= 80 ? '#10b981' : '#3b82f6', lineHeight: 1 }}>{m.score}%</div>
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>Synergy</div>
                    </div>
                </div>

                <div style={{
                    background: 'var(--accent-light)', borderRadius: 12, padding: '1rem',
                    border: '1px solid var(--border)', marginBottom: '1.5rem', position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{ position: 'absolute', top: 0, right: 0, padding: '0.2rem 0.6rem', background: 'var(--accent)', color: 'white', borderBottomLeftRadius: 10, fontSize: '0.6rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Sparkles size={10} /> AI INSIGHT
                    </div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.6, margin: 0, fontStyle: 'italic', fontWeight: 500 }}>
                        "{m.aiReason}"
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                        <div style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <MapPin size={12} />
                        </div>
                        {p.country}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                        <div style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Award size={12} />
                        </div>
                        {(p.certifications || []).length || 2} Certs
                    </div>
                </div>
            </div>

            {done ? (
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} style={{ padding: '0.875rem', background: '#ecfdf5', color: '#059669', borderRadius: 12, textAlign: 'center', fontSize: '0.9375rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, border: '1px solid #10b981' }}>
                    <ShieldCheck size={20} /> Connection Established
                </motion.div>
            ) : (
                <button
                    onClick={handleConnect}
                    disabled={connecting}
                    className="btn-primary btn-glow"
                    style={{ width: '100%', py: '0.875rem' }}
                >
                    {connecting ? 'Scanning Flows...' : <>Establish Trade Link <ArrowRight size={16} /></>}
                </button>
            )}
        </motion.div>
    )
}

export default function MatchesPage({ backendUser }) {
    const [recs, setRecs] = useState([])
    const [loading, setLoading] = useState(true)

    const load = useCallback(async () => {
        setLoading(true)
        const res = await api('/api/ai/recommendations', { method: 'POST' })
        setRecs(res.recommendations || [])
        setLoading(false)
    }, [])

    useEffect(() => { load() }, [load])

    return (
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <motion.div
                        initial={{ rotate: -15, scale: 0.8 }}
                        animate={{ rotate: 0, scale: 1 }}
                        style={{
                            width: 52, height: 52, borderRadius: 14,
                            background: 'var(--accent-gradient)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                            boxShadow: '0 8px 24px rgba(37, 99, 235, 0.3)'
                        }}>
                        <Target size={28} strokeWidth={2.5} />
                    </motion.div>
                    <div>
                        <h1 className="page-title">Market Hunter</h1>
                        <p className="page-subtitle">Precision global trade leads identified by TradePulse AI</p>
                    </div>
                </div>
            </div>

            <div className="page-body">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                    {[
                        { label: 'Market Opportunity', value: 'Prime', icon: TrendingUp, color: '#10b981', sub: 'High synergy detected' },
                        { label: 'Global Network', value: 'Verified', icon: Users, color: '#3b82f6', sub: 'Fraud-proof partners' },
                        { label: 'AI Accuracy', value: '98.4%', icon: Zap, color: '#f59e0b', sub: 'Model: 1.5 Flash' },
                    ].map(s => (
                        <div key={s.label} className="stat-card" style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ width: 44, height: 44, borderRadius: 12, background: s.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <s.icon size={22} color={s.color} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 800 }}>{s.label}</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)' }}>{s.value}</div>
                                </div>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Sparkles size={10} color={s.color} /> {s.sub}
                            </div>
                        </div>
                    ))}
                </motion.div>

                {loading ? (
                    <div style={{ padding: '8rem 0', textAlign: 'center' }}>
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                            style={{ width: 48, height: 48, border: '4px solid var(--accent-light)', borderTopColor: 'var(--accent)', borderRadius: '50%', margin: '0 auto 2rem' }}
                        />
                        <h3 style={{ fontWeight: 800, fontSize: '1.5rem', marginBottom: '0.5rem' }}>AI is Syncing Global Flows...</h3>
                        <p style={{ color: 'var(--text-muted)', maxWidth: 400, margin: '0 auto' }}>Scanning our multi-source network for high-synergy partners matching your exact trade profile.</p>
                    </div>
                ) : recs.length === 0 ? (
                    <div className="empty-state" style={{ padding: '5rem 2rem' }}>
                        <Target size={64} strokeWidth={1} style={{ marginBottom: '1.5rem', opacity: 0.2, color: 'var(--accent)' }} />
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>No Matches Detected Yet</h3>
                        <p style={{ color: 'var(--text-muted)', maxWidth: 400, margin: '0 auto 2rem' }}>Maximize your profile completeness and verify your documents to trigger our AI matching engine.</p>
                        <button className="btn-primary" style={{ width: 'auto' }}>Complete Trade Profile</button>
                    </div>
                ) : (
                    <motion.div
                        variants={container}
                        initial="hidden"
                        animate="show"
                        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.75rem' }}>
                        {recs.map((m) => (
                            <MatchCard key={m.user._id} m={m} />
                        ))}
                    </motion.div>
                )}

                {/* Pro Tip */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    style={{ marginTop: '4rem', padding: '2rem', background: 'var(--bg-white)', borderRadius: 24, border: '1px solid var(--border)', display: 'flex', gap: '1.5rem', alignItems: 'center', boxShadow: 'var(--shadow-lg)' }}>
                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Zap size={28} color="#f59e0b" fill="#f59e0b" />
                    </div>
                    <div>
                        <h4 style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '0.375rem' }}>Pro Tip: Boost Your Visibility</h4>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                            Exporters with <strong>certified trade documents</strong> and <strong>high-quality product images</strong> are 14x more likely to be prioritized by our AI matching algorithm.
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
