import os
import subprocess
import platform

def openApp(appName):
    """
    Opens specified applications using Windows shell commands via PowerShell.
    Supported: chrome, vs code, file explorer, downloads, documents, desktop
    """
    if platform.system() != "Windows":
        return f"Opening {appName} is currently only supported on Windows."
    
    app_map = {
        "chrome": "chrome",
        "vs code": "code",
        "file explorer": "explorer",
        "downloads": "shell:Downloads",
        "documents": "shell:Personal",
        "desktop": "shell:Desktop"
    }
    
    target = app_map.get(appName.lower())
    if target:
        try:
            # We use DETACHED_PROCESS to ensure the app stays open after EDITH exits
            # shell=True is needed for environment variable/path resolution on some systems
            subprocess.Popen(f"powershell -Command Start-Process '{target}'", 
                             shell=True, 
                             creationflags=subprocess.DETACHED_PROCESS | subprocess.CREATE_NEW_PROCESS_GROUP)
            
            display_names = {
                "chrome": "Chrome",
                "vs code": "VS Code",
                "file explorer": "File Explorer",
                "downloads": "Downloads",
                "documents": "Documents",
                "desktop": "Desktop"
            }
            return f"Opening {display_names.get(appName.lower(), appName)}."
        except Exception as e:
            return f"Failed to open {appName}: {e}"
    return f"Application {appName} not found."

def adjustVolume(level):
    """
    Adjusts system volume using Windows Script Host via PowerShell.
    level: increase, decrease, mute, unmute
    """
    try:
        if level == "increase":
            cmd = "(new-object -com wscript.shell).SendKeys([char]175)"
            subprocess.run(["powershell", "-Command", f"1..10 | %{{ {cmd} }}"], shell=True)
            return "Increasing system volume."
        elif level == "decrease":
            cmd = "(new-object -com wscript.shell).SendKeys([char]174)"
            subprocess.run(["powershell", "-Command", f"1..10 | %{{ {cmd} }}"], shell=True)
            return "Decreasing system volume."
        elif level == "mute":
            cmd = "(new-object -com wscript.shell).SendKeys([char]173)"
            subprocess.run(["powershell", "-Command", cmd], shell=True)
            return "Muting system volume."
        elif level == "unmute":
            # Volume mute is a toggle
            cmd = "(new-object -com wscript.shell).SendKeys([char]173)"
            subprocess.run(["powershell", "-Command", cmd], shell=True)
            return "Unmuting system volume."
    except Exception as e:
        return f"Error controlling volume: {e}"

def adjustBrightness(level):
    """
    Adjusts system brightness via WMI classes.
    level: increase, decrease
    """
    try:
        # Get current brightness
        get_cmd = "(Get-WmiObject -Namespace root/wmi -Class WmiMonitorBrightness).CurrentBrightness"
        res = subprocess.run(["powershell", "-Command", get_cmd], capture_output=True, text=True, shell=True)
        current = int(res.stdout.strip()) if res.stdout.strip().isdigit() else 50
        
        new_val = current
        if level == "increase":
            new_val = min(100, current + 20)
        elif level == "decrease":
            new_val = max(0, current - 20)
            
        set_cmd = f"(Get-WmiObject -Namespace root/wmi -Class WmiMonitorBrightnessMethods).WmiSetBrightness(1, {new_val})"
        subprocess.run(["powershell", "-Command", set_cmd], shell=True)
        return "Increasing system brightness." if level == "increase" else "Decreasing system brightness."
    except Exception as e:
        return f"Error controlling brightness: {e}"

def lockSystem():
    """Locks the Windows workstation."""
    if platform.system() == "Windows":
        subprocess.Popen("rundll32.exe user32.dll,LockWorkStation", shell=True)
        return "Locking the computer now."
    return "Locking is currently only supported on Windows."

def sleepSystem():
    """Puts the computer to sleep."""
    if platform.system() == "Windows":
        # Uses Windows Forms to trigger sleep mode safely
        ps_cmd = "Add-Type -Assembly System.Windows.Forms; [System.Windows.Forms.Application]::SetSuspendState('PowerState.Suspend', $false, $false)"
        subprocess.Popen(["powershell", "-Command", ps_cmd], shell=True)
        return "Putting the system to sleep."
    return "Sleep function is currently only supported on Windows."

def restartSystem():
    """Restarts the computer."""
    if platform.system() == "Windows":
        os.system("shutdown /r /t 0")
        return "Restarting the computer."
    return "Restart function is currently only supported on Windows."

def shutdownSystem():
    """Shuts down the computer."""
    if platform.system() == "Windows":
        os.system("shutdown /s /t 0")
        return "Shutting down the computer."
    return "Shutdown function is currently only supported on Windows."

def execute_command(command):
    """
    Natural Language Command Processor.
    Uses keyword matching to map intent to local system actions.
    """
    command = command.lower()

    # Application Control
    if "open chrome" in command:
        return openApp("chrome")
    if "open vs code" in command or "open vscode" in command:
        return openApp("vs code")
    if "open file explorer" in command or "open explorer" in command:
        return openApp("file explorer")
    if "open downloads" in command:
        return openApp("downloads")
    if "open documents" in command:
        return openApp("documents")
    if "open desktop" in command:
        return openApp("desktop")

    # Volume Control
    if "increase volume" in command or ("volume" in command and "up" in command):
        return adjustVolume("increase")
    if "decrease volume" in command or ("volume" in command and "down" in command):
        return adjustVolume("decrease")
    if "unmute volume" in command or "unmute" in command:
        return adjustVolume("unmute")
    if "mute volume" in command or "mute" in command:
        return adjustVolume("mute")

    # Brightness Control
    if "increase brightness" in command or ("brightness" in command and "up" in command):
        return adjustBrightness("increase")
    if "decrease brightness" in command or ("brightness" in command and "down" in command):
        return adjustBrightness("decrease")

    # System Power Commands
    if "lock the system" in command or "lock system" in command or "lock the pc" in command or "lock pc" in command:
        return lockSystem()
    if "put the computer to sleep" in command or ("sleep" in command and ("system" in command or "pc" in command or "computer" in command)):
        return sleepSystem()
    if "restart the computer" in command or "restart computer" in command or "restart system" in command or "restart pc" in command:
        return restartSystem()
    if "shut down the computer" in command or "shutdown the computer" in command or "shut down computer" in command or "shutdown computer" in command or "shutdown system" in command or "shut down system" in command:
        return shutdownSystem()

    return False