import sys
import brain
from voice import speak, listen
import edith_commands
from memory import Memory

def main():
    print("Initializing EDITH...")
    memory = Memory()

    speak("EDITH is online. How can I help you?")

    while True:
        user_input = listen()
        if not user_input:
            continue
        
        print(f"User: {user_input}")

        if "exit" in user_input.lower():
            speak("Shutting down via command.")
            sys.exit()

        cmd_result = edith_commands.execute_command(user_input)
        if cmd_result:
            response = cmd_result
        else:
            try:
                response = brain.generate_response(user_input)
            except Exception as e:
                response = f"Error: {e}"

        memory.add(user_input, response)
        speak(response)

if __name__ == "__main__":
    main()