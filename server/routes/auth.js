import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

/* ── Helper: generate JWT ── */
function generateToken(user) {
    return jwt.sign(
        { id: user._id, email: user.email, name: user.name },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
}

/* ══════════════════════════════════════════════
   POST /api/auth/signup
   ══════════════════════════════════════════════ */
router.post('/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        /* ── Validate inputs ── */
        if (!name || !email || !password) {
            return res.status(400).json({
                error: 'All fields are required (name, email, password).',
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                error: 'Password must be at least 6 characters.',
            });
        }

        /* ── Check if user already exists ── */
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({
                error: 'An account with this email already exists.',
            });
        }

        /* ── Create user (password is hashed via pre-save hook) ── */
        const user = await User.create({ name, email, password });

        /* ── Generate token ── */
        const token = generateToken(user);

        res.status(201).json({
            message: 'Account created successfully.',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
        });
    } catch (error) {
        console.error('Signup Error:', error.message);

        /* Handle Mongoose duplicate key error */
        if (error.code === 11000) {
            return res.status(400).json({
                error: 'An account with this email already exists.',
            });
        }

        res.status(500).json({
            error: 'Server error during registration.',
        });
    }
});

/* ══════════════════════════════════════════════
   POST /api/auth/login
   ══════════════════════════════════════════════ */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        /* ── Validate inputs ── */
        if (!email || !password) {
            return res.status(400).json({
                error: 'Email and password are required.',
            });
        }

        /* ── Find user ── */
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({
                error: 'Invalid credentials.',
            });
        }

        /* ── Compare password ── */
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                error: 'Invalid credentials.',
            });
        }

        /* ── Generate token ── */
        const token = generateToken(user);

        res.json({
            message: 'Login successful.',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
        });
    } catch (error) {
        console.error('Login Error:', error.message);
        res.status(500).json({
            error: 'Server error during login.',
        });
    }
});

/* ══════════════════════════════════════════════
   GET /api/auth/me  (protected — verify token)
   ══════════════════════════════════════════════ */
router.get('/me', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided.' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        res.json({ user });
    } catch (error) {
        res.status(401).json({ error: 'Invalid or expired token.' });
    }
});

export default router;
