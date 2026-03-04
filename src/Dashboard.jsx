import React, { useState, useEffect, useCallback, useRef } from 'react';
import AnimatedOrb from './components/AnimatedOrb';
import Chat from './components/Chat';
import { chatWithEDITH } from './lib/groq';
import { getChats, createChat, getMessages, insertMessage, autoTitleChat, deleteChat } from './lib/database';

export default function Dashboard({ onNavigate, session, onLogout }) {
    /* ─── State ─── */
    const [isProcessing, setIsProcessing] = useState(false);
    const [uptime, setUptime] = useState(0);

    /* ─── Real Telemetry State ─── */
    const [cpuLoad, setCpuLoad] = useState(0);          // Estimated from JS heap usage %
    const [netLoad, setNetLoad] = useState(0);           // Real downlink as % of max (~100 Mbps)
    const [jsHeapMB, setJsHeapMB] = useState('0');       // JS Heap Used (MB)
    const [jsHeapLimitMB, setJsHeapLimitMB] = useState('0'); // JS Heap Limit (MB)
    const [cpuCores, setCpuCores] = useState(0);         // navigator.hardwareConcurrency
    const [deviceMemoryGB, setDeviceMemoryGB] = useState(null); // navigator.deviceMemory
    const [networkType, setNetworkType] = useState('—');  // effectiveType (4g, 3g, etc.)
    const [downlink, setDownlink] = useState('—');        // Mb/s
    const [rtt, setRtt] = useState('—');                  // Round-trip time in ms
    const [latency, setLatency] = useState('—');          // Real ping to Supabase
    const [batteryLevel, setBatteryLevel] = useState(null); // Battery %
    const [batteryCharging, setBatteryCharging] = useState(null);
    const [onlineStatus, setOnlineStatus] = useState(navigator.onLine);
    const [pageLoadTime, setPageLoadTime] = useState('—');

    /* ─── Chat state ─── */
    const [chats, setChats] = useState([]);
    const [activeChatId, setActiveChatId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [loadingChats, setLoadingChats] = useState(true);

    /* ─── User info ─── */
    const userName = session?.user?.user_metadata?.full_name || session?.user?.email || 'Boss';

    /* ─── System messages (not persisted) ─── */
    const systemMessages = [
        { type: 'system', text: 'E.D.I.T.H. interface initialized. All subsystems online.', time: new Date() },
        { type: 'system', text: `Authentication: Supabase ✓ | User: ${userName}`, time: new Date() },
        { type: 'edith', text: `Good evening, ${userName}. E.D.I.T.H. is ready. How may I assist you?`, time: new Date() },
    ];

    /* ═══════════════════════════════════════════
       REAL TELEMETRY — Browser APIs
       ═══════════════════════════════════════════ */

    // ── 1. Static info on mount ──
    useEffect(() => {
        // CPU cores
        setCpuCores(navigator.hardwareConcurrency || 0);

        // Device memory (Chrome only, rough estimate)
        if (navigator.deviceMemory) {
            setDeviceMemoryGB(navigator.deviceMemory);
        }

        // Page load time from Performance API
        try {
            const nav = performance.getEntriesByType('navigation')[0];
            if (nav) {
                setPageLoadTime((nav.loadEventEnd - nav.startTime).toFixed(0));
            }
        } catch (_) { /* not supported */ }

        // Battery API
        if (navigator.getBattery) {
            navigator.getBattery().then((battery) => {
                setBatteryLevel(Math.round(battery.level * 100));
                setBatteryCharging(battery.charging);
                battery.addEventListener('levelchange', () => setBatteryLevel(Math.round(battery.level * 100)));
                battery.addEventListener('chargingchange', () => setBatteryCharging(battery.charging));
            }).catch(() => { /* not supported */ });
        }

        // Online/offline listeners
        const goOnline = () => setOnlineStatus(true);
        const goOffline = () => setOnlineStatus(false);
        window.addEventListener('online', goOnline);
        window.addEventListener('offline', goOffline);
        return () => {
            window.removeEventListener('online', goOnline);
            window.removeEventListener('offline', goOffline);
        };
    }, []);

    // ── 2. Periodic real telemetry (every 2s) ──
    useEffect(() => {
        const updateTelemetry = () => {
            // JS Heap memory (Chrome only — performance.memory)
            if (performance.memory) {
                const usedMB = (performance.memory.usedJSHeapSize / 1048576).toFixed(1);
                const limitMB = (performance.memory.jsHeapSizeLimit / 1048576).toFixed(0);
                const heapPct = Math.round((performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100);
                setJsHeapMB(usedMB);
                setJsHeapLimitMB(limitMB);
                setCpuLoad(Math.min(99, Math.max(1, heapPct))); // use heap% as CPU proxy
            }

            // Network Information API
            const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
            if (conn) {
                setNetworkType(conn.effectiveType?.toUpperCase() || '—');
                setDownlink(conn.downlink != null ? conn.downlink.toFixed(1) : '—');
                setRtt(conn.rtt != null ? String(conn.rtt) : '—');
                // downlink as percentage of 100 Mbps
                const netPct = conn.downlink != null ? Math.min(99, Math.round((conn.downlink / 100) * 100)) : 0;
                setNetLoad(Math.max(1, netPct));
            }
        };

        updateTelemetry();
        const interval = setInterval(updateTelemetry, 2000);
        return () => clearInterval(interval);
    }, []);

    // ── 3. Real latency ping to Supabase (every 5s) ──
    useEffect(() => {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        if (!supabaseUrl) return;

        const measurePing = async () => {
            try {
                const start = performance.now();
                await fetch(`${supabaseUrl}/rest/v1/`, {
                    method: 'HEAD',
                    mode: 'no-cors',
                    cache: 'no-store',
                });
                const end = performance.now();
                setLatency((end - start).toFixed(0));
            } catch {
                setLatency('ERR');
            }
        };

        measurePing();
        const interval = setInterval(measurePing, 5000);
        return () => clearInterval(interval);
    }, []);

    /* ─── Load user's chats on mount ─── */
    useEffect(() => {
        loadChats();
    }, []);

    const loadChats = async () => {
        try {
            setLoadingChats(true);
            const data = await getChats();
            setChats(data || []);
        } catch (err) {
            console.error('Failed to load chats:', err);
        } finally {
            setLoadingChats(false);
        }
    };

    /* ─── Load messages when active chat changes ─── */
    useEffect(() => {
        if (activeChatId) {
            loadMessages(activeChatId);
        } else {
            setMessages([]);
        }
    }, [activeChatId]);

    const loadMessages = async (chatId) => {
        try {
            const data = await getMessages(chatId);
            setMessages(data || []);
        } catch (err) {
            console.error('Failed to load messages:', err);
        }
    };

    /* ─── Create new chat ─── */
    const handleNewChat = async () => {
        setActiveChatId(null);
        setMessages([]);
    };

    /* ─── Select a chat ─── */
    const handleSelectChat = (chatId) => {
        setActiveChatId(chatId);
    };

    /* ─── Delete a chat ─── */
    const handleDeleteChat = async (chatId, e) => {
        e.stopPropagation();
        try {
            await deleteChat(chatId);
            if (activeChatId === chatId) {
                setActiveChatId(null);
                setMessages([]);
            }
            setChats((prev) => prev.filter((c) => c.id !== chatId));
        } catch (err) {
            console.error('Failed to delete chat:', err);
        }
    };

    /* ─── Uptime counter ─── */
    useEffect(() => {
        const timer = setInterval(() => setUptime((u) => u + 1), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatUptime = (s) => {
        const h = String(Math.floor(s / 3600)).padStart(2, '0');
        const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
        const sec = String(s % 60).padStart(2, '0');
        return `${h}:${m}:${sec}`;
    };

    /* ─── Fallback responses ─── */
    const FALLBACK_RESPONSES = [
        'Acknowledged. Running diagnostics on subsystem 7-Alpha.',
        'All systems nominal. No anomalies detected.',
        'Telemetry is within expected parameters.',
        'Voice pattern recognized. Welcome back, Boss.',
        'Processing your request through neural net core...',
    ];

    /* ─── Handle user command → Groq API + save to Supabase ─── */
    const handleSend = useCallback(
        async (text) => {
            setIsProcessing(true);

            try {
                let chatId = activeChatId;

                // Create a new chat if none is active
                if (!chatId) {
                    const newChat = await createChat('New Chat');
                    chatId = newChat.id;
                    setActiveChatId(chatId);
                    setChats((prev) => [newChat, ...prev]);
                }

                // Save user message to Supabase
                const userMsg = await insertMessage(chatId, 'user', text);
                setMessages((prev) => [...prev, userMsg]);

                // Call Groq with the full history
                const reply = await chatWithEDITH(messages, text);

                // Save assistant reply to Supabase
                const assistantMsg = await insertMessage(chatId, 'assistant', reply);
                setMessages((prev) => [...prev, assistantMsg]);

                // Auto-title the chat on the first message
                if (messages.length === 0) {
                    const newTitle = await autoTitleChat(chatId, text);
                    setChats((prev) =>
                        prev.map((c) => (c.id === chatId ? { ...c, title: newTitle } : c))
                    );
                }
            } catch (err) {
                console.error('Chat error:', err);
                // Fallback offline response (not saved)
                const fallback = FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)];
                setMessages((prev) => [
                    ...prev,
                    { id: Date.now(), role: 'assistant', content: `[OFFLINE] ${fallback}`, created_at: new Date().toISOString() },
                ]);
            } finally {
                setIsProcessing(false);
            }
        },
        [activeChatId, messages]
    );

    /* ─── Convert Supabase messages to Chat component format ─── */
    const displayMessages = [
        ...systemMessages,
        ...messages.map((m) => ({
            type: m.role === 'user' ? 'user' : m.role === 'assistant' ? 'edith' : 'system',
            text: m.content,
            time: new Date(m.created_at),
        })),
    ];

    /* ─── Helpers for display ─── */
    const pingColor = latency === 'ERR' ? 'orange' : parseInt(latency) > 200 ? 'orange' : 'green';
    const batteryColor = batteryLevel != null
        ? (batteryLevel > 50 ? 'green' : batteryLevel > 20 ? 'orange' : 'red')
        : 'cyan';

    return (
        <div className="hud-dashboard has-sidebar">
            {/* ========== CHAT SIDEBAR ========== */}
            <aside className={`chat-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
                <div className="sidebar-header">
                    <h2 className="sidebar-title">◈ CHAT LOG</h2>
                    <button
                        className="sidebar-new-btn"
                        onClick={handleNewChat}
                        title="New Chat"
                    >
                        + NEW
                    </button>
                </div>

                <div className="sidebar-chats">
                    {loadingChats ? (
                        <div className="sidebar-loading">Loading chats...</div>
                    ) : chats.length === 0 ? (
                        <div className="sidebar-empty">No chats yet. Start talking!</div>
                    ) : (
                        chats.map((chat) => (
                            <div
                                key={chat.id}
                                className={`sidebar-chat-item ${activeChatId === chat.id ? 'active' : ''}`}
                                onClick={() => handleSelectChat(chat.id)}
                            >
                                <span className="chat-item-icon">▸</span>
                                <span className="chat-item-title">{chat.title}</span>
                                <button
                                    className="chat-item-delete"
                                    onClick={(e) => handleDeleteChat(chat.id, e)}
                                    title="Delete Chat"
                                >
                                    ✕
                                </button>
                            </div>
                        ))
                    )}
                </div>

                <div className="sidebar-footer">
                    <div className="sidebar-user">
                        <span className="sidebar-user-dot" />
                        <span className="sidebar-user-name">{userName}</span>
                    </div>
                    <button className="sidebar-logout" onClick={onLogout}>
                        LOGOUT ⏻
                    </button>
                </div>
            </aside>

            {/* ========== MAIN CONTENT ========== */}
            <div className="hud-main-content">
                {/* Toggle sidebar button */}
                <button
                    className="sidebar-toggle"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
                >
                    {sidebarOpen ? '◂' : '▸'}
                </button>

                {/* Hex dot decoration */}
                <div className="hex-decoration" aria-hidden="true" />

                {/* ========== TOP BAR ========== */}
                <header className="hud-topbar" id="topbar">
                    <div className="topbar-brand">
                        <div className="status-dot" />
                        <h1
                            style={{ cursor: 'pointer' }}
                            onClick={() => onNavigate('landing')}
                            title="Back to Landing"
                        >
                            EDITH • {onlineStatus ? 'ONLINE' : 'OFFLINE'}
                        </h1>
                    </div>

                    <div className="topbar-indicators">
                        <div className="indicator">
                            <span className="indicator-label">HEAP</span>
                            <div className="indicator-bar">
                                <div className="indicator-bar-fill" style={{ width: `${cpuLoad}%` }} />
                            </div>
                            <span className="indicator-value">{Math.round(cpuLoad)}%</span>
                        </div>
                        <div className="indicator">
                            <span className="indicator-label">NET</span>
                            <div className="indicator-bar">
                                <div className="indicator-bar-fill" style={{ width: `${netLoad}%` }} />
                            </div>
                            <span className="indicator-value">{downlink !== '—' ? `${downlink} Mb/s` : '—'}</span>
                        </div>
                        <div className="mini-bar-graph" aria-hidden="true">
                            {[...Array(7)].map((_, i) => (
                                <div key={i} className="mini-bar" />
                            ))}
                        </div>
                    </div>

                    <div className="topbar-actions">
                        <button className="icon-btn" title="Settings" id="btn-settings">⚙</button>
                        <button className="icon-btn" title="Notifications" id="btn-notifications">🔔</button>
                    </div>
                </header>

                {/* ========== MAIN 3-COLUMN GRID ========== */}
                <main className="hud-main-grid">
                    {/* ── Left: SYSTEM ── */}
                    <section className="glass-panel" id="panel-system">
                        <div className="panel-header">
                            <span className="panel-header-icon">⬡</span>
                            <h2>System</h2>
                        </div>
                        <div className="data-row">
                            <span className="data-label">Uptime</span>
                            <span className="data-value cyan">{formatUptime(uptime)}</span>
                        </div>
                        <div className="data-row">
                            <span className="data-label">Mode</span>
                            <span className="data-value green">AUTONOMOUS</span>
                        </div>
                        <div className="data-row">
                            <span className="data-label">Status</span>
                            <span className={`data-value ${isProcessing ? 'orange' : 'green'}`}>
                                {isProcessing ? 'PROCESSING' : 'OPERATIONAL'}
                            </span>
                        </div>
                        <div className="data-row">
                            <span className="data-label">Auth</span>
                            <span className="data-value green">SUPABASE</span>
                        </div>
                        <div className="data-row">
                            <span className="data-label">Model</span>
                            <span className="data-value purple">LLaMA 3.1</span>
                        </div>
                    </section>

                    {/* ── Center: EDITH ── */}
                    <section className="glass-panel ai-core-panel" id="panel-ai-core">
                        <div className="panel-header">
                            <span className="panel-header-icon">◉</span>
                            <h2>EDITH</h2>
                        </div>
                        <AnimatedOrb size={200} fps={30} />
                        <div className={`ai-core-status ${isProcessing ? 'processing' : 'idle'}`}>
                            {isProcessing ? '◈ PROCESSING' : '◇ IDLE'}
                        </div>
                    </section>

                    {/* ── Right: TELEMETRY (REAL DATA) ── */}
                    <section className="glass-panel" id="panel-telemetry">
                        <div className="panel-header">
                            <span className="panel-header-icon">📊</span>
                            <h2>Telemetry</h2>
                            <span className="panel-header-live" style={{
                                fontSize: '0.6rem',
                                color: '#0f0',
                                marginLeft: 'auto',
                                letterSpacing: '0.15em',
                                animation: 'blink 1.5s infinite',
                            }}>● LIVE</span>
                        </div>
                        <div className="data-row">
                            <span className="data-label">JS Heap</span>
                            <span className="data-value cyan">{jsHeapMB} / {jsHeapLimitMB} MB</span>
                        </div>
                        <div className="data-row">
                            <span className="data-label">CPU Cores</span>
                            <span className="data-value cyan">{cpuCores || '—'}</span>
                        </div>
                        {deviceMemoryGB != null && (
                            <div className="data-row">
                                <span className="data-label">Device RAM</span>
                                <span className="data-value blue">~{deviceMemoryGB} GB</span>
                            </div>
                        )}
                        <div className="data-row">
                            <span className="data-label">Network</span>
                            <span className="data-value green">{networkType}</span>
                        </div>
                        <div className="data-row">
                            <span className="data-label">Downlink</span>
                            <span className="data-value cyan">{downlink !== '—' ? `${downlink} Mb/s` : '—'}</span>
                        </div>
                        <div className="data-row">
                            <span className="data-label">RTT</span>
                            <span className={`data-value ${rtt !== '—' && parseInt(rtt) > 200 ? 'orange' : 'green'}`}>
                                {rtt !== '—' ? `${rtt} ms` : '—'}
                            </span>
                        </div>
                        <div className="data-row">
                            <span className="data-label">Supabase Ping</span>
                            <span className={`data-value ${pingColor}`}>
                                {latency !== '—' && latency !== 'ERR' ? `${latency} ms` : latency}
                            </span>
                        </div>
                        {batteryLevel != null && (
                            <div className="data-row">
                                <span className="data-label">Battery</span>
                                <span className={`data-value ${batteryColor}`}>
                                    {batteryLevel}% {batteryCharging ? '⚡' : ''}
                                </span>
                            </div>
                        )}
                        <div className="data-row">
                            <span className="data-label">Page Load</span>
                            <span className="data-value cyan">{pageLoadTime !== '—' ? `${pageLoadTime} ms` : '—'}</span>
                        </div>
                        <div className="data-row">
                            <span className="data-label">Connection</span>
                            <span className={`data-value ${onlineStatus ? 'green' : 'red'}`}>
                                {onlineStatus ? 'ONLINE' : 'OFFLINE'}
                            </span>
                        </div>
                    </section>
                </main>

                {/* ========== COMM LOG + COMMAND BAR ========== */}
                <Chat messages={displayMessages} onSend={handleSend} />
            </div>
        </div>
    );
}

