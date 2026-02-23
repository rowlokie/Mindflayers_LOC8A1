import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Target, Star, MapPin, Award, ArrowRight, TrendingUp, Info, Users, CheckCircle2, ShieldCheck, Sparkles, Building2, ExternalLink, X, Activity } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

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

function MatchCard({ m, onViewDetails }) {
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><MapPin size={12} /> {p.country || 'Global'}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Award size={12} /> {p.industry}</div>
                    </div>
                    <button onClick={() => onViewDetails(m)} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                        View Full Report <ExternalLink size={12} />
                    </button>
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
    const [selectedMatch, setSelectedMatch] = useState(null)
    const [aiReport, setAiReport] = useState(null)

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

    const openModal = async (m) => {
        setSelectedMatch(m)
        setAiReport("Generating deep insight report via Groq...\n(This usually takes 2-4 seconds)")
        try {
            const res = await api('/api/ai/profile-analysis', {
                method: 'POST',
                body: JSON.stringify({
                    targetData: m.user.tradeProfile || { industry: m.user.tradeProfile?.industry, country: m.user.tradeProfile?.country, role: m.user.role, name: m.user.name },
                    breakdown: m.breakdown,
                    score: m.score
                })
            });
            setAiReport(res.analysis || "Report generation failed.");
        } catch (e) {
            setAiReport("Network error while generating report.");
        }
    }

    useEffect(() => { load() }, [load])

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: '5rem' }}>
            <div className="page-header" style={{ marginBottom: '3rem', borderBottom: '1px solid var(--border)', paddingBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        <div style={{
                            width: 60, height: 60, borderRadius: 16,
                            background: 'var(--accent-gradient)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                            boxShadow: '0 8px 25px rgba(37, 99, 235, 0.35)'
                        }}>
                            <Target size={28} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h1 className="page-title" style={{ fontSize: '2.5rem', letterSpacing: '-0.03em', marginBottom: '0.25rem' }}>Market Hunter</h1>
                            <p className="page-subtitle" style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>AI-Powered Precision Matches synthesized from global telemetry and grid records.</p>
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
                    <div style={{ padding: '10rem 0', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ position: 'relative', width: 80, height: 80, marginBottom: '2rem' }}>
                            <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.8, 0.3] }} transition={{ repeat: Infinity, duration: 2 }} style={{ position: 'absolute', inset: 0, border: '2px solid var(--accent)', borderRadius: '50%' }} />
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 3, ease: 'linear' }} style={{ position: 'absolute', inset: 10, border: '2px dashed var(--accent)', borderRadius: '50%', opacity: 0.5 }} />
                            <Target size={30} color="var(--accent)" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
                        </div>
                        <h3 style={{ fontWeight: 900, fontSize: '1.5rem', marginBottom: '0.5rem', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>Cross-Referencing Global Grid</h3>
                        <p style={{ color: 'var(--text-muted)', maxWidth: 400, margin: '0 auto', fontSize: '0.9rem', fontFamily: 'monospace' }}>Processing 5,000+ entities via TradeCupid Engine...</p>
                    </div>
                ) : recs.length === 0 ? (
                    <div className="empty-state card-glass" style={{ padding: '8rem 2rem', border: '1px solid var(--border)', borderRadius: 24 }}>
                        <Info size={40} color="var(--accent)" style={{ opacity: 0.4, margin: '0 auto 1.5rem' }} />
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>No Viable Targets Assigned.</h3>
                        <p style={{ color: 'var(--text-muted)', maxWidth: 400, margin: '0 auto 2.5rem', fontSize: '0.95rem', lineHeight: 1.6 }}>The intelligence engine could not isolate high-synergy matches for your current operational parameters. Expand your profile scope to widen the net.</p>
                        <button className="btn-primary" style={{ background: 'var(--bg-glass)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>Access Settings</button>
                    </div>
                ) : (
                    <motion.div
                        variants={container}
                        initial="hidden"
                        animate="show"
                        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '2rem' }}>
                        {recs.map((m, idx) => (
                            <MatchCard key={m.user.id || idx} m={m} onViewDetails={openModal} />
                        ))}
                    </motion.div>
                )}

                {/* Match Details Modal */}
                <AnimatePresence>
                    {selectedMatch && (
                        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setSelectedMatch(null)}>
                            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                onClick={e => e.stopPropagation()}
                                style={{ background: 'var(--bg-white)', borderRadius: 24, width: '100%', maxWidth: 720, maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--border)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
                                {/* Modal Header */}
                                <div style={{ padding: '2rem', borderBottom: '1px solid var(--border)', position: 'relative' }}>
                                    <button onClick={() => setSelectedMatch(null)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'var(--bg-subtle)', border: 'none', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                        <X size={16} />
                                    </button>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                                        <div style={{ width: 64, height: 64, borderRadius: 16, background: selectedMatch.source === 'Dataset' ? 'linear-gradient(135deg, #7c3aed, #a855f7)' : 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: 'white', fontSize: '1.5rem' }}>
                                            {(selectedMatch.user.name || '?')[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '0.25rem', color: 'var(--text-primary)' }}>{selectedMatch.user.tradeProfile?.companyName || selectedMatch.user.name}</h2>
                                            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={14} />{selectedMatch.user.tradeProfile?.country || 'Global'}</span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Award size={14} />{selectedMatch.user.tradeProfile?.industry || 'General'}</span>
                                            </div>
                                        </div>
                                        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                                            <div style={{ fontSize: '2rem', fontWeight: 900, color: selectedMatch.score >= 80 ? '#10b981' : selectedMatch.score >= 60 ? '#3b82f6' : '#f59e0b', lineHeight: 1 }}>{selectedMatch.score}%</div>
                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 800 }}>Overall Match</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Modal Body */}
                                <div style={{ padding: '2rem' }}>
                                    <div style={{ background: 'var(--accent-light)', borderRadius: 12, padding: '1.25rem', border: '1px solid var(--border)', marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-white)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8 }}>
                                            <Sparkles size={20} color="var(--accent)" />
                                        </div>
                                        <div style={{ flex: 1, fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.6, fontStyle: 'italic', fontWeight: 500 }}>
                                            "{selectedMatch.aiReason}"
                                        </div>
                                    </div>

                                    <h3 style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <Activity size={18} color="var(--accent)" /> AI Multidimensional Analysis
                                    </h3>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '2rem' }}>
                                        {Object.entries(selectedMatch.breakdown || {}).map(([key, val]) => (
                                            <div key={key}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                                                    <span>{key.replace('_', ' ')}</span>
                                                    <span style={{ color: val >= 80 ? '#10b981' : val >= 50 ? '#3b82f6' : '#f59e0b' }}>{val}/100</span>
                                                </div>
                                                <div style={{ height: 6, background: 'var(--bg-subtle)', borderRadius: 3, overflow: 'hidden' }}>
                                                    <motion.div initial={{ width: 0 }} animate={{ width: `${val}%` }} transition={{ duration: 1 }} style={{ height: '100%', background: val >= 80 ? '#10b981' : val >= 50 ? '#3b82f6' : '#f59e0b', borderRadius: 3 }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div style={{ background: 'var(--bg-subtle)', borderRadius: 16, padding: '1.5rem', border: '1px solid var(--border)', marginBottom: '2rem' }}>
                                        <h3 style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <ShieldCheck size={18} color="var(--accent)" /> Detailed AI Due Diligence (Groq Engine)
                                        </h3>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.7 }} className="prose">
                                            {aiReport ? (
                                                <ReactMarkdown>{aiReport}</ReactMarkdown>
                                            ) : (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                                                    Waiting for AI...
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                                        <div style={{ background: 'var(--bg-subtle)', padding: '1rem', borderRadius: 12 }}>
                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Operating Budget</div>
                                            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{selectedMatch.user.tradeProfile?.budgetMax ? `$${(selectedMatch.user.tradeProfile.budgetMax / 1000000).toFixed(1)}M+` : 'Standard'}</div>
                                        </div>
                                        <div style={{ background: 'var(--bg-subtle)', padding: '1rem', borderRadius: 12 }}>
                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Volume Scale</div>
                                            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{selectedMatch.user.tradeProfile?.capacity || selectedMatch.user.tradeProfile?.quantityRequired || 'Mid-size'} Tons</div>
                                        </div>
                                        <div style={{ background: 'var(--bg-subtle)', padding: '1rem', borderRadius: 12 }}>
                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Verified Flags</div>
                                            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#10b981' }}>{selectedMatch.source === 'Dataset' ? 'Firmographic' : 'KYC KYC'}</div>
                                        </div>
                                    </div>

                                    <button className="btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1rem' }} onClick={() => setSelectedMatch(null)}>
                                        Close Master Report
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
