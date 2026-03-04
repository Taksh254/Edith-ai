import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import Landing from './Landing';
import Dashboard from './Dashboard';
import Login from './Login';
import Signup from './Signup';
import AuthTest from './AuthTest';

/**
 * App — Root component with URL-based routing + Supabase auth state.
 *
 * Routes:
 *   /          → Landing page
 *   /login     → Login page
 *   /signup    → Signup page
 *   /dashboard → HUD dashboard (requires auth)
 */

function getPageFromPath() {
    const path = window.location.pathname;
    if (path === '/login') return 'login';
    if (path === '/signup') return 'signup';
    if (path === '/dashboard') return 'dashboard';
    if (path === '/test') return 'test';  // Add test route
    return 'landing';
}

export default function App() {
    const [page, setPage] = useState(getPageFromPath);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    /* ── Listen for Supabase auth state changes ── */
    useEffect(() => {
        // Get current session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
        });

        // Listen for changes (login, logout, token refresh)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setSession(session);
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    /* Listen for browser back/forward buttons */
    useEffect(() => {
        const handlePop = () => setPage(getPageFromPath());
        window.addEventListener('popstate', handlePop);
        return () => window.removeEventListener('popstate', handlePop);
    }, []);

    /* Navigate by pushing URL + updating state */
    const handleNavigate = (target) => {
        const pathMap = {
            landing: '/',
            login: '/login',
            signup: '/signup',
            dashboard: '/dashboard',
            test: '/test',  // Add test route
        };
        const newPath = pathMap[target] || '/';
        window.history.pushState(null, '', newPath);
        setPage(target);
        window.scrollTo(0, 0);
    };

    /* ── Handle logout ── */
    const handleLogout = async () => {
        await supabase.auth.signOut();
        handleNavigate('landing');
    };

    /* ── Loading state ── */
    if (loading) return null;

    /* ── Protect dashboard route ── */
    if (page === 'dashboard' && !session) {
        // Redirect to login if not authenticated
        handleNavigate('login');
        return null;
    }

    switch (page) {
        case 'login':
            return <Login onNavigate={handleNavigate} />;
        case 'signup':
            return <Signup onNavigate={handleNavigate} />;
        case 'dashboard':
            return (
                <Dashboard
                    onNavigate={handleNavigate}
                    session={session}
                    onLogout={handleLogout}
                />
            );
        case 'test':
            return <AuthTest />;
        default:
            return <Landing onNavigate={handleNavigate} />;
    }
}
