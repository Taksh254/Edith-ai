import React, { useState, useRef, useEffect } from 'react';

/**
 * Chat — Communication log + command input bar.
 * Renders a scrollable message log and a console-style input field.
 *
 * @param {{ messages: Array, onSend: function }} props
 */
export default function Chat({ messages = [], onSend }) {
    const [input, setInput] = useState('');
    const logEndRef = useRef(null);

    // Auto-scroll to newest message
    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = () => {
        const trimmed = input.trim();
        if (!trimmed) return;
        onSend(trimmed);
        setInput('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSend();
        }
    };

    const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    return (
        <>
            {/* --- Communication Log Panel --- */}
            <div className="glass-panel comm-log-panel" id="comm-log">
                <div className="panel-header">
                    <span className="panel-header-icon">📡</span>
                    <h2>Communication Log</h2>
                </div>
                <div className="comm-log-messages" role="log" aria-live="polite">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`comm-message ${msg.type}`}>
                            <span className="msg-timestamp">{formatTime(msg.time)}</span>
                            <span className={`msg-prefix ${msg.type}`}>
                                {msg.type === 'system'
                                    ? 'SYS'
                                    : msg.type === 'user'
                                        ? 'USR'
                                        : msg.type === 'edith'
                                            ? 'EDITH'
                                            : msg.type === 'warning'
                                                ? 'WARN'
                                                : 'ERR'}
                            </span>
                            <span className="msg-text">{msg.text}</span>
                        </div>
                    ))}
                    <div ref={logEndRef} />
                </div>
            </div>

            {/* --- Command Bar --- */}
            <div className="command-bar" id="command-bar">
                <span className="command-prompt">EDITH &gt;&gt;</span>
                <input
                    id="command-input"
                    className="command-input"
                    type="text"
                    placeholder="Enter command..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoComplete="off"
                    spellCheck="false"
                />
                <button
                    id="command-send"
                    className="command-send-btn"
                    onClick={handleSend}
                >
                    SEND
                </button>
            </div>
        </>
    );
}
