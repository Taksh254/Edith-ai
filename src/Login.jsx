import React, { useState } from 'react';
import { supabase } from './lib/supabase';
import AnimatedOrb from './components/AnimatedOrb';
import './Login.css';

export default function Login({ onNavigate }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [status, setStatus] = useState('idle');       // idle | scanning | granted | denied
    const [scanText, setScanText] = useState('');
    const [error, setError] = useState('');

    /* ── Login via Supabase Auth ── */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('ALL FIELDS REQUIRED');
            return;
        }

        setStatus('scanning');
        setScanText('VERIFYING CREDENTIALS...');

        try {
            console.log('Attempting login with:', email);
            
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            console.log('Login response:', { data, authError });

            if (authError) {
                console.error('Login error:', authError);
                setStatus('idle');
                
                // Handle specific error messages
                if (authError.message.includes('Invalid login credentials')) {
                    setError('INVALID EMAIL OR PASSKEY');
                } else if (authError.message.includes('Email not confirmed')) {
                    setError('PLEASE CONFIRM YOUR EMAIL FIRST');
                } else {
                    setError(authError.message.toUpperCase());
                }
                return;
            }

            if (!data?.user) {
                setStatus('idle');
                setError('LOGIN FAILED - NO USER DATA');
                return;
            }

            setScanText('BIOMETRIC MATCH CONFIRMED');

            setTimeout(() => {
                setScanText('CLEARANCE LEVEL: ALPHA');
            }, 600);

            setTimeout(() => {
                setStatus('granted');
                setScanText('ACCESS GRANTED');
            }, 1200);

            setTimeout(() => {
                onNavigate('dashboard');
            }, 2000);
        } catch (err) {
            console.error('Unexpected login error:', err);
            setStatus('idle');
            setError('CONNECTION TO EDITH MAINFRAME FAILED');
        }
    };

    return (
        <div className="login-page">
            {/* Background effects */}
            <div className="login-bg-grid" />
            <div className="login-bg-orb login-orb-1" />
            <div className="login-bg-orb login-orb-2" />

            {/* Main login card */}
            <div className="login-container">
                {/* Terminal readout (left side) */}
                <div className="login-terminal">
                    <div className="terminal-header">
                        <span className="terminal-dot red" />
                        <span className="terminal-dot yellow" />
                        <span className="terminal-dot green" />
                        <span className="terminal-title">EDITH_SECURE_TERMINAL</span>
                    </div>
                    <div className="terminal-body">
                        <div className="terminal-line">&gt; Initializing EDITH secure portal...</div>
                        <div className="terminal-line">&gt; Encryption: AES-256-GCM active</div>
                        <div className="terminal-line">&gt; Neural firewall: ONLINE</div>
                        <div className="terminal-line">&gt; Auth provider: Supabase</div>
                        <div className="terminal-line">&gt; Awaiting user authentication...</div>
                        <span className="terminal-cursor">_</span>
                    </div>
                </div>

                {/* Login Card */}
                <div className="login-card">
                    {/* Card glow edges */}
                    <div className="login-card-edge top" />
                    <div className="login-card-edge bottom" />

                    {/* Orb */}
                    <div className="login-orb-section">
                        <AnimatedOrb size={90} fps={30} />
                    </div>

                    {/* Title */}
                    <h1 className="login-title">E.D.I.T.H.</h1>
                    <p className="login-subtitle">Secure Access to AI Control System</p>

                    {/* Error message */}
                    {error && (
                        <div className="login-scan-status login-error">
                            <span className="scan-dot error-dot" />
                            {error}
                        </div>
                    )}

                    {/* Scan status line */}
                    {status !== 'idle' && (
                        <div className={`login-scan-status ${status}`}>
                            <span className="scan-dot" />
                            {scanText}
                        </div>
                    )}

                    {/* Form */}
                    <form className="login-form" onSubmit={handleSubmit}>
                        <div className="login-field">
                            <label className="login-label">
                                <span className="label-icon">◈</span> IDENTIFIER
                            </label>
                            <input
                                type="text"
                                className="login-input"
                                placeholder="Enter email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                                disabled={status !== 'idle'}
                            />
                            <div className="input-glow-line" />
                        </div>

                        <div className="login-field">
                            <label className="login-label">
                                <span className="label-icon">◈</span> PASSKEY
                            </label>
                            <input
                                type="password"
                                className="login-input"
                                placeholder="Enter security passkey"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="current-password"
                                disabled={status !== 'idle'}
                            />
                            <div className="input-glow-line" />
                        </div>

                        <button
                            type="submit"
                            className={`login-btn ${status !== 'idle' ? 'processing' : ''}`}
                            disabled={status !== 'idle'}
                        >
                            {status === 'idle' && (
                                <>
                                    <span className="btn-icon">⟐</span>
                                    AUTHENTICATE
                                </>
                            )}
                            {status === 'scanning' && 'SCANNING...'}
                            {status === 'granted' && '◈ ACCESS GRANTED'}
                        </button>
                    </form>

                    {/* Links */}
                    <div className="login-links">
                        <button
                            className="login-link"
                            onClick={() => onNavigate('landing')}
                        >
                            ← Back to Home
                        </button>
                        <span className="login-link-separator">|</span>
                        <button
                            className="login-link"
                            onClick={() => onNavigate('signup')}
                        >
                            Create Account
                        </button>
                    </div>

                    {/* Corner decorations */}
                    <div className="login-corner tl" />
                    <div className="login-corner tr" />
                    <div className="login-corner bl" />
                    <div className="login-corner br" />
                </div>
            </div>

            {/* Footer classification */}
            <div className="login-footer-tag">
                STARK INDUSTRIES • CLASSIFICATION: TOP SECRET • EDITH v4.7.2
            </div>
        </div>
    );
}
