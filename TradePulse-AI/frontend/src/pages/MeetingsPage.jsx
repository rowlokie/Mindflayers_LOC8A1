import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Video, Calendar, CheckCircle2, X, Clock, MapPin, Users, Plus, Maximize2, Minimize2, PhoneOff } from 'lucide-react'

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'
const api = async (path, opts = {}) => {
    const token = localStorage.getItem('tp_token')
    const res = await fetch(`${BACKEND}${path}`, {
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        ...opts,
    })
    return res.json()
}

function fmtDate(d) {
    if (!d) return '—'
    return new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}
function isPast(d) { return d && new Date(d).getTime() + 60 * 60 * 1000 < Date.now() }
function isHappeningNow(d) { return d && new Date(d).getTime() <= Date.now() && !isPast(d) }

/* ── In-app Jitsi Video Modal ─────────────────────────────────── */
function VideoModal({ roomId, displayName, onClose }) {
    const [full, setFull] = useState(false)
    const src = `https://meet.jit.si/${roomId}#userInfo.displayName=${encodeURIComponent(displayName)}&config.prejoinPageEnabled=false&config.startWithVideoMuted=false&config.startWithAudioMuted=false&interfaceConfig.SHOW_JITSI_WATERMARK=false&interfaceConfig.TOOLBAR_BUTTONS=["microphone","camera","hangup","chat","raisehand","tileview","fullscreen"]`

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                position: 'fixed', inset: 0, zIndex: 9999,
                background: 'rgba(0,0,0,0.9)',
                display: 'flex', flexDirection: 'column',
            }}
        >
            {/* Toolbar */}
            <div style={{
                background: '#111827', padding: '0.625rem 1rem',
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                borderBottom: '1px solid #374151',
            }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#4ade80', flexShrink: 0 }} />
                <span style={{ color: 'white', fontWeight: 600, fontSize: '0.9rem' }}>TradePulse Meeting</span>
                <span style={{ color: '#6b7280', fontSize: '0.8rem' }}>Room: {roomId}</span>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => setFull(f => !f)} style={{ background: '#374151', border: 'none', borderRadius: 8, padding: '0.4rem 0.75rem', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.775rem' }}>
                        {full ? <Minimize2 size={13} /> : <Maximize2 size={13} />}{full ? 'Windowed' : 'Fullscreen'}
                    </button>
                    <button onClick={onClose} style={{ background: '#dc2626', border: 'none', borderRadius: 8, padding: '0.4rem 0.875rem', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.775rem' }}>
                        <PhoneOff size={13} />Leave
                    </button>
                </div>
            </div>

            {/* Jitsi iframe */}
            <div style={{ flex: 1, position: 'relative' }}>
                <iframe
                    src={src}
                    allow="camera; microphone; fullscreen; display-capture; autoplay"
                    style={{ width: '100%', height: '100%', border: 'none' }}
                    title="TradePulse Meeting"
                />
            </div>
        </motion.div>
    )
}

/* ── Meeting Card ─────────────────────────────────────────────── */
function MeetingCard({ m, myId, onConfirm, onReject, onJoin, onPropose }) {
    const p = m.partner?.tradeProfile || {}
    const past = isPast(m.meetingTime || m.meetingProposedTime)
    const isNow = m.meetingStatus === 'confirmed' && isHappeningNow(m.meetingTime)
    const isReq = m.meetingStatus === 'proposed' && !m.iProposed && !m.iConfirmed

    const statusColor = {
        proposed: { bg: '#fffbeb', border: '#fde68a', text: '#92400e', label: 'Awaiting Approval' },
        confirmed: { bg: isNow ? '#eff6ff' : '#f0fdf4', border: isNow ? '#bfdbfe' : '#bbf7d0', text: isNow ? '#1d4ed8' : '#14532d', label: past ? 'Completed' : (isNow ? 'In Progress' : 'Confirmed') },
    }[m.meetingStatus] || { bg: '#f9fafb', border: '#e5e7eb', text: '#374151', label: 'Scheduled' }

    return (
        <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            style={{
                background: 'var(--bg-white)', border: '1px solid var(--border)',
                borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-sm)',
            }}>
            {/* Status bar */}
            <div style={{ background: statusColor.bg, borderBottom: `1px solid ${statusColor.border}`, padding: '0.5rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: statusColor.text }} />
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: statusColor.text, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{statusColor.label}</span>
                {m.meetingStatus === 'proposed' && m.iProposed && (
                    <span style={{ fontSize: '0.7rem', color: statusColor.text, marginLeft: 'auto' }}>Waiting for partner's approval</span>
                )}
            </div>

            <div style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
                    {/* Avatar */}
                    <div style={{
                        width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#111827,#374151)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: 800, fontSize: '1rem', flexShrink: 0,
                    }}>
                        {(m.partner?.name || '?')[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.2rem' }}>{p.companyName || m.partner?.name}</div>
                        <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                            {p.industry && <span>🏭 {p.industry}</span>}
                            {p.country && <span><MapPin size={11} style={{ display: 'inline' }} />{p.country}</span>}
                            <span style={{ textTransform: 'capitalize', background: 'var(--bg-subtle)', padding: '0.1rem 0.5rem', borderRadius: 99, border: '1px solid var(--border)' }}>{m.partner?.role}</span>
                        </div>
                    </div>
                </div>

                {/* Meeting time */}
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem', background: 'var(--bg-subtle)', borderRadius: 10, padding: '0.75rem' }}>
                    <Calendar size={16} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
                    <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.1rem' }}>
                            {m.meetingStatus === 'confirmed' ? 'Confirmed Time' : 'Proposed Time'}
                        </div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                            {fmtDate(m.meetingTime || m.meetingProposedTime)}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
                    {m.meetingStatus === 'confirmed' && !past && (
                        <button onClick={() => onJoin(m.roomId, m.connectionId)}
                            style={{
                                flex: 1, padding: '0.625rem', borderRadius: 10, border: 'none',
                                background: 'linear-gradient(135deg,#111827,#374151)',
                                color: 'white', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.85rem',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                            }}>
                            <Video size={15} />Join Meeting
                        </button>
                    )}
                    {isReq && (
                        <>
                            <button onClick={() => onConfirm(m.connectionId)}
                                style={{ flex: 1, padding: '0.625rem', borderRadius: 10, background: '#f0fdf4', color: '#15803d', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', border: '1px solid #bbf7d0' }}>
                                <CheckCircle2 size={14} />Approve
                            </button>
                            <button onClick={() => onReject(m.connectionId)}
                                style={{ flex: 1, padding: '0.625rem', borderRadius: 10, border: '1px solid #fca5a5', background: '#fff5f5', color: '#dc2626', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}>
                                <X size={14} />Decline
                            </button>
                        </>
                    )}
                </div>
            </div>
        </motion.div>
    )
}

/* ── Propose Meeting Modal ────────────────────────────────────── */
function ProposeMeetingModal({ connections, onPropose, onClose }) {
    const [connId, setConnId] = useState(connections[0]?._id || '')
    const [time, setTime] = useState('')
    const [busy, setBusy] = useState(false)

    const submit = async () => {
        if (!connId || !time) return
        setBusy(true)
        await onPropose(connId, time)
        setBusy(false)
        onClose()
    }

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                style={{ background: 'var(--bg-white)', borderRadius: 16, padding: '1.75rem', width: '100%', maxWidth: 420 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                    <Calendar size={18} color="var(--accent)" />
                    <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>Schedule a Meeting</h3>
                    <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}><X size={16} /></button>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.375rem' }}>Select Connection</label>
                    <select className="form-input" value={connId} onChange={e => setConnId(e.target.value)}>
                        {connections.map(c => (
                            <option key={c._id} value={c._id}>
                                {c.partner?.tradeProfile?.companyName || c.partner?.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.375rem' }}>Date & Time</label>
                    <input type="datetime-local" className="form-input" value={time} onChange={e => setTime(e.target.value)} min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)} />
                </div>
                <button className="btn-primary" onClick={submit} disabled={!connId || !time || busy}>
                    {busy ? 'Proposing…' : 'Send Meeting Request'}
                </button>
            </motion.div>
        </div>
    )
}

/* ══════════════════════════════════════════════════════════════
   MAIN MeetingsPage
══════════════════════════════════════════════════════════════ */
export default function MeetingsPage({ backendUser }) {
    const [meetings, setMeetings] = useState([])
    const [connections, setConnections] = useState([])
    const [loading, setLoading] = useState(true)
    const [tab, setTab] = useState('upcoming')
    const [videoRoom, setVideoRoom] = useState(null)
    const [showPropose, setShowPropose] = useState(false)

    const load = useCallback(async () => {
        setLoading(true)
        const [m, c] = await Promise.all([
            api('/api/connections/meetings'),
            api('/api/connections'),
        ])
        setMeetings(m.meetings || [])
        setConnections((c.connections || []).filter(x => x.meetingStatus === 'none' || !x.meetingStatus))
        setLoading(false)
    }, [])

    useEffect(() => { load() }, [load])

    const confirmMeeting = async (connId) => {
        await api(`/api/connections/${connId}/confirm-meeting`, { method: 'PUT', body: '{}' })
        load()
    }

    const rejectMeeting = async (connId) => {
        await api(`/api/connections/${connId}/reject-meeting`, { method: 'PUT', body: '{}' })
        load()
    }

    const proposeMeeting = async (connId, time) => {
        try {
            const res = await api(`/api/connections/${connId}/propose-meeting`, {
                method: 'POST',
                body: JSON.stringify({ proposedTime: time })
            })
            if (res.message && res.message.includes('not found')) {
                alert('Connection not found.')
            }
            load()
        } catch (e) {
            console.error('Propose Error:', e)
            alert('Could not schedule meeting. Please try again.')
        }
    }

    const requests = meetings.filter(m => m.meetingStatus === 'proposed' && !m.iProposed && !m.iConfirmed)
    const upcoming = meetings.filter(m => m.meetingStatus === 'confirmed' && !isPast(m.meetingTime))
    const proposed = meetings.filter(m => m.meetingStatus === 'proposed' && m.iProposed)
    const past = meetings.filter(m => m.meetingStatus === 'confirmed' && isPast(m.meetingTime))

    const tabs = [
        { id: 'upcoming', label: 'Upcoming', count: upcoming.length + proposed.length },
        { id: 'requests', label: 'Requests', count: requests.length },
        { id: 'past', label: 'Past', count: past.length },
    ]

    const displayed = tab === 'upcoming' ? [...upcoming, ...proposed] : tab === 'requests' ? requests : past

    const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }

    return (
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <AnimatePresence>
                {videoRoom && (
                    <VideoModal
                        roomId={videoRoom.roomId}
                        displayName={backendUser?.name || 'User'}
                        onClose={() => setVideoRoom(null)}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showPropose && connections.length > 0 && (
                    <ProposeMeetingModal connections={connections} onPropose={proposeMeeting} onClose={() => setShowPropose(false)} />
                )}
            </AnimatePresence>

            <div className="page-header" style={{ marginBottom: '3rem', borderBottom: '1px solid var(--border)', paddingBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div style={{ padding: '1rem', borderRadius: 16, background: 'var(--accent-gradient)', color: 'white', boxShadow: '0 8px 25px rgba(37,99,235,0.35)' }}>
                        <Calendar size={28} />
                    </div>
                    <div>
                        <h1 className="page-title" style={{ fontSize: '2.5rem', letterSpacing: '-0.03em', marginBottom: '0.25rem' }}>Secure Comm Link</h1>
                        <p className="page-subtitle" style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>Coordinate digital trade delegations via end-to-end encrypted HD video streams.</p>
                    </div>
                    <button onClick={() => setShowPropose(true)}
                        className="btn-primary btn-glow"
                        style={{
                            marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.625rem',
                            padding: '0.875rem 1.5rem', borderRadius: 14, border: 'none',
                            cursor: connections.length === 0 ? 'not-allowed' : 'pointer',
                            width: 'auto',
                            opacity: connections.length === 0 ? 0.5 : 1,
                        }}
                        disabled={connections.length === 0}>
                        <Plus size={18} /> Schedule Call
                    </button>
                </div>
            </div>

            <div className="page-body">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        ['Upcoming', upcoming.length, '#3b82f6'],
                        ['Requests', requests.length, '#f59e0b'],
                        ['Proposed', proposed.length, '#8b5cf6'],
                        ['Completed', past.length, '#10b981'],
                    ].map(([label, count, color]) => (
                        <div key={label} className="content-card card-glass" style={{ padding: '1.25rem', border: '1px solid var(--border)' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>{label}</div>
                            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                                {count}
                                <div style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', background: 'var(--bg-subtle)', borderRadius: 14, padding: '0.375rem', border: '1px solid var(--border)' }}>
                    {tabs.map(t => (
                        <button key={t.id} onClick={() => setTab(t.id)}
                            style={{
                                flex: 1, padding: '0.75rem', borderRadius: 10, border: 'none', cursor: 'pointer',
                                fontFamily: 'inherit', fontWeight: 800, fontSize: '0.875rem',
                                background: tab === t.id ? 'var(--bg-white)' : 'transparent',
                                color: tab === t.id ? 'var(--text-primary)' : 'var(--text-muted)',
                                boxShadow: tab === t.id ? 'var(--shadow-sm)' : 'none',
                                transition: 'all 0.2s',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                            }}>
                            {t.label}
                            {t.count > 0 && <span style={{ background: tab === t.id ? 'var(--accent)' : 'var(--border)', color: 'white', borderRadius: 99, px: '0.625rem', py: '0.125rem', fontSize: '0.7rem' }}>{t.count}</span>}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div style={{ padding: '5rem', textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
                ) : displayed.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="empty-state" style={{ padding: '6rem 2rem' }}>
                        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', color: 'var(--border)' }}>
                            <Video size={40} />
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                            {tab === 'upcoming' ? 'No Trade Sessions Found' : tab === 'requests' ? 'No Pending Invitations' : 'Archive Empty'}
                        </h3>
                        <p style={{ color: 'var(--text-muted)', maxWidth: 320, margin: '0 auto 2rem' }}>
                            {tab === 'upcoming' ? 'Grow your trade network to unlock peer-to-peer delegation calls.' : 'Invitations from prospective partners will appear in this secure queue.'}
                        </p>
                        {tab === 'upcoming' && connections.length > 0 && (
                            <button className="btn-primary" style={{ width: 'auto' }} onClick={() => setShowPropose(true)}>
                                Schedule First Deployment
                            </button>
                        )}
                    </motion.div>
                ) : (
                    <motion.div variants={container} initial="hidden" animate="show" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem' }}>
                        {displayed.map(m => (
                            <MeetingCard
                                key={m.connectionId}
                                m={m}
                                myId={backendUser?.id}
                                onConfirm={confirmMeeting}
                                onReject={rejectMeeting}
                                onJoin={(roomId) => setVideoRoom({ roomId })}
                                onPropose={() => setShowPropose(true)}
                            />
                        ))}
                    </motion.div>
                )}

                <div style={{
                    marginTop: '3.5rem', padding: '1.75rem',
                    background: 'var(--bg-white)', borderRadius: 24, border: '1px solid var(--border)',
                    display: 'flex', gap: '1.5rem', alignItems: 'center', boxShadow: 'var(--shadow-lg)'
                }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Video size={24} color="#7c3aed" />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 800, fontSize: '0.9375rem', marginBottom: '0.25rem' }}>Secure Enterprise Video</div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                            All trade calls use end-to-end encrypted streams. For best performance, ensure you have a stable 5Mbps+ link and use a certified workspace.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
