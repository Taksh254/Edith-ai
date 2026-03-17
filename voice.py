import os
import requests
import pyttsx3

# Initialize fallback TTS engine
engine = pyttsx3.init()
engine.setProperty('rate', 170)

def play_audio_pygame(file_path):
    try:
        import pygame
        pygame.mixer.init()
        pygame.mixer.music.load(file_path)
        pygame.mixer.music.play()
        while pygame.mixer.music.get_busy():
            pygame.time.Clock().tick(10)
        pygame.mixer.music.unload()
        # Optionally remove the temp file
        try:
            os.remove(file_path)
        except:
            pass
    except Exception as e:
        print(f"Error playing audio with pygame: {e}")

def speak(text):
    print("EDITH:", text)
    
    # Check for ElevenLabs API Key
    api_key = os.environ.get("ELEVENLABS_API_KEY")
    if not api_key:
        print("ELEVENLABS_API_KEY not found. Falling back to local TTS.")
        engine.say(text)
        engine.runAndWait()
        return

    voice_id = "6xqa1WbOXVQ0gtnAqv9f" # EDITH Voice ID
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"

    headers = {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": api_key
    }

    data = {
        "text": text,
        "model_id": "eleven_turbo_v2_5",
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.5
        }
    }

    try:
        response = requests.post(url, json=data, headers=headers)
        if response.status_code == 200:
            import uuid
            audio_path = f"edith_response_{uuid.uuid4().hex}.mp3"
            with open(audio_path, "wb") as f:
                f.write(response.content)
            
            # Start playing the audio
            play_audio_pygame(audio_path)
        else:
            print(f"ElevenLabs Error: {response.text}. Falling back to local TTS.")
            engine.say(text)
            engine.runAndWait()
    except Exception as e:
        print(f"Voice Error: {e}. Falling back to local TTS.")
        engine.say(text)
        engine.runAndWait()

def listen():
    return input("You: ")