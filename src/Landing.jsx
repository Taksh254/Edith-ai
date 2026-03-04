import React, { useState, useEffect, useRef, useCallback } from 'react';
import AnimatedOrb from './components/AnimatedOrb';
import './Landing.css';

/* ─── Custom hook: reveal on scroll via IntersectionObserver ─── */
function useScrollReveal(threshold = 0.15) {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    observer.unobserve(el); // only trigger once
                }
            },
            { threshold }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [threshold]);

    return [ref, visible];
}

/* ─── Reusable Feature Card with 3D Tilt ─── */
function FeatureCard({ icon, title, description }) {
    const cardRef = useRef(null);
    const rafRef = useRef(null);
    const tiltRef = useRef({ rotateX: 0, rotateY: 0, spotX: 50, spotY: 50, glareX: 50, glareY: 0 });
    const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0, spotX: 50, spotY: 50, glareX: 50, glareY: 0 });
    const [hovering, setHovering] = useState(false);

    const handleMouseMove = useCallback((e) => {
        const card = cardRef.current;
        if (!card) return;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        // Max 20° tilt for dramatic 3D effect
        const rotateY = ((x - centerX) / centerX) * 20;
        const rotateX = ((centerY - y) / centerY) * 20;
        const spotX = (x / rect.width) * 100;
        const spotY = (y / rect.height) * 100;

        // Glare position (moves opposite to tilt for realism)
        const glareX = (x / rect.width) * 100;
        const glareY = (y / rect.height) * 100;

        const newTilt = { rotateX, rotateY, spotX, spotY, glareX, glareY };
        tiltRef.current = newTilt;

        // Use rAF for smooth 60fps updates
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => {
            setTilt(tiltRef.current);
        });
    }, []);

    const handleMouseEnter = useCallback(() => setHovering(true), []);
    const handleMouseLeave = useCallback(() => {
        setHovering(false);
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        setTilt({ rotateX: 0, rotateY: 0, spotX: 50, spotY: 50, glareX: 50, glareY: 0 });
    }, []);

    // Cleanup rAF on unmount
    useEffect(() => {
        return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    }, []);

    return (
        /* Outer wrapper handles the pop-in animation so it doesn't conflict with 3D tilt */
        <div className="feature-card-wrapper">
            <div
                ref={cardRef}
                className={`feature-card ${hovering ? 'is-hovering' : ''}`}
                onMouseMove={handleMouseMove}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                style={{
                    transform: hovering
                        ? `perspective(800px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) translateZ(20px) scale3d(1.02, 1.02, 1.02)`
                        : 'perspective(800px) rotateX(0deg) rotateY(0deg) translateZ(0px) scale3d(1, 1, 1)',
                    transition: hovering
                        ? 'transform 0.08s ease-out, border-color 0.3s, box-shadow 0.3s'
                        : 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.3s, box-shadow 0.3s',
                }}
            >
                {/* Dynamic spotlight that follows cursor */}
                <div
                    className="feature-card-spotlight"
                    style={{
                        background: `radial-gradient(circle at ${tilt.spotX}% ${tilt.spotY}%, rgba(0,229,255,0.15) 0%, transparent 55%)`,
                        opacity: hovering ? 1 : 0,
                    }}
                />
                {/* Glare / reflection overlay */}
                <div
                    className="feature-card-glare"
                    style={{
                        background: `radial-gradient(ellipse at ${tilt.glareX}% ${tilt.glareY}%, rgba(255,255,255,0.10) 0%, transparent 70%)`,
                        opacity: hovering ? 1 : 0,
                    }}
                />
                <div className="feature-icon">{icon}</div>
                <h3 className="feature-title">{title}</h3>
                <p className="feature-desc">{description}</p>
            </div>
        </div>
    );
}

/* ─── Mock Dashboard Preview ─── */
function MockDashboard() {
    return (
        <div className="preview-mock">
            <div className="mock-topbar">
                <span className="mock-brand">EDITH • ONLINE</span>
                <div className="mock-dots">
                    <div className="mock-dot" />
                    <div className="mock-dot" />
                    <div className="mock-dot" />
                </div>
            </div>
            <div className="mock-grid">
                <div className="mock-panel">
                    <div className="mock-panel-title">SYSTEM</div>
                    <div className="mock-line filled" />
                    <div className="mock-line half" />
                    <div className="mock-line filled" />
                </div>
                <div className="mock-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div className="mock-panel-title">EDITH CORE</div>
                    <div className="mock-orb-center" />
                    <div className="mock-line short" style={{ margin: '4px auto 0' }} />
                </div>
                <div className="mock-panel">
                    <div className="mock-panel-title">TELEMETRY</div>
                    <div className="mock-line filled" />
                    <div className="mock-line half" />
                    <div className="mock-line short" />
                </div>
            </div>
            <div className="mock-chat">
                <div className="mock-chat-line">
                    <span className="mock-chat-tag">SYS</span>
                    <div className="mock-chat-text" />
                </div>
                <div className="mock-chat-line">
                    <span className="mock-chat-tag" style={{ color: 'var(--neon-purple)' }}>EDITH</span>
                    <div className="mock-chat-text" style={{ width: '80%' }} />
                </div>
                <div className="mock-chat-line">
                    <span className="mock-chat-tag" style={{ color: 'var(--neon-blue)' }}>USR</span>
                    <div className="mock-chat-text" style={{ width: '50%' }} />
                </div>
            </div>
        </div>
    );
}

/* ─── Main Landing Page ─── */
export default function Landing({ onNavigate }) {
    const [scrolled, setScrolled] = useState(false);
    const [scrollY, setScrollY] = useState(0);
    const [headerRef, headerVisible] = useScrollReveal();

    useEffect(() => {
        const handleScroll = () => {
            const y = window.scrollY;
            setScrolled(y > 50);
            setScrollY(y);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // ── Scroll-driven parallax for hero exit ──
    // Starts at scroll 0, fully exited by ~600px scroll
    const heroProgress = Math.min(scrollY / 600, 1);
    const textExitX = -heroProgress * 120;   // slides left up to -120px
    const orbExitX = heroProgress * 120;   // slides right up to +120px
    const heroOpacity = 1 - heroProgress; // fades to 0 completely

    return (
        <div className="landing-page">
            {/* Background effects */}
            <div className="landing-bg-grid" />
            <div className="landing-bg-orb orb-1" />
            <div className="landing-bg-orb orb-2" />
            <div className="landing-bg-orb orb-3" />

            {/* ========== NAVBAR ========== */}
            <nav className={`landing-nav ${scrolled ? 'scrolled' : ''}`}>
                <div className="nav-logo">
                    <AnimatedOrb size={32} fps={30} />
                    <span className="nav-logo-text">EDITH</span>
                </div>
                <ul className="nav-links">
                    <li><a href="#features">Features</a></li>
                    <li><a href="#preview">Preview</a></li>
                    <li>
                        <a
                            href="#"
                            className="nav-cta"
                            onClick={(e) => { e.preventDefault(); onNavigate('dashboard'); }}
                        >
                            Launch HUD
                        </a>
                    </li>
                </ul>
            </nav>

            {/* ========== HERO — STICKY WITH SCROLL SPACER ========== */}
            <div className="hero-scroll-container">
                <section className="hero-section hero-sticky" id="hero">
                    <div className="hero-container">
                        <div
                            className="hero-content"
                            style={{
                                transform: `translateX(${textExitX}px)`,
                                opacity: heroOpacity,
                                transition: 'none',
                                willChange: 'transform, opacity',
                            }}
                        >
                            <div className="hero-badge">
                                <div className="hero-badge-dot" />
                                Stark Industries • AI Division
                            </div>

                            <h1 className="hero-title">
                                <span>E.D.I.T.H.</span>
                            </h1>

                            <p className="hero-subtitle">
                                Your <strong>Personal AI Control System</strong>.
                                A next-generation neural interface designed for
                                speed, precision, and total situational awareness.
                            </p>

                            <div className="hero-buttons">
                                <button
                                    className="btn-primary"
                                    onClick={() => onNavigate('dashboard')}
                                >
                                    Get Started
                                </button>
                                <button
                                    className="btn-secondary"
                                    onClick={() => onNavigate('login')}
                                >
                                    Login
                                </button>
                            </div>

                            <div className="hero-stats">
                                <div className="hero-stat">
                                    <span className="hero-stat-value">&lt; 0.3s</span>
                                    <span className="hero-stat-label">Response Time</span>
                                </div>
                                <div className="hero-stat">
                                    <span className="hero-stat-value">99.9%</span>
                                    <span className="hero-stat-label">Uptime</span>
                                </div>
                                <div className="hero-stat">
                                    <span className="hero-stat-value">256-bit</span>
                                    <span className="hero-stat-label">Encryption</span>
                                </div>
                            </div>
                        </div>

                        <div
                            className="hero-orb-wrapper"
                            style={{
                                transform: `translateX(${orbExitX}px)`,
                                opacity: heroOpacity,
                                transition: 'none',
                                willChange: 'transform, opacity',
                            }}
                        >
                            <div className="hero-orb-container">
                                <span className="hero-orb-label">neural.core.active</span>
                                <span className="hero-orb-label">quantum.sync</span>
                                <span className="hero-orb-label">secure.link</span>
                                <span className="hero-orb-label">ai.ready</span>
                                <div className="hero-orb-ring-1" />
                                <div className="hero-orb-ring-2" />
                                <div className="hero-orb-ring-3" />
                                <AnimatedOrb size={200} fps={30} />
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {/* ========== FEATURES SECTION ========== */}
            <section className="features-section" id="features">
                <div className="section-header">
                    <span className="section-tag">// capabilities</span>
                    <h2 className="section-title">Built For The Future</h2>
                    <p className="section-desc">
                        Powered by advanced neural networks and designed with
                        a premium sci-fi interface you'll actually want to use.
                    </p>
                </div>

                <div className="features-grid">
                    <FeatureCard
                        index={0}
                        icon="⚡"
                        title="Fast AI Responses"
                        description="Powered by Groq's LPU inference engine. Sub-second response times for instant answers and decisions."
                    />
                    <FeatureCard
                        index={1}
                        icon="🖥"
                        title="Sci-Fi HUD Interface"
                        description="A Stark Industries–grade control dashboard with live telemetry, glassmorphism panels, and neon aesthetics."
                    />
                    <FeatureCard
                        index={2}
                        icon="🧠"
                        title="Smart Assistant"
                        description="Context-aware AI that remembers your conversation, understands intent, and provides precise responses."
                    />
                    <FeatureCard
                        index={3}
                        icon="🔒"
                        title="Secure System"
                        description="End-to-end encrypted communications. Your data stays private with military-grade security protocols."
                    />
                </div>
            </section>

            {/* ========== PREVIEW SECTION ========== */}
            <section className="preview-section" id="preview">
                <div className="preview-container">
                    <div className="preview-content">
                        <span className="section-tag">// interface preview</span>
                        <h2 className="section-title">Command Center at Your Fingertips</h2>
                        <p className="preview-text">
                            EDITH provides a real-time control dashboard designed for
                            maximum efficiency. Monitor system telemetry, communicate
                            with the AI core, and execute commands — all from one
                            cinematic interface.
                        </p>
                        <ul className="preview-list">
                            <li><span className="preview-list-icon">◈</span> Real-time system monitoring & telemetry</li>
                            <li><span className="preview-list-icon">◈</span> AI-powered conversational interface</li>
                            <li><span className="preview-list-icon">◈</span> Animated AI core with visual state feedback</li>
                            <li><span className="preview-list-icon">◈</span> Console-style command execution</li>
                            <li><span className="preview-list-icon">◈</span> Responsive across all screen sizes</li>
                        </ul>
                        <div style={{ marginTop: '12px' }}>
                            <button
                                className="btn-primary"
                                onClick={() => onNavigate('dashboard')}
                            >
                                Launch Dashboard
                            </button>
                        </div>
                    </div>
                    <MockDashboard />
                </div>
            </section>

            {/* ========== FOOTER ========== */}
            <footer className="landing-footer">
                <div className="footer-content">
                    <div className="footer-brand">
                        <span className="footer-logo">EDITH</span>
                        <span className="footer-desc">Even Dead, I'm The Hero</span>
                    </div>
                    <p className="footer-copy">
                        © 2026 <span>Stark Industries</span> • Advanced AI Division • All rights reserved
                    </p>
                </div>
            </footer>
        </div>
    );
}
