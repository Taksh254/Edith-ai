import React, { useState } from 'react';
import { supabase } from './lib/supabase';

export default function AuthTest() {
    const [email, setEmail] = useState('test@example.com');
    const [password, setPassword] = useState('test123456');
    const [fullName, setFullName] = useState('Test User');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);

    const log = (msg, error = false) => {
        console.log(msg);
        setMessage(msg);
        setIsError(error);
    };

    const testConnection = async () => {
        setLoading(true);
        try {
            log('Testing database connection...');
            
            // Test if tables exist
            const { data, error } = await supabase.from('profiles').select('count').single();
            
            if (error) {
                log(`❌ Database Error: ${error.message}`, true);
                if (error.message.includes('does not exist')) {
                    log('⚠️ SOLUTION: Run supabase-setup.sql in your Supabase dashboard!', true);
                }
            } else {
                log('✅ Database connection successful!');
            }
        } catch (err) {
            log(`❌ Connection Error: ${err.message}`, true);
        }
        setLoading(false);
    };

    const handleSignup = async () => {
        setLoading(true);
        try {
            log('Attempting signup...');
            
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { full_name: fullName }
                }
            });

            console.log('Signup result:', { data, error });

            if (error) {
                log(`❌ Signup Failed: ${error.message}`, true);
            } else {
                log('✅ Signup initiated!');
                if (data.user && !data.session) {
                    log('📧 Email confirmation required - check your email');
                } else if (data.session) {
                    log('✅ Account created and logged in!');
                    setTimeout(() => window.location.reload(), 2000);
                }
            }
        } catch (err) {
            log(`❌ Signup Error: ${err.message}`, true);
        }
        setLoading(false);
    };

    const handleLogin = async () => {
        setLoading(true);
        try {
            log('Attempting login...');
            
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            console.log('Login result:', { data, error });

            if (error) {
                log(`❌ Login Failed: ${error.message}`, true);
                if (error.message.includes('Invalid login')) {
                    log('💡 Try signing up first, or check email/password');
                }
            } else {
                log('✅ Login successful!');
                setTimeout(() => window.location.reload(), 2000);
            }
        } catch (err) {
            log(`❌ Login Error: ${err.message}`, true);
        }
        setLoading(false);
    };

    const handleLogout = async () => {
        setLoading(true);
        try {
            await supabase.auth.signOut();
            log('✅ Logged out successfully!');
            setTimeout(() => window.location.reload(), 1000);
        } catch (err) {
            log(`❌ Logout Error: ${err.message}`, true);
        }
        setLoading(false);
    };

    return (
        <div style={{ 
            padding: '20px', 
            fontFamily: 'monospace', 
            background: '#000', 
            color: '#0f0',
            minHeight: '100vh'
        }}>
            <h1>🤖 E.D.I.T.H. Authentication Test</h1>
            
            <div style={{ 
                background: '#111', 
                padding: '15px', 
                margin: '10px 0', 
                border: '1px solid #0f0' 
            }}>
                <h3>Environment Check</h3>
                <p>Supabase URL: {import.meta.env.VITE_SUPABASE_URL ? '✅ Loaded' : '❌ Missing'}</p>
                <p>Supabase Key: {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Loaded' : '❌ Missing'}</p>
                <button 
                    onClick={testConnection}
                    disabled={loading}
                    style={{ 
                        background: '#333', 
                        color: '#0f0', 
                        border: '1px solid #0f0', 
                        padding: '10px',
                        cursor: 'pointer'
                    }}
                >
                    {loading ? 'Testing...' : 'Test Database Connection'}
                </button>
            </div>

            <div style={{ 
                background: '#111', 
                padding: '15px', 
                margin: '10px 0', 
                border: '1px solid #0f0' 
            }}>
                <h3>Authentication Test</h3>
                
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ 
                        background: '#222', 
                        color: '#0f0', 
                        border: '1px solid #0f0', 
                        padding: '5px',
                        margin: '5px',
                        width: '300px'
                    }}
                />
                <br />
                
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ 
                        background: '#222', 
                        color: '#0f0', 
                        border: '1px solid #0f0', 
                        padding: '5px',
                        margin: '5px',
                        width: '300px'
                    }}
                />
                <br />
                
                <input
                    type="text"
                    placeholder="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    style={{ 
                        background: '#222', 
                        color: '#0f0', 
                        border: '1px solid #0f0', 
                        padding: '5px',
                        margin: '5px',
                        width: '300px'
                    }}
                />
                <br />
                
                <button 
                    onClick={handleSignup}
                    disabled={loading}
                    style={{ 
                        background: '#333', 
                        color: '#0f0', 
                        border: '1px solid #0f0', 
                        padding: '10px',
                        margin: '5px',
                        cursor: 'pointer'
                    }}
                >
                    {loading ? 'Signing up...' : 'Test Signup'}
                </button>
                
                <button 
                    onClick={handleLogin}
                    disabled={loading}
                    style={{ 
                        background: '#333', 
                        color: '#0f0', 
                        border: '1px solid #0f0', 
                        padding: '10px',
                        margin: '5px',
                        cursor: 'pointer'
                    }}
                >
                    {loading ? 'Logging in...' : 'Test Login'}
                </button>
                
                <button 
                    onClick={handleLogout}
                    disabled={loading}
                    style={{ 
                        background: '#333', 
                        color: '#0f0', 
                        border: '1px solid #0f0', 
                        padding: '10px',
                        margin: '5px',
                        cursor: 'pointer'
                    }}
                >
                    {loading ? 'Logging out...' : 'Test Logout'}
                </button>
            </div>

            <div style={{ 
                background: isError ? '#300' : '#030', 
                padding: '15px', 
                margin: '10px 0', 
                border: `1px solid ${isError ? '#f00' : '#0f0'}` 
            }}>
                <h3>Status</h3>
                <pre style={{ whiteSpace: 'pre-wrap' }}>{message}</pre>
            </div>

            <div style={{ fontSize: '12px', opacity: '0.7' }}>
                <p>💡 Tips:</p>
                <ul>
                    <li>Check browser console (F12) for detailed errors</li>
                    <li>If database fails, run supabase-setup.sql in Supabase dashboard</li>
                    <li>If login fails, try signing up first</li>
                    <li>Check email for confirmation link if enabled</li>
                </ul>
            </div>
        </div>
    );
}
