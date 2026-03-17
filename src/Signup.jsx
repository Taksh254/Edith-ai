import React, { useState } from 'react';
import { supabase } from './lib/supabase';
import AnimatedOrb from './components/AnimatedOrb';
import './Login.css'; /* Reuses the same auth page styles */

export default function Signup({ onNavigate }) {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [status, setStatus] = useState('idle');       // idle | scanning | granted
    const [scanText, setScanText] = useState('');
    const [error, setError] = useState('');

    /* ── Signup via Supabase Auth ── */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!fullName || !email || !password || !confirmPassword) {
            setError('ALL FIELDS REQUIRED');
            return;
        }
        if (password.length < 6) {
            setError('PASSKEY MUST BE AT LEAST 6 CHARACTERS');
            return;
        }
        if (password !== confirmPassword) {
            setError('PASSKEYS DO NOT MATCH');
            return;
        }

        setStatus('scanning');
        setScanText('CREATING NEURAL PROFILE...');

        try {
            console.log('Attempting signup with:', { email, fullName });
            
            const { data, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                    },
                },
            });

            console.log('Signup response:', { data, authError });

            if (authError) {
                console.error('Signup error:', authError);
                setStatus('idle');
                
                // Handle specific error messages
                if (authError.message.includes('User already registered')) {
                    setError('EMAIL ALREADY REGISTERED');
                } else if (authError.message.includes('Password should be')) {
                    setError('PASSKEY TOO WEAK - USE 6+ CHARACTERS');
                } else {
                    setError(authError.message.toUpperCase());
                }
                return;
            }

            setScanText('GENERATING ENCRYPTION KEYS...');

            // Check if email confirmation is required
            const needsConfirmation = data?.user?.identities?.length === 0 ||
                !data?.session;

            console.log('Email confirmation required:', needsConfirmation);

            setTimeout(() => {
                setScanText(needsConfirmation
                    ? 'CHECK EMAIL FOR CONFIRMATION LINK'
                    : 'REGISTERING IN EDITH MAINFRAME');
            }, 600);

            setTimeout(() => {
                setStatus('granted');
                setScanText(needsConfirmation
                    ? 'CONFIRMATION EMAIL SENT'
                    : 'ACCOUNT INITIALIZED');
            }, 1200);

            setTimeout(() => {
                onNavigate('login');
            }, 2800);
        } catch (err) {
            console.error('Unexpected signup error:', err);
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

            {/* Main signup card */}
            <div className="login-container">
                {/* Terminal readout (left side) */}
                <div className="login-terminal">
                    <div className="terminal-header">
                        <span className="terminal-dot red" />
                        <span className="terminal-dot yellow" />
                        <span className="terminal-dot green" />
                        <span className="terminal-title">EDITH_REGISTRATION</span>
                    </div>
                    <div className="terminal-body">
                        <div className="terminal-line">&gt; EDITH Registration Portal v4.7.2</div>
                        <div className="terminal-line">&gt; Secure channel established</div>
                        <div className="terminal-line">&gt; Auth provider: Supabase</div>
                        <div className="terminal-line">&gt; Identity verification: READY</div>
                        <div className="terminal-line">&gt; Awaiting new user credentials...</div>
                        <span className="terminal-cursor">_</span>
                    </div>
                </div>

                {/* Signup Card */}
                <div className="login-card">
                    {/* Card glow edges */}
                    <div className="login-card-edge top" />
                    <div className="login-card-edge bottom" />

                    {/* Orb */}
                    <div className="login-orb-section">
                        <AnimatedOrb size={80} fps={30} />
                    </div>

                    {/* Title */}
                    <h1 className="login-title">CREATE ACCOUNT</h1>
                    <p className="login-subtitle">Initialize your AI access credentials</p>

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
                                <span className="label-icon">◈</span> FULL NAME
                            </label>
                            <input
                                type="text"
                                className="login-input"
                                placeholder="Enter your full name"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                autoComplete="name"
                                disabled={status !== 'idle'}
                            />
                            <div className="input-glow-line" />
                        </div>

                        <div className="login-field">
                            <label className="login-label">
                                <span className="label-icon">◈</span> EMAIL
                            </label>
                            <input
                                type="email"
                                className="login-input"
                                placeholder="Enter your email address"
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
                                placeholder="Create a security passkey (min 6 chars)"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="new-password"
                                disabled={status !== 'idle'}
                            />
                            <div className="input-glow-line" />
                        </div>

                        <div className="login-field">
                            <label className="login-label">
                                <span className="label-icon">◈</span> CONFIRM PASSKEY
                            </label>
                            <input
                                type="password"
                                className="login-input"
                                placeholder="Re-enter security passkey"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                autoComplete="new-password"
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
                                    CREATE ACCOUNT
                                </>
                            )}
                            {status === 'scanning' && 'INITIALIZING...'}
                            {status === 'granted' && '◈ ACCOUNT CREATED'}
                        </button>
                    </form>

                    {/* Links */}
                    <div className="login-links">
                        <span className="login-link-text">Already have clearance?</span>
                        <button
                            className="login-link"
                            onClick={() => onNavigate('login')}
                        >
                            Login →
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
