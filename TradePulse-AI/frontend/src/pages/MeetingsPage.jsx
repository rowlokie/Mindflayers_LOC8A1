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
function isPast(d) { return d && new Date(d) < Date.now() }

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
    const isReq = m.meetingStatus === 'proposed' && !m.iProposed && !m.iConfirmed

    const statusColor = {
        proposed: { bg: '#fffbeb', border: '#fde68a', text: '#92400e', label: 'Awaiting Approval' },
        confirmed: { bg: '#f0fdf4', border: '#bbf7d0', text: '#14532d', label: past ? 'Completed' : 'Confirmed' },
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
                                style={{ flex: 1, padding: '0.625rem', borderRadius: 10, border: 'none', background: '#f0fdf4', color: '#15803d', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', border: '1px solid #bbf7d0' }}>
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
                    <input type="datetime-local" className="form-input" value={time} onChange={e => setTime(e.target.value)} min={new Date().toISOString().slice(0, 16)} />
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
    const [tab, setTab] = useState('upcoming')   // upcoming | requests | past
    const [videoRoom, setVideoRoom] = useState(null)          // { roomId, connId }
    const [showPropose, setShowPropose] = useState(false)

    const load = useCallback(async () => {
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
        await api(`/api/connections/${connId}/propose-meeting`, { method: 'POST', body: JSON.stringify({ proposedTime: time }) })
        load()
    }

    // Categorize
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

    return (
        <>
            {/* In-app Video Modal */}
            <AnimatePresence>
                {videoRoom && (
                    <VideoModal
                        roomId={videoRoom.roomId}
                        displayName={backendUser?.name || 'User'}
                        onClose={() => setVideoRoom(null)}
                    />
                )}
            </AnimatePresence>

            {/* Propose Modal */}
            <AnimatePresence>
                {showPropose && connections.length > 0 && (
                    <ProposeMeetingModal connections={connections} onPropose={proposeMeeting} onClose={() => setShowPropose(false)} />
                )}
            </AnimatePresence>

            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div>
                        <h1 className="page-title">Meetings</h1>
                        <p className="page-subtitle">Schedule and join video meetings with your trade partners</p>
                    </div>
                    <button onClick={() => setShowPropose(true)}
                        style={{
                            marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem',
                            padding: '0.625rem 1.125rem', borderRadius: 10, border: 'none',
                            background: 'linear-gradient(135deg,#111827,#374151)', color: 'white',
                            cursor: connections.length === 0 ? 'not-allowed' : 'pointer',
                            fontFamily: 'inherit', fontWeight: 600, fontSize: '0.875rem',
                            opacity: connections.length === 0 ? 0.5 : 1,
                        }}
                        disabled={connections.length === 0}
                        title={connections.length === 0 ? 'All connections already have meetings' : 'Schedule new meeting'}>
                        <Plus size={16} />Schedule Meeting
                    </button>
                </div>
            </div>

            <div className="page-body">
                {/* Stats */}
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                    {[
                        ['📅 Upcoming', upcoming.length, '#eff6ff', '#2563eb', '#bfdbfe'],
                        ['🔔 Requests', requests.length, '#fffbeb', '#d97706', '#fde68a'],
                        ['📤 Proposed', proposed.length, '#f5f3ff', '#7c3aed', '#ddd6fe'],
                        ['✅ Past', past.length, '#f0fdf4', '#15803d', '#bbf7d0'],
                    ].map(([label, count, bg, color, border]) => (
                        <div key={label} style={{ flex: '1 1 100px', background: bg, border: `1px solid ${border}`, borderRadius: 12, padding: '0.75rem 1rem' }}>
                            <div style={{ fontSize: '0.65rem', color, fontWeight: 600, marginBottom: '0.2rem' }}>{label}</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 900, color }}>{count}</div>
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '1.5rem', background: 'var(--bg-subtle)', borderRadius: 10, padding: '0.25rem' }}>
                    {tabs.map(t => (
                        <button key={t.id} onClick={() => setTab(t.id)}
                            style={{
                                flex: 1, padding: '0.5rem', borderRadius: 8, border: 'none', cursor: 'pointer',
                                fontFamily: 'inherit', fontWeight: 600, fontSize: '0.8125rem',
                                background: tab === t.id ? 'var(--bg-white)' : 'transparent',
                                color: tab === t.id ? 'var(--text-primary)' : 'var(--text-muted)',
                                boxShadow: tab === t.id ? 'var(--shadow-sm)' : 'none',
                                transition: 'all 0.15s',
                            }}>
                            {t.label} {t.count > 0 && <span style={{ marginLeft: 4, background: tab === t.id ? '#111827' : 'var(--border)', color: tab === t.id ? 'white' : 'var(--text-secondary)', borderRadius: 99, padding: '0.05rem 0.45rem', fontSize: '0.65rem' }}>{t.count}</span>}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="empty-state"><div className="spinner" /></div>
                ) : displayed.length === 0 ? (
                    <div className="empty-state">
                        <Video size={36} strokeWidth={1.25} />
                        <p style={{ fontWeight: 600, marginBottom: '0.375rem' }}>
                            {tab === 'upcoming' ? 'No upcoming meetings' : tab === 'requests' ? 'No pending requests' : 'No past meetings'}
                        </p>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                            {tab === 'upcoming' ? 'Schedule a meeting with any of your connections.' : 'Meeting requests from partners appear here.'}
                        </p>
                        {tab === 'upcoming' && connections.length > 0 && (
                            <button className="btn-primary" style={{ width: 'auto' }} onClick={() => setShowPropose(true)}>
                                <Plus size={14} style={{ display: 'inline', marginRight: 6 }} />Schedule Meeting
                            </button>
                        )}
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem' }}>
                        <AnimatePresence>
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
                        </AnimatePresence>
                    </div>
                )}

                {/* Info box */}
                <div style={{ marginTop: '2rem', background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 12, padding: '1rem 1.25rem', display: 'flex', gap: '0.875rem', alignItems: 'flex-start' }}>
                    <Video size={16} color="var(--text-muted)" style={{ marginTop: 2, flexShrink: 0 }} />
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        <strong style={{ color: 'var(--text-primary)' }}>How meetings work:</strong> Propose a meeting time with any connection → they approve → a private video room opens right here in TradePulse. No installs needed, powered by Jitsi Meet.
                    </div>
                </div>
            </div>
        </>
    )
}
