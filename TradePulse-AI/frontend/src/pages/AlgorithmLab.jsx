import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Beaker, Search, ChevronRight, BarChart3, Globe2, Activity, ShieldCheck, Sparkles, Filter } from 'lucide-react'

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

const api = async (path, opts = {}) => {
    const token = localStorage.getItem('tp_token')
    const res = await fetch(`${BACKEND}${path}`, {
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        ...opts,
    })
    return res.json()
}

export default function AlgorithmLab() {
    const [data, setData] = useState({ importers: [], exporters: [] })
    const [anchor, setAnchor] = useState(null)
    const [results, setResults] = useState([])
    const [loading, setLoading] = useState(false)
    const [search, setSearch] = useState('')

    useEffect(() => {
        api('/api/lab/candidates').then(setData)
    }, [])

    const handleEvaluate = async (company) => {
        setAnchor(company)
        setLoading(true)
        try {
            const res = await api('/api/lab/evaluate', {
                method: 'POST',
                body: JSON.stringify({ anchorId: company.id, anchorRole: company.role })
            })
            setResults(res.matches || [])
        } finally {
            setLoading(false)
        }
    }

    const filteredCandidates = [...data.importers, ...data.exporters].filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.Industry.toLowerCase().includes(search.toLowerCase())
    ).slice(0, 10)

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '350px 1fr', gap: '2rem' }}>
            {/* Sidebar: Candidate Selector */}
            <aside style={{ height: 'calc(100vh - 150px)', overflowY: 'auto', padding: '0.5rem' }}>
                <div className="card-glass" style={{ padding: '1.5rem', marginBottom: '1.5rem', position: 'sticky', top: 0, zIndex: 10 }}>
                    <h3 style={{ fontWeight: 900, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Beaker size={20} color="var(--accent)" /> Lab Bench
                    </h3>
                    <div className="input-group">
                        <Search size={16} className="input-icon" />
                        <input
                            placeholder="Search 5k+ records..."
                            className="input-field"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {filteredCandidates.map(c => (
                        <div
                            key={c.id}
                            onClick={() => handleEvaluate(c)}
                            style={{
                                padding: '1rem', borderRadius: 16, cursor: 'pointer', transition: 'all 0.2s',
                                background: anchor?.id === c.id ? 'var(--accent)' : 'var(--bg-white)',
                                color: anchor?.id === c.id ? 'white' : 'var(--text-primary)',
                                boxShadow: 'var(--shadow-sm)',
                                border: '1px solid var(--border)'
                            }}
                        >
                            <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{c.name}</div>
                            <div style={{ fontSize: '0.7rem', opacity: 0.8, display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                                <span>{c.Industry}</span>
                                <span style={{ textTransform: 'uppercase', fontWeight: 900 }}>{c.role}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </aside>

            {/* Main Content: Evaluation Results */}
            <main>
                {!anchor ? (
                    <div className="empty-state" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <div style={{ width: 80, height: 80, borderRadius: 24, background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
                            <Activity size={40} color="var(--accent)" />
                        </div>
                        <h2 style={{ fontWeight: 900, fontSize: '2rem' }}>Ready for Simulation</h2>
                        <p style={{ color: 'var(--text-muted)' }}>Select any exporter or importer from the left sidebar to run the TradeCupid 10D Hybrid Logic against the dataset.</p>
                    </div>
                ) : (
                    <div>
                        {/* Anchor Detail */}
                        <div className="card-glass" style={{ padding: '2rem', marginBottom: '2rem', border: '2px solid var(--accent)', position: 'relative' }}>
                            <div style={{ position: 'absolute', top: -12, left: 24, padding: '0.2rem 1rem', borderRadius: 20, background: 'var(--accent)', color: 'white', fontSize: '0.7rem', fontWeight: 900 }}>ACTIVE ANCHOR</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h2 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.04em' }}>{anchor.name}</h2>
                                    <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                                        <span>ID: {anchor.id}</span>
                                        <span>•</span>
                                        <span style={{ color: 'var(--accent)' }}>{anchor.Industry}</span>
                                        <span>•</span>
                                        <span>Revenue: ${anchor.Revenue_Size_USD?.toLocaleString()}</span>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800 }}>MAPPING STATUS</div>
                                    <div style={{ color: '#10b981', fontWeight: 900, fontSize: '1.1rem' }}>✓ DATA SYNCED</div>
                                </div>
                            </div>
                        </div>

                        <h3 style={{ fontWeight: 900, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Filter size={20} /> Simulated Matches (Top {results.length})
                        </h3>

                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '5rem' }}>
                                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }} style={{ width: 40, height: 40, border: '4px solid #eee', borderTopColor: 'var(--accent)', borderRadius: '50%', margin: '0 auto' }} />
                                <p style={{ marginTop: '1rem', fontWeight: 700 }}>Running RRF Cross-Analysis...</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {results.map(r => (
                                    <motion.div
                                        key={r.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="card-glass"
                                        style={{ padding: '1.25rem', border: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 100px 200px' }}
                                    >
                                        <div>
                                            <div style={{ fontWeight: 900, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{r.name}</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                                                <span>{r.Industry}</span>
                                                <span>•</span>
                                                <span style={{ color: 'var(--accent)', fontWeight: 800 }}>{r.geoLabel} Corridor</span>
                                            </div>
                                            <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', fontStyle: 'italic', color: 'var(--text-secondary)' }}>"{r.aiReason}"</p>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: r.matchScore > 80 ? '#10b981' : 'var(--accent)' }}>{r.matchScore}%</div>
                                            <div style={{ fontSize: '0.5rem', fontWeight: 800, color: 'var(--text-muted)' }}>SYNERGY</div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                                            {Object.entries(r.breakdown).map(([k, v]) => (
                                                <div key={k} style={{ fontSize: '0.5rem' }}>
                                                    <div style={{ fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{k.slice(0, 6)}</div>
                                                    <div style={{ height: 3, background: '#eee', borderRadius: 2 }}>
                                                        <div style={{ height: '100%', width: `${v}%`, background: v > 70 ? 'var(--accent)' : '#f59e0b', borderRadius: 2 }} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    )
}
