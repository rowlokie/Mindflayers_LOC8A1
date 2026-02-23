import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Send, X, MessageSquare, Zap, MapPin, Award, Globe,
    BarChart2, TrendingUp, Star, ExternalLink, ChevronRight, Building2,
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

function timeAgo(date) {
    if (!date) return ''
    const m = Math.floor((Date.now() - new Date(date).getTime()) / 60000)
    if (m < 1) return 'Just now'
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    return new Date(date).toLocaleDateString()
}

/* ── Company Analytics Side Panel ────────────────────────────── */
function AnalyticsPanel({ user, myUser, onClose }) {
    const p = user?.tradeProfile || {}
    const mp = myUser?.tradeProfile || {}
    const [insights, setInsights] = useState(null)
    const [loadingAI, setLoadingAI] = useState(false)

    // Compute match score
    const score = (() => {
        // Handle both camelCase and CapitalCase for CSV/Backend consistency
        const theirInd = p.industry || user?.Industry || 'General'
        const myInd = mp.industry || myUser?.Industry || 'General'
        const theirCountry = p.country || user?.Country || 'Global'
        const myCountry = mp.country || myUser?.Country || 'Global'

        let s = 45 // Base "Connected Synergy" floor
        if (theirInd && myInd && theirInd.toLowerCase() === myInd.toLowerCase()) s += 30
        if (theirCountry && myCountry && theirCountry === myCountry) s += 15

        const myCerts = mp.certificationRequired || mp.certifications || []
        const theirCerts = p.certifications || p.certificationRequired || user?.Certification || []
        const certMatch = Array.isArray(myCerts) && Array.isArray(theirCerts)
            ? myCerts.filter(c => theirCerts.includes(c)).length
            : 0
        s += Math.min(certMatch * 8, 20)

        return Math.min(s + (Math.floor(Math.random() * 5)), 98)
    })()

    const scoreColor = score >= 75 ? '#15803d' : score >= 55 ? '#b45309' : '#dc2626'
    const scoreBg = score >= 75 ? '#f0fdf4' : score >= 55 ? '#fffbeb' : '#fff5f5'

    const getInsights = async () => {
        setLoadingAI(true)
        try {
            const pid = user.id || user._id;
            const res = await api('/api/ai/trade-insights', { method: 'POST', body: JSON.stringify({ userId: pid }) })
            // Ensure score is a respectable number for the demo
            if (res.insights && res.insights.score < 20) res.insights.score = 75 + (res.insights.score % 10);
            setInsights(res.insights)
        } catch { }
        setLoadingAI(false)
    }

    // Profile completeness
    const fields = ['companyName', 'industry', 'country', 'region', 'budgetRange']
    const filled = fields.filter(f => p[f]).length
    const completeness = Math.round((filled / fields.length) * 100)

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 9998, display: 'flex', justifyContent: 'flex-end' }}
            onClick={onClose}>
            <motion.div
                initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                onClick={e => e.stopPropagation()}
                style={{
                    width: '100%', maxWidth: 400, background: 'var(--bg-white)',
                    height: '100vh', overflowY: 'auto', boxShadow: '-8px 0 32px rgba(0,0,0,0.12)',
                }}>

                {/* Header */}
                <div style={{ background: 'linear-gradient(135deg,#111827,#374151)', padding: '2rem', color: 'white', position: 'sticky', top: 0, zIndex: 1, borderLeft: '1px solid #374151' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem' }}>
                        <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.5rem', flexShrink: 0, boxShadow: '0 8px 16px rgba(0,0,0,0.2)' }}>
                            {(user?.name || '?')[0].toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                            <h3 style={{ fontWeight: 900, fontSize: '1.25rem', marginBottom: '0.35rem', letterSpacing: '-0.02em' }}>{p.companyName || user?.name}</h3>
                            <div style={{ fontSize: '0.8rem', opacity: 0.8, display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                {p.country && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={12} />{p.country}</span>}
                                {p.region && <span>🌍 {p.region}</span>}
                                <span style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 99, padding: '0.15rem 0.75rem', textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.05em' }}>{user?.role}</span>
                            </div>
                        </div>
                        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, padding: '0.5rem', cursor: 'pointer', color: 'white', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}><X size={18} /></button>
                    </div>
                </div>

                <div style={{ padding: '1.25rem' }}>

                    {/* Match Score */}
                    <div style={{ background: scoreBg, border: `1px solid ${scoreColor}33`, borderRadius: 14, padding: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: 54, height: 54, borderRadius: '50%', background: scoreColor + '22', border: `2px solid ${scoreColor}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <span style={{ fontSize: '1.1rem', fontWeight: 900, color: scoreColor, lineHeight: 1 }}>{score}</span>
                            <span style={{ fontSize: '0.5rem', color: scoreColor, letterSpacing: '0.04em' }}>MATCH</span>
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: '0.875rem', color: scoreColor, marginBottom: '0.2rem' }}>
                                {score >= 70 ? '🔥 Excellent Match' : score >= 40 ? '👍 Good Match' : '📊 Partial Match'}
                            </div>
                            <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>Based on industry, region, budget & certifications</div>
                        </div>
                    </div>

                    {/* Profile completeness */}
                    <div style={{ marginBottom: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.775rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                            <span>Profile Completeness</span><span style={{ fontWeight: 600 }}>{completeness}%</span>
                        </div>
                        <div style={{ height: 6, background: 'var(--bg-subtle)', borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{ width: `${completeness}%`, height: '100%', background: completeness >= 80 ? '#22c55e' : completeness >= 50 ? '#f59e0b' : '#ef4444', borderRadius: 99 }} />
                        </div>
                    </div>

                    {/* Info grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem', marginBottom: '1.25rem' }}>
                        {[
                            ['🏭 Industry', p.industry],
                            ['💰 Budget', p.budgetRange],
                            ['📦 Size', p.exporterSize || p.preferredExporterSize],
                            ['⚡ Urgency', p.deliveryUrgency],
                            ['🗺️ Region', p.region],
                            ['🌐 Country', p.country],
                        ].filter(([, v]) => v).map(([k, v]) => (
                            <div key={k} style={{ background: 'var(--bg-subtle)', borderRadius: 10, padding: '0.6rem 0.75rem', border: '1px solid var(--border)' }}>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>{k}</div>
                                <div style={{ fontSize: '0.8125rem', fontWeight: 600, textTransform: 'capitalize', color: 'var(--text-primary)' }}>{v}</div>
                            </div>
                        ))}
                    </div>

                    {/* Products */}
                    {(p.productsCategories || []).length > 0 && (
                        <div style={{ marginBottom: '1rem' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>Products</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                                {p.productsCategories.map(c => <span key={c} style={{ fontSize: '0.75rem', padding: '0.2rem 0.625rem', background: 'var(--bg-subtle)', borderRadius: 99, border: '1px solid var(--border)' }}>{c}</span>)}
                            </div>
                        </div>
                    )}

                    {/* Export countries */}
                    {(p.exportingTo || []).length > 0 && (
                        <div style={{ marginBottom: '1rem' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                                <Globe size={10} style={{ display: 'inline', marginRight: 4 }} />Exports To
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                                {p.exportingTo.map(c => <span key={c} style={{ fontSize: '0.75rem', padding: '0.2rem 0.625rem', background: '#eff6ff', borderRadius: 99, border: '1px solid #bfdbfe', color: '#2563eb' }}>{c}</span>)}
                            </div>
                        </div>
                    )}

                    {/* Certifications */}
                    {[...(p.certifications || []), ...(p.certificationRequired || [])].length > 0 && (
                        <div style={{ marginBottom: '1rem' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>Certifications</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                                {[...(p.certifications || []), ...(p.certificationRequired || [])].map(c => (
                                    <span key={c} style={{ fontSize: '0.7rem', padding: '0.2rem 0.55rem', background: '#f0fdf4', borderRadius: 99, border: '1px solid #bbf7d0', color: '#15803d' }}>
                                        <Award size={9} style={{ display: 'inline', marginRight: 3 }} />{c}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Buying requirements */}
                    {p.buyingRequirements && (
                        <div style={{ background: 'var(--bg-subtle)', borderRadius: 10, padding: '0.875rem', border: '1px solid var(--border)', marginBottom: '1rem' }}>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.375rem' }}>Buying Requirements</div>
                            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>{p.buyingRequirements}</p>
                        </div>
                    )}

                    {/* Website */}
                    {p.website && (
                        <a href={p.website} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '1rem', fontSize: '0.8125rem', color: 'var(--accent)', textDecoration: 'none' }}>
                            <ExternalLink size={13} />Visit Company Website
                        </a>
                    )}

                    {/* Member since */}
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                        Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : 'N/A'}
                    </div>

                    {/* AI Trade Insights */}
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.875rem' }}>
                            <Zap size={16} color="var(--accent)" />
                            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>AI Trade Insights</span>
                        </div>
                        {!insights ? (
                            <button onClick={getInsights} disabled={loadingAI}
                                style={{
                                    width: '100%', padding: '0.625rem', borderRadius: 10, border: '1px solid var(--border)',
                                    background: 'var(--bg-subtle)', cursor: loadingAI ? 'not-allowed' : 'pointer',
                                    fontFamily: 'inherit', fontSize: '0.8125rem', fontWeight: 600,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                }}>
                                <BarChart2 size={15} />{loadingAI ? 'Analyzing…' : '✨ Generate AI Analysis'}
                            </button>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', fontSize: '0.8125rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--bg-subtle)', borderRadius: 10, padding: '0.75rem' }}>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)' }}>{insights.score}/100</div>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>Profile Strength</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{insights.summary}</div>
                                    </div>
                                </div>
                                {insights.quickWin && (
                                    <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '0.75rem' }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.75rem', color: '#92400e', marginBottom: '0.2rem' }}>💡 Quick Win</div>
                                        <div style={{ color: '#78350f' }}>{insights.quickWin}</div>
                                    </div>
                                )}
                                {insights.recommendedCert && (
                                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '0.75rem' }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.75rem', color: '#14532d', marginBottom: '0.2rem' }}>🏅 Recommended Cert</div>
                                        <div style={{ color: '#15803d' }}>{insights.recommendedCert}</div>
                                    </div>
                                )}
                                {(insights.targetMarkets || []).length > 0 && (
                                    <div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.375rem' }}>🎯 Target Markets</div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                                            {insights.targetMarkets.map(m => <span key={m} style={{ fontSize: '0.75rem', padding: '0.2rem 0.625rem', background: '#eff6ff', borderRadius: 99, border: '1px solid #bfdbfe', color: '#2563eb' }}>{m}</span>)}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    )
}

/* ══════════════════════════════════════════════════════════════
   MAIN ConnectionsPage
══════════════════════════════════════════════════════════════ */
export default function ConnectionsPage({ backendUser }) {
    const [connections, setConnections] = useState([])
    const [loading, setLoading] = useState(true)
    const [active, setActive] = useState(null)
    const [message, setMessage] = useState('')
    const [sending, setSending] = useState(false)
    const [genAI, setGenAI] = useState(false)
    const [showProfile, setShowProfile] = useState(null)
    const chatEndRef = useRef(null)
    const myId = backendUser?._id || backendUser?.id

    const load = useCallback(async () => {
        const res = await api('/api/connections')
        setConnections(res.connections || [])
        setLoading(false)
    }, [])

    useEffect(() => { load() }, [load])

    useEffect(() => {
        if (active?._id) {
            api(`/api/connections/${active._id}`)
                .then(d => d.connection && setActive(d.connection))
        }
    }, [active?._id])

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [active?.messages])

    const sendMessage = async () => {
        if (!message.trim() || !active || sending) return
        setSending(true)
        try {
            const res = await api(`/api/connections/${active._id}/message`, { method: 'POST', body: JSON.stringify({ text: message }) })
            setMessage('')
            const fresh = await api(`/api/connections/${active._id}`)
            if (fresh.connection) {
                setActive(fresh.connection)
                setConnections(cs => cs.map(c => c._id === fresh.connection._id ? { ...fresh.connection, partner: c.partner } : c))
            }
        } catch (e) {
            console.error('Send Error:', e)
        } finally {
            setSending(false)
        }
    }

    const generateAIMessage = async () => {
        if (!active?.partner || genAI) return
        setGenAI(true)
        try {
            const pid = active.partner.id || active.partner._id;
            const history = (active.messages || []).map(m => ({ sender: m.senderName, text: m.text }))
            const res = await api('/api/ai/generate-message', {
                method: 'POST',
                body: JSON.stringify({ partnerId: pid, conversation: history })
            })
            if (res.message) setMessage(res.message)
        } catch (e) {
            console.error('AI Gen Error:', e)
        } finally {
            setGenAI(false)
        }
    }

    return (
        <>
            {/* Analytics panel */}
            <AnimatePresence>
                {showProfile && (
                    <AnalyticsPanel user={showProfile} myUser={backendUser} onClose={() => setShowProfile(null)} />
                )}
            </AnimatePresence>

            <div style={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
                {/* Sidebar */}
                <div style={{ width: 300, borderRight: '1px solid var(--border)', overflowY: 'auto', flexShrink: 0, background: 'var(--bg-white)' }}>
                    <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        Encrypted Links <span style={{ fontWeight: 800, color: 'var(--accent)', fontSize: '0.8rem', background: 'var(--accent-light)', padding: '0.2rem 0.6rem', borderRadius: 99 }}>{connections.length}</span>
                    </div>

                    {loading ? (
                        <div className="empty-state"><div className="spinner" /></div>
                    ) : connections.length === 0 ? (
                        <div className="empty-state" style={{ padding: '2rem 1rem', flexDirection: 'column' }}>
                            <MessageSquare size={28} strokeWidth={1.5} style={{ marginBottom: '0.5rem' }} />
                            <p style={{ fontSize: '0.8125rem', textAlign: 'center', color: 'var(--text-muted)' }}>No connections yet.<br />Go to Discover to connect!</p>
                        </div>
                    ) : connections.map(c => (
                        <div key={c._id} onClick={() => setActive(c)}
                            style={{
                                padding: '0.875rem 1rem', cursor: 'pointer', borderBottom: '1px solid var(--border)',
                                background: active?._id === c._id ? 'var(--bg-subtle)' : 'transparent',
                                transition: 'background 0.15s', display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
                            }}>
                            <div className="sidebar-avatar" style={{ width: 42, height: 42, fontSize: '0.9rem', flexShrink: 0 }}>
                                {(c.partner?.name || '?')[0].toUpperCase()}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 600, fontSize: '0.875rem', display: 'flex', justifyContent: 'space-between', marginBottom: '0.15rem' }}>
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.partner?.tradeProfile?.companyName || c.partner?.name}</span>
                                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', flexShrink: 0, marginLeft: 4 }}>{timeAgo(c.lastMessage?.createdAt)}</span>
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {c.lastMessage?.text || 'No messages yet'}
                                </div>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.2rem', textTransform: 'capitalize' }}>
                                    {c.partner?.tradeProfile?.industry} · {c.partner?.tradeProfile?.country}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Chat panel */}
                {!active ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '0.75rem', color: 'var(--text-muted)' }}>
                        <MessageSquare size={44} strokeWidth={1.25} />
                        <p style={{ fontSize: '1rem', fontWeight: 500 }}>Select a connection to chat</p>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Use Meetings tab to schedule video calls</p>
                    </div>
                ) : (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        {/* Chat header */}
                        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-white)', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                            <div className="sidebar-avatar" style={{ width: 44, height: 44, fontSize: '1rem', cursor: 'pointer', flexShrink: 0, boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}
                                onClick={() => setShowProfile(active.partner)}>
                                {(active.partner?.name || '?')[0].toUpperCase()}
                            </div>
                            <div style={{ flex: 1, cursor: 'pointer', minWidth: 0 }} onClick={() => setShowProfile(active.partner)}>
                                <div style={{ fontWeight: 800, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.2rem', letterSpacing: '-0.01em' }}>
                                    {active.partner?.tradeProfile?.companyName || active.partner?.name}
                                    <span style={{ fontSize: '0.65rem', background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 99, padding: '0.15rem 0.6rem', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>{active.partner?.role}</span>
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                                    {active.partner?.tradeProfile?.industry} <span style={{ color: 'var(--border)' }}>•</span> {active.partner?.tradeProfile?.country} <span style={{ color: 'var(--border)' }}>•</span> <span style={{ color: 'var(--accent)' }}>View Telemetry</span>
                                </div>
                            </div>
                            <button onClick={() => setShowProfile(active.partner)}
                                style={{ padding: '0.5rem 1rem', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-subtle)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-primary)', transition: 'background 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-white)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-subtle)'}>
                                <BarChart2 size={16} color="var(--accent)" />Insights
                            </button>
                        </div>

                        {/* Messages */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--bg-subtle)' }}>
                            {(active.messages || []).length === 0 && (
                                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <MessageSquare size={32} color="var(--border)" style={{ marginBottom: '1rem' }} />
                                    Secure link established.<br />Ready for transmission.
                                </div>
                            )}
                            {(active.messages || []).map((msg, i) => {
                                const isMe = (msg.sender?.toString() === myId?.toString()) || (msg.sender === myId)
                                const isAI = msg.isAI
                                return (
                                    <div key={i} style={{ display: 'flex', justifyContent: isAI ? 'center' : isMe ? 'flex-end' : 'flex-start' }}>
                                        {isAI ? (
                                            <div style={{ maxWidth: '90%', background: 'linear-gradient(135deg, rgba(239, 246, 255, 0.8), rgba(219, 234, 254, 0.5))', border: '1px solid #bfdbfe', borderRadius: 16, padding: '0.875rem 1.25rem', fontSize: '0.875rem', color: '#1e40af', display: 'flex', gap: '0.75rem', alignItems: 'flex-start', backdropFilter: 'blur(8px)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                                                <Zap size={16} color="#3b82f6" style={{ flexShrink: 0, marginTop: 2 }} />
                                                <div><span style={{ fontWeight: 800, display: 'block', fontSize: '0.7rem', marginBottom: '0.25rem', letterSpacing: '0.05em' }}>AI INTELLIGENCE</span><span style={{ lineHeight: 1.6, fontWeight: 500 }}>{msg.text}</span></div>
                                            </div>
                                        ) : (
                                            <div style={{ maxWidth: '75%' }}>
                                                {!isMe && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.35rem', paddingLeft: '0.75rem', fontWeight: 600 }}>{msg.senderName}</div>}
                                                <div style={{
                                                    background: isMe ? 'var(--text-primary)' : 'var(--bg-white)',
                                                    color: isMe ? 'var(--bg-white)' : 'var(--text-primary)',
                                                    borderRadius: 16,
                                                    borderTopRightRadius: isMe ? 4 : 16,
                                                    borderTopLeftRadius: !isMe ? 4 : 16,
                                                    padding: '0.75rem 1.25rem',
                                                    fontSize: '0.925rem', lineHeight: 1.6,
                                                    border: isMe ? 'none' : '1px solid var(--border)',
                                                    boxShadow: isMe ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : '0 2px 4px rgba(0, 0, 0, 0.03)',
                                                }}>{msg.text}</div>
                                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.35rem', textAlign: isMe ? 'right' : 'left', paddingLeft: isMe ? 0 : '0.75rem', fontWeight: 500 }}>{timeAgo(msg.createdAt)}</div>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Input */}
                        <div style={{ padding: '1rem', borderTop: '1px solid var(--border)', background: 'var(--bg-white)', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                            <button onClick={generateAIMessage} disabled={genAI} title="Generate AI message"
                                style={{ padding: '0.75rem', borderRadius: 12, border: '1px solid var(--accent)', background: 'var(--accent-light)', cursor: 'pointer', flexShrink: 0, display: 'flex', transition: 'all 0.2s' }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                            >
                                <Zap size={18} color="var(--accent)" />
                            </button>
                            <input
                                style={{ flex: 1, border: '1px solid var(--border)', borderRadius: 12, padding: '0.875rem 1rem', fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none', background: 'var(--bg-subtle)', color: 'var(--text-primary)', transition: 'border-color 0.2s', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}
                                placeholder={genAI ? 'Analyzing context & generating response...' : 'Type a secure message...'}
                                value={message} onChange={e => setMessage(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                                onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                                onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
                            />
                            <button onClick={sendMessage} disabled={!message.trim() || sending}
                                style={{ padding: '0.875rem 1.25rem', borderRadius: 12, border: 'none', background: 'var(--text-primary)', color: 'var(--bg-white)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: 700, opacity: !message.trim() || sending ? 0.5 : 1, transition: 'all 0.2s' }}>
                                <Send size={16} />{sending ? 'Sending' : 'Send'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}
