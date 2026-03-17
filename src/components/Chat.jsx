import React, { useState } from 'react';

/**
 * Chat — Communication log + command input bar.
 * Renders a scrollable message log and a console-style input field.
 *
 * @param {{ messages: Array, onSend: function }} props
 */
export default function Chat({ messages = [], onSend, height = 220, onResize }) {
    const [input, setInput] = useState('');

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

    // Vertical resize handler
    const handleMouseDown = (e) => {
        const startY = e.clientY;
        const startHeight = height;

        const handleMouseMove = (moveEvent) => {
            const delta = startY - moveEvent.clientY;
            onResize(Math.max(100, Math.min(600, startHeight + delta)));
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    return (
        <>
            {/* --- Vertical Resizer Handle --- */}
            <div className="resizer-v" onMouseDown={handleMouseDown} />

            {/* --- Communication Log Panel --- */}
            <div className="glass-panel comm-log-panel" id="comm-log" style={{ height: `${height}px`, maxHeight: 'none' }}>
                <div className="panel-header">
                    <span className="panel-header-icon">📡</span>
                    <h2>Communication Log</h2>
                </div>
                <div className="comm-log-messages" role="log" aria-live="polite" style={{ maxHeight: 'none' }}>
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
