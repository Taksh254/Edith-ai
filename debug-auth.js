// Debug authentication issues
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://cpzookbeubdhmbboucqb.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwem9va2JldWJkaG1iYm91Y3FiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMTcxNDAsImV4cCI6MjA4NzU5MzE0MH0.-VaeJrIJQacSETeA8j4204KntUFZ0X0_fprOEsN36Po";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuth() {
    console.log('Testing Supabase connection...');
    
    try {
        // Test basic connection
        const { data, error } = await supabase.from('profiles').select('count');
        console.log('Connection test:', { data, error });
        
        // Test signup
        console.log('Testing signup...');
        const { data: signupData, error: signupError } = await supabase.auth.signUp({
            email: 'test@example.com',
            password: 'test123456',
            options: {
                data: {
                    full_name: 'Test User'
                }
            }
        });
        console.log('Signup result:', { signupData, signupError });
        
        // Test login
        console.log('Testing login...');
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email: 'test@example.com',
            password: 'test123456'
        });
        console.log('Login result:', { loginData, loginError });
        
    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

testAuth();
