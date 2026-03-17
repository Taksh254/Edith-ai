/**
 * ElevenLabs Text-to-Speech — converts EDITH's replies into spoken audio.
 *
 * Uses the ElevenLabs v1 TTS API with a custom voice cloned in Voice Lab.
 * Voice ID: 6xqa1WbOXVQ0gtnAqv9f  (EDITH voice)
 *
 * Docs: https://elevenlabs.io/docs/api-reference/text-to-speech
 */

const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;
const VOICE_ID = '6xqa1WbOXVQ0gtnAqv9f';
const API_URL = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`;

// Keep a reference to the currently playing audio so we can stop it
let currentAudio = null;

/**
 * Convert text to speech using ElevenLabs and play the audio.
 * @param {string} text — The text EDITH should speak
 * @param {object} [options] — Optional voice settings overrides
 * @param {number} [options.stability]   — Voice stability (0-1, default 0.5)
 * @param {number} [options.similarity]  — Clarity + similarity boost (0-1, default 0.75)
 * @param {number} [options.style]       — Style exaggeration (0-1, default 0.0)
 * @returns {Promise<HTMLAudioElement>}  — The audio element playing the speech
 */
export async function speakAsEDITH(text, options = {}) {
    if (!ELEVENLABS_API_KEY) {
        console.warn('[EDITH Voice] ElevenLabs API key missing. Set VITE_ELEVENLABS_API_KEY in .env');
        return null;
    }

    if (!text || !text.trim()) {
        return null;
    }

    // Stop any currently playing audio
    stopSpeaking();

    const {
        stability = 0.5,
        similarity = 0.75,
        style = 0.0,
    } = options;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Accept': 'audio/mpeg',
                'Content-Type': 'application/json',
                'xi-api-key': ELEVENLABS_API_KEY,
            },
            body: JSON.stringify({
                text: text,
                model_id: 'eleven_multilingual_v2',
                voice_settings: {
                    stability,
                    similarity_boost: similarity,
                    style,
                    use_speaker_boost: true,
                },
            }),
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            console.error('[EDITH Voice] TTS Error:', err);
            throw new Error(err.detail?.message || `ElevenLabs API error: ${response.status}`);
        }

        // Convert response to audio blob and play it
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);

        // Clean up the blob URL when done
        audio.addEventListener('ended', () => {
            URL.revokeObjectURL(audioUrl);
            currentAudio = null;
        });

        audio.addEventListener('error', () => {
            URL.revokeObjectURL(audioUrl);
            currentAudio = null;
        });

        currentAudio = audio;
        await audio.play();

        return audio;
    } catch (error) {
        console.error('[EDITH Voice] Failed to speak:', error.message);
        return null;
    }
}

/**
 * Stop any currently playing EDITH speech.
 */
export function stopSpeaking() {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
    }
}

/**
 * Check if EDITH is currently speaking.
 * @returns {boolean}
 */
export function isSpeaking() {
    return currentAudio !== null && !currentAudio.paused;
}
