import tkinter as tk
from tkinter import scrolledtext
import threading
import math
import brain
import edith_commands
from PIL import Image, ImageTk, ImageFilter
import os

class EdithGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("EDITH AI Assistant")
        self.root.geometry("800x850")
        self.root.configure(bg="#000000")
        self.root.resizable(False, False)

        # Animation state
        self.tk_frames = []          # Final PhotoImage list (with interpolated frames)
        self.frame_index = 0
        self.animation_direction = 1

        # Number of interpolated frames to blend between each pair of originals
        self.interp_steps = 2        # Creates 2 blend frames between each pair

        # Loading label shown while frames load
        self.loading_label = tk.Label(root, text="Loading EDITH...", bg="#000000", fg="#00aaff",
                                      font=("Consolas", 14))
        self.loading_label.pack(pady=20)

        # Animation Canvas (avoids flicker vs Label)
        self.anim_canvas = tk.Canvas(root, bg="#000000", highlightthickness=0, width=600, height=338)
        self.anim_canvas.pack(pady=(5, 0))
        self.canvas_image_id = self.anim_canvas.create_image(300, 169, anchor=tk.CENTER)

        # Chat Area
        self.chat_area = scrolledtext.ScrolledText(
            root, wrap=tk.WORD, state='disabled',
            bg="#0a0a0a", fg="#00ffcc",
            font=("Consolas", 11), height=10,
            bd=0, relief=tk.FLAT,
            selectbackground="#003344"
        )
        self.chat_area.pack(padx=20, pady=(10, 5), fill=tk.BOTH, expand=True)
        self.chat_area.tag_config("user", foreground="#00aaff")
        self.chat_area.tag_config("edith", foreground="#ff0044")

        # Input Frame
        self.input_frame = tk.Frame(root, bg="#000000")
        self.input_frame.pack(padx=20, pady=(5, 15), fill=tk.X)

        # Input Box
        self.user_input = tk.Entry(
            self.input_frame, bg="#1a1a1a", fg="#ffffff",
            font=("Consolas", 12), insertbackground="#00aaff",
            bd=0, relief=tk.FLAT
        )
        self.user_input.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 10), ipady=6)
        self.user_input.bind("<Return>", self.send_message)

        # Send Button
        self.send_button = tk.Button(
            self.input_frame, text="SEND", command=self.send_message,
            bg="#007acc", fg="white", font=("Arial", 10, "bold"),
            activebackground="#005f99", activeforeground="white",
            bd=0, relief=tk.FLAT, padx=16, pady=4
        )
        self.send_button.pack(side=tk.RIGHT)

        self.user_input.focus()

        # Load frames in a background thread so the UI doesn't freeze
        threading.Thread(target=self._load_frames_thread, daemon=True).start()

    # ---------- Frame Loading ----------

    def _load_frames_thread(self):
        """Load and interpolate frames in background, then start animation on main thread."""
        frames_dir = os.path.join(os.path.dirname(__file__), 'frames', 'not activated')
        if not os.path.exists(frames_dir):
            print(f"Error: Animation directory not found at {frames_dir}")
            return

        try:
            files = sorted(
                f for f in os.listdir(frames_dir)
                if f.lower().endswith(('.jpg', '.png'))
            )

            base_width = 600
            raw_images = []   # PIL Image objects

            for filename in files:
                path = os.path.join(frames_dir, filename)
                img = Image.open(path).convert("RGB")
                w_percent = base_width / float(img.size[0])
                h_size = int(float(img.size[1]) * w_percent)
                img = img.resize((base_width, h_size), Image.Resampling.LANCZOS)
                raw_images.append(img)

            # Build interpolated sequence for ultra-smooth playback
            interpolated = []
            for i in range(len(raw_images) - 1):
                interpolated.append(raw_images[i])
                for step in range(1, self.interp_steps + 1):
                    alpha = step / (self.interp_steps + 1)
                    blended = Image.blend(raw_images[i], raw_images[i + 1], alpha)
                    interpolated.append(blended)
            interpolated.append(raw_images[-1])  # last frame

            # Convert to PhotoImage on the main thread
            self.root.after(0, lambda: self._finalise_frames(interpolated))

        except Exception as e:
            print(f"Error loading frames: {e}")

    def _finalise_frames(self, pil_images):
        """Convert PIL images to PhotoImages and start animation (runs on main thread)."""
        self.tk_frames = [ImageTk.PhotoImage(img) for img in pil_images]

        # Remove loading label
        self.loading_label.destroy()

        # Start the animation loop
        self.animate()

    # ---------- Animation ----------

    def _ease_delay(self):
        """
        Returns the delay in ms for the current frame.
        Applies a sine-based ease-in / ease-out near reversal boundaries
        so the orb gently decelerates before reversing direction.
        """
        total = len(self.tk_frames)
        if total == 0:
            return 20

        # How close are we to either boundary? (0.0 = at boundary, 1.0 = middle)
        edge_dist = min(self.frame_index, total - 1 - self.frame_index)
        ease_zone = 30  # number of frames in which to apply easing

        if edge_dist < ease_zone:
            # Sine ease: slow down approaching the edge
            t = edge_dist / ease_zone          # 0 → 1
            factor = 0.4 + 0.6 * math.sin(t * math.pi / 2)  # 0.4 → 1.0
            return int(20 / factor)            # 20ms → 50ms at edges
        return 20  # base interval for smooth 50fps-equivalent playback

    def animate(self):
        if not self.tk_frames:
            return

        # Display current frame on canvas (flicker-free)
        self.anim_canvas.itemconfig(self.canvas_image_id, image=self.tk_frames[self.frame_index])

        # Advance index
        self.frame_index += self.animation_direction

        # Reverse at boundaries
        if self.frame_index >= len(self.tk_frames):
            self.frame_index = len(self.tk_frames) - 2
            self.animation_direction = -1
        elif self.frame_index < 0:
            self.frame_index = 1
            self.animation_direction = 1

        # Schedule next frame with eased timing
        self.root.after(self._ease_delay(), self.animate)

    # ---------- Chat ----------

    def send_message(self, event=None):
        message = self.user_input.get()
        if not message.strip():
            return

        self.user_input.delete(0, tk.END)
        self.append_message("You: " + message + "\n", "user")

        threading.Thread(target=self.get_ai_response, args=(message,), daemon=True).start()

    def get_ai_response(self, message):
        try:
            cmd_result = edith_commands.execute_command(message)
            
            if cmd_result:
                response = cmd_result
            else:
                response = brain.generate_response(message)
        except Exception as e:
            response = f"Error: {e}"

        self.root.after(0, lambda: self.append_message("EDITH: " + response + "\n", "edith"))
        
        try:
            from voice import speak
            speak(response)
        except Exception as e:
            print(f"Failed to speak: {e}")

    def append_message(self, text, tag):
        self.chat_area.config(state='normal')
        self.chat_area.insert(tk.END, text, tag)
        self.chat_area.see(tk.END)
        self.chat_area.config(state='disabled')


if __name__ == "__main__":
    root = tk.Tk()
    app = EdithGUI(root)
    root.mainloop()
