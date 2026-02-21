import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, X, Send, Zap, ChevronDown } from 'lucide-react'

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'
const api = async (path, opts = {}) => {
    const token = localStorage.getItem('tp_token')
    const res = await fetch(`${BACKEND}${path}`, {
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        ...opts,
    })
    return res.json()
}

const SUGGESTIONS = [
    'How does matching work?',
    'How do I improve my profile score?',
    'What certifications should I get?',
    'How do I schedule a meeting?',
    'Tips for my first message?',
]

export default function AIChatbot({ backendUser }) {
    const [open, setOpen] = useState(false)
    const [messages, setMessages] = useState([
        { role: 'ai', text: `Hi ${backendUser?.name?.split(' ')[0] || 'there'}! 👋 I'm your TradePulse AI assistant. I know your full profile and can help with matching, outreach, certifications, and more. What would you like to know?` }
    ])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [badge, setBadge] = useState(true)
    const endRef = useRef(null)

    useEffect(() => {
        if (open) {
            setBadge(false)
            endRef.current?.scrollIntoView({ behavior: 'smooth' })
        }
    }, [open, messages])

    const send = async (text) => {
        const msg = text || input.trim()
        if (!msg || loading) return
        setInput('')
        setLoading(true)
        const userMsg = { role: 'user', text: msg }
        setMessages(m => [...m, userMsg])
        try {
            const history = messages.slice(-6).map(m => ({ role: m.role, text: m.text }))
            const res = await api('/api/ai/chat', { method: 'POST', body: JSON.stringify({ message: msg, history }) })
            setMessages(m => [...m, { role: 'ai', text: res.response || 'Sorry, I couldn\'t process that.' }])
        } catch {
            setMessages(m => [...m, { role: 'ai', text: 'Something went wrong. Please try again.' }])
        }
        setLoading(false)
    }

    return (
        <>
            {/* Floating button */}
            <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 1000 }}>
                <AnimatePresence>
                    {!open && badge && (
                        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            style={{ position: 'absolute', bottom: '100%', right: 0, marginBottom: '0.625rem', background: '#111827', color: 'white', borderRadius: 10, padding: '0.5rem 0.875rem', fontSize: '0.8125rem', whiteSpace: 'nowrap', pointerEvents: 'none' }}>
                            Ask me anything! ✨
                            <div style={{ position: 'absolute', bottom: -6, right: 16, width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '6px solid #111827' }} />
                        </motion.div>
                    )}
                </AnimatePresence>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => setOpen(o => !o)}
                    style={{ width: 56, height: 56, borderRadius: '50%', border: 'none', background: 'linear-gradient(135deg,#111827,#374151)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(17,24,39,0.35)', position: 'relative' }}>
                    <AnimatePresence mode="wait">
                        {open
                            ? <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}><X size={22} color="white" /></motion.div>
                            : <motion.div key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}><Zap size={22} color="white" /></motion.div>
                        }
                    </AnimatePresence>
                    {badge && !open && (
                        <span style={{ position: 'absolute', top: 0, right: 0, width: 14, height: 14, background: '#ef4444', borderRadius: '50%', border: '2px solid white' }} />
                    )}
                </motion.button>
            </div>

            {/* Chat panel */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 25 }}
                        style={{
                            position: 'fixed', bottom: '5.5rem', right: '1.5rem', zIndex: 999, width: 360, maxWidth: 'calc(100vw - 2rem)',
                            background: 'white', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.18)', border: '1px solid var(--border)', overflow: 'hidden', display: 'flex', flexDirection: 'column'
                        }}>

                        {/* Header */}
                        <div style={{ background: 'linear-gradient(135deg,#111827,#374151)', padding: '1rem 1rem 0.875rem', color: 'white' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Zap size={18} color="white" />
                                </div>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>TradePulse AI</div>
                                    <div style={{ fontSize: '0.7rem', opacity: 0.75, display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
                                        Knows your full profile
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem', maxHeight: 340, display: 'flex', flexDirection: 'column', gap: '0.5rem', background: '#f9fafb' }}>
                            {messages.map((m, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                                    <div style={{
                                        maxWidth: '80%', borderRadius: 10, padding: '0.5rem 0.75rem', fontSize: '0.8125rem', lineHeight: 1.55,
                                        background: m.role === 'user' ? '#111827' : 'white',
                                        color: m.role === 'user' ? 'white' : 'var(--text-primary)',
                                        border: m.role === 'user' ? 'none' : '1px solid var(--border)',
                                        boxShadow: m.role === 'ai' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                                    }}>
                                        {m.text}
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                                    <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 10, padding: '0.5rem 0.875rem', display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                                        {[0, 1, 2].map(j => (
                                            <motion.span key={j} style={{ width: 6, height: 6, borderRadius: '50%', background: '#9ca3af', display: 'inline-block' }}
                                                animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, delay: j * 0.1, repeat: Infinity }} />
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div ref={endRef} />
                        </div>

                        {/* Suggestions (show only at start) */}
                        {messages.length === 1 && (
                            <div style={{ padding: '0 0.75rem 0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                                {SUGGESTIONS.map(s => (
                                    <button key={s} onClick={() => send(s)}
                                        style={{ fontSize: '0.7rem', padding: '0.25rem 0.625rem', borderRadius: 99, border: '1px solid var(--border)', background: 'white', cursor: 'pointer', fontFamily: 'inherit', color: 'var(--text-secondary)' }}>
                                        {s}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Input */}
                        <div style={{ padding: '0.625rem 0.75rem', borderTop: '1px solid var(--border)', background: 'white', display: 'flex', gap: '0.5rem' }}>
                            <input
                                style={{ flex: 1, border: '1px solid var(--border)', borderRadius: 8, padding: '0.5rem 0.75rem', fontSize: '0.8125rem', fontFamily: 'inherit', outline: 'none', background: '#f9fafb' }}
                                placeholder="Ask anything…"
                                value={input} onChange={e => setInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && send()}
                                disabled={loading} />
                            <button onClick={() => send()} disabled={!input.trim() || loading}
                                style={{ padding: '0.5rem 0.75rem', borderRadius: 8, border: 'none', background: '#111827', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                <Send size={14} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
