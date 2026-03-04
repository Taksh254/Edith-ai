/**
 * Groq AI Chat — calls Groq's OpenAI-compatible API directly from the browser.
 *
 * Updated to work PER-CHAT (no global history).
 * Each chat sends its own message history from Supabase.
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

const SYSTEM_PROMPT = `You are EDITH (Even Dead, I'm The Hero), a highly advanced AI assistant built by Stark Industries.
Your personality is fast, concise, professional, and extremely helpful — inspired by Tony Stark's technology.
You prioritize efficiency and direct answers. You do not use filler words.
Keep responses short and punchy unless detailed information is explicitly requested.
You speak in a calm, confident, slightly witty tone — like a premium AI interface.
Always stay in character as EDITH.`;

/**
 * Send a message to Groq with the full chat history.
 * @param {Array<{role: string, content: string}>} messageHistory — all previous messages in this chat
 * @param {string} userMessage — the new user message
 * @returns {Promise<string>} — EDITH's reply text
 */
export async function chatWithEDITH(messageHistory, userMessage) {
    if (!GROQ_API_KEY) {
        throw new Error('GROQ API key is missing. Set VITE_GROQ_API_KEY in .env');
    }

    // Build messages array: system prompt + history + new message
    const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messageHistory.map((m) => ({ role: m.role, content: m.content })),
        { role: 'user', content: userMessage },
    ];

    // Keep manageable (system + last 20 messages)
    const trimmed = messages.length > 22
        ? [messages[0], ...messages.slice(-20)]
        : messages;

    const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'llama-3.1-8b-instant',
            messages: trimmed,
            temperature: 0.7,
            max_tokens: 1024,
            top_p: 1,
            stream: false,
        }),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `Groq API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}
