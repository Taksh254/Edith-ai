import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import { executeCommand } from './commands.js';

dotenv.config();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

/* ═══════════════════════════════════════════════
   MONGODB CONNECTION
   ═══════════════════════════════════════════════ */

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/edith';

mongoose
    .connect(MONGO_URI)
    .then(() => console.log('   MongoDB: ✓ connected'))
    .catch((err) => {
        console.error('   MongoDB: ✗ connection failed —', err.message);
        console.error('   Make sure MongoDB is running and MONGO_URI is set in .env\n');
    });

/* ═══════════════════════════════════════════════
   AUTH ROUTES
   ═══════════════════════════════════════════════ */

app.use('/api/auth', authRoutes);

/* ═══════════════════════════════════════════════
   GROQ AI CHAT
   ═══════════════════════════════════════════════ */

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

const SYSTEM_PROMPT = `You are EDITH (Even Dead, I'm The Hero), a highly advanced AI assistant built by Stark Industries.
Your personality is fast, concise, professional, and extremely helpful — inspired by Tony Stark's technology.
You prioritize efficiency and direct answers. You do not use filler words.
Keep responses short and punchy unless detailed information is explicitly requested.
You speak in a calm, confident, slightly witty tone — like a premium AI interface.
Always stay in character as EDITH.`;

/* ─── Chat History (in-memory per session) ─── */
let conversationHistory = [
    { role: 'system', content: SYSTEM_PROMPT },
];

/* ─── POST /api/chat ─── */
app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({ error: 'Message is required.' });
        }

        // 1. Check if the message is a local system command
        const cmdResult = await executeCommand(message);
        if (cmdResult) {
            // Add to history so EDITH remembers it
            conversationHistory.push({ role: 'user', content: message });
            conversationHistory.push({ role: 'assistant', content: cmdResult });
            
            // Return command output immediately
            return res.json({ reply: cmdResult });
        }

        // Add user message to history
        conversationHistory.push({ role: 'user', content: message });

        // Keep history manageable (system + last 20 messages)
        if (conversationHistory.length > 22) {
            conversationHistory = [
                conversationHistory[0], // system prompt
                ...conversationHistory.slice(-20),
            ];
        }

        const chatCompletion = await groq.chat.completions.create({
            messages: conversationHistory,
            model: 'llama-3.1-8b-instant',
            temperature: 0.7,
            max_tokens: 1024,
            top_p: 1,
            stream: false,
        });

        const reply = chatCompletion.choices[0].message.content;

        // Add assistant reply to history
        conversationHistory.push({ role: 'assistant', content: reply });

        res.json({ reply });
    } catch (error) {
        console.error('Groq API Error:', error.message);
        res.status(500).json({
            error: 'EDITH encountered a system error.',
            details: error.message,
        });
    }
});

/* ─── POST /api/reset ─── */
app.post('/api/reset', (req, res) => {
    conversationHistory = [
        { role: 'system', content: SYSTEM_PROMPT },
    ];
    res.json({ status: 'Conversation history cleared.' });
});

/* ─── Health Check ─── */
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ONLINE',
        ai: 'EDITH',
        model: 'llama-3.1-8b-instant',
        db: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED',
        uptime: process.uptime(),
    });
});

app.listen(PORT, () => {
    console.log(`\n⚡ EDITH Backend Server running on http://localhost:${PORT}`);
    console.log(`   Model: llama-3.1-8b-instant`);
    console.log(`   API Key: ${process.env.GROQ_API_KEY ? '✓ loaded' : '✗ MISSING — set GROQ_API_KEY in .env'}`);
    console.log(`   JWT Secret: ${process.env.JWT_SECRET ? '✓ loaded' : '✗ MISSING — set JWT_SECRET in .env'}\n`);
});
