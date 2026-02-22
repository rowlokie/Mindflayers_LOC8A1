import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Target, Star, MapPin, Award, ArrowRight, TrendingUp, Info, Users, CheckCircle2, ShieldCheck, Sparkles, Building2, ExternalLink } from 'lucide-react'

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
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const item = {
    hidden: { opacity: 0, scale: 0.95, y: 15 },
    show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', damping: 20, stiffness: 100 } }
}

function MatchCard({ m }) {
    const p = m.user.tradeProfile || {}
    const [connecting, setConnecting] = useState(false)
    const [done, setDone] = useState(false)

    // Dataset leads can't be "swiped" in the traditional sense, we "Save" them
    const isDataset = m.source === 'Dataset'

    const handleConnect = async () => {
        if (isDataset) {
            setDone(true) // Just a mock "Save" for dataset leads
            return
        }
        setConnecting(true)
        try {
            const res = await api('/api/swipe', { method: 'POST', body: JSON.stringify({ targetId: m.user.id, action: 'like' }) })
            if (res.connected) setDone(true)
        } finally {
            setConnecting(false)
        }
    }

    return (
        <motion.div variants={item} className="content-card card-glass" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1 }}>
                {/* Header: Score + Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{
                            width: 56, height: 56, borderRadius: 16,
                            background: isDataset ? 'linear-gradient(135deg, #7c3aed, #a855f7)' : 'var(--accent-gradient)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: 'white', fontSize: '1.25rem',
                            boxShadow: '0 8px 16px rgba(124, 58, 237, 0.2)'
                        }}>
                            {(m.user.name || '?')[0].toUpperCase()}
                        </div>
                        <div>
                            <div style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                                {p.companyName || m.user.name}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                <span className="badge-role" style={{ fontSize: '0.65rem', padding: '1px 8px' }}>{m.user.role}</span>
                                <span style={{ fontSize: '0.6rem', padding: '1px 7px', borderRadius: 99, background: isDataset ? '#faf5ff' : '#ecfdf5', color: isDataset ? '#7c3aed' : '#059669', border: `1px solid ${isDataset ? '#ddd6fe' : '#a7f3d0'}`, fontWeight: 700 }}>
                                    {isDataset ? '📊 Dataset Lead' : '✅ Platform User'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: m.score >= 80 ? '#10b981' : m.score >= 60 ? '#3b82f6' : '#f59e0b', lineHeight: 1 }}>{m.score}%</div>
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>Synergy</div>
                    </div>
                </div>

                {/* AI Reasoning (TradeCupid) */}
                <div style={{
                    background: 'var(--accent-light)', borderRadius: 12, padding: '0.875rem',
                    border: '1px solid var(--border)', marginBottom: '1.25rem', position: 'relative', overflow: 'hidden'
                }}>
                    <div style={{ position: 'absolute', top: 0, right: 0, padding: '0.2rem 0.6rem', background: isDataset ? '#7c3aed' : 'var(--accent)', color: 'white', borderBottomLeftRadius: 10, fontSize: '0.6rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Sparkles size={10} /> TradeCupid
                    </div>
                    <p style={{ fontSize: '0.825rem', color: 'var(--text-primary)', lineHeight: 1.6, margin: 0, fontStyle: 'italic', fontWeight: 500 }}>
                        "{m.aiReason}"
                    </p>
                </div>

                {/* Breakdown Bars (Micro-interactions) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1.25rem' }}>
                    {Object.entries(m.breakdown || {}).slice(0, 4).map(([key, val]) => (
                        <div key={key} style={{ background: 'var(--bg-subtle)', padding: '0.4rem 0.6rem', borderRadius: 10, border: '1px solid var(--border)' }}>
                            <div style={{ fontSize: '0.55rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800, marginBottom: '0.1rem' }}>{key.replace('_', ' ')}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <div style={{ flex: 1, height: 4, background: 'var(--border)', borderRadius: 2 }}>
                                    <div style={{ height: '100%', width: `${val}%`, background: val > 80 ? '#10b981' : 'var(--accent)', borderRadius: 2 }} />
                                </div>
                                <span style={{ fontSize: '0.65rem', fontWeight: 700 }}>{val}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer Details */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><MapPin size={12} /> {p.country || 'Global'}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Award size={12} /> {p.industry}</div>
                </div>
            </div>

            {done ? (
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} style={{ padding: '0.875rem', background: '#ecfdf5', color: '#059669', borderRadius: 12, textAlign: 'center', fontSize: '0.9375rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, border: '1px solid #10b981' }}>
                    <ShieldCheck size={20} /> {isDataset ? 'Lead Saved' : 'Request Sent'}
                </motion.div>
            ) : (
                <button onClick={handleConnect} disabled={connecting} className="btn-primary btn-glow" style={{ width: '100%' }}>
                    {connecting ? 'Processing...' : isDataset ? <><Building2 size={16} /> Save Dataset Lead</> : <>Establish Trade Link <ArrowRight size={16} /></>}
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
        try {
            const res = await api('/api/ai/recommendations', { method: 'POST' })
            setRecs(res.recommendations || [])
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { load() }, [load])

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: '5rem' }}>
            <div className="page-header" style={{ marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        <div style={{
                            width: 60, height: 60, borderRadius: 18,
                            background: 'var(--accent-gradient)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                            boxShadow: '0 10px 30px rgba(37, 99, 235, 0.3)'
                        }}>
                            <Target size={32} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h1 className="page-title" style={{ fontSize: '2.25rem', marginBottom: '0.25rem' }}>Market Hunter</h1>
                            <p className="page-subtitle" style={{ fontSize: '1rem' }}>AI-Powered Precision Matches from Hackathon Dataset & Platform Users</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="page-body">
                {/* Stats Dashboard */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                    {[
                        { label: 'Dataset Reach', value: '5,000+ Records', icon: Users, color: '#7c3aed', sub: 'Cross-analyzed in real-time' },
                        { label: 'Scoring Engine', value: 'TradeCupid 10D', icon: Zap, color: '#10b981', sub: 'Huber-loss weighted hybrid' },
                        { label: 'Confidence', value: 'High', icon: Star, color: '#f59e0b', sub: 'Based on firmographic data' },
                    ].map(s => (
                        <div key={s.label} className="stat-card card-glass" style={{ padding: '1.5rem', border: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ width: 48, height: 48, borderRadius: 14, background: s.color + '10', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <s.icon size={24} color={s.color} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 800 }}>{s.label}</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)' }}>{s.value}</div>
                                    <div style={{ fontSize: '0.8rem', color: s.color, fontWeight: 600, marginTop: '0.1rem' }}>{s.sub}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {loading ? (
                    <div style={{ padding: '10rem 0', textAlign: 'center' }}>
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                            style={{ width: 64, height: 64, border: '5px solid var(--accent-light)', borderTopColor: 'var(--accent)', borderRadius: '50%', margin: '0 auto 2.5rem' }}
                        />
                        <h3 className="gradient-text" style={{ fontWeight: 900, fontSize: '2rem', marginBottom: '1rem' }}>TradeCupid is Matching...</h3>
                        <p style={{ color: 'var(--text-muted)', maxWidth: 500, margin: '0 auto', fontSize: '1.1rem' }}>Analyzing 5,000+ global exporters and importers using our 10-dimension hybrid scoring engine.</p>
                    </div>
                ) : recs.length === 0 ? (
                    <div className="empty-state card-glass" style={{ padding: '6rem 2rem' }}>
                        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
                            <Info size={40} color="var(--text-muted)" />
                        </div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.75rem' }}>No Matches Found</h3>
                        <p style={{ color: 'var(--text-muted)', maxWidth: 450, margin: '0 auto 2.5rem' }}>We couldn't find any direct matches for your industry. Try updating your Trade Profile with more details.</p>
                        <button className="btn-primary" style={{ width: 'auto', padding: '0.75rem 2.5rem' }}>Update Profile</button>
                    </div>
                ) : (
                    <motion.div
                        variants={container}
                        initial="hidden"
                        animate="show"
                        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '2rem' }}>
                        {recs.map((m, idx) => (
                            <MatchCard key={m.user.id || idx} m={m} />
                        ))}
                    </motion.div>
                )}
            </div>
        </div>
    )
}
