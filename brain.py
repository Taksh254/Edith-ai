import os
from groq import Groq

# Global client variable to support lazy initialization
client = None

SYSTEM_PROMPT = """
You are EDITH, a highly advanced AI assistant inspired by Tony Stark's technology.
Your personality is fast, concise, professional, and extremely helpful.
You prioritize efficiency and direct answers.
You do not use filler words.
Ideally, your responses should be short unless detailed information is explicitly requested.
"""

def get_groq_client():
    """Lazily initializes and returns the Groq client."""
    global client
    if client:
        return client
        
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY environment variable is not set. Please set it to use EDITH.")
        
    client = Groq(api_key=api_key)
    return client

def generate_response(user_input):
    """
    Generates a response from the Groq API using the llama-3.1-8b-instant model.
    """
    if not user_input.strip():
        return "Please ask something."
        
    try:
        # Get client (will raise error if no API key)
        groq_client = get_groq_client()
        
        chat_completion = groq_client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": SYSTEM_PROMPT,
                },
                {
                    "role": "user",
                    "content": user_input,
                }
            ],
            model="llama-3.1-8b-instant",
            temperature=0.7,
            max_tokens=1024,
            top_p=1,
            stop=None,
            stream=False,
        )
        return chat_completion.choices[0].message.content
    except Exception as e:
        return f"System Error: {str(e)}"

if __name__ == "__main__":
    # Test function
    print("Testing EDITH Brain...")
    # This will fail if no key is set, which is expected for testing
    print(generate_response("Hello, are you online?"))