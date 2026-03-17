import { exec, spawn } from 'child_process';
import os from 'os';
import util from 'util';

const execAsync = util.promisify(exec);

/**
 * Maps to exactly the function names and behavior requested.
 */

export async function openApp(appName) {
    if (os.platform() !== 'win32') {
        return `Opening ${appName} is currently only supported on Windows.`;
    }

    const appMap = {
        'chrome': 'chrome',
        'vs code': 'code',
        'file explorer': 'explorer',
        'downloads': 'shell:Downloads',
        'documents': 'shell:Personal',
        'desktop': 'shell:Desktop'
    };

    const target = appMap[appName.toLowerCase()];
    if (target) {
        try {
            // Detached spawn ensures the application remains open independently
            const psCommand = `Start-Process "${target}"`;
            spawn('powershell', ['-Command', psCommand], {
                detached: true,
                stdio: 'ignore'
            }).unref();

            const displayNames = {
                'chrome': 'Chrome',
                'vs code': 'VS Code',
                'file explorer': 'File Explorer',
                'downloads': 'Downloads',
                'documents': 'Documents',
                'desktop': 'Desktop'
            };
            return `Opening ${displayNames[appName.toLowerCase()] || appName}.`;
        } catch (error) {
            console.error('App Launch Error:', error);
            return `Failed to open ${appName}.`;
        }
    }
    return `Application ${appName} not found.`;
}

export async function adjustVolume(level) {
    if (os.platform() !== 'win32') return "Volume control is currently only supported on Windows.";
    
    try {
        let psCommand = '';
        if (level === 'increase') {
            psCommand = `(new-object -com wscript.shell).SendKeys([char]175)`;
            await execAsync(`powershell -c "1..10 | %{ ${psCommand} }"`);
            return "Increasing system volume.";
        } else if (level === 'decrease') {
            psCommand = `(new-object -com wscript.shell).SendKeys([char]174)`;
            await execAsync(`powershell -c "1..10 | %{ ${psCommand} }"`);
            return "Decreasing system volume.";
        } else if (level === 'mute' || level === 'unmute') {
            psCommand = `(new-object -com wscript.shell).SendKeys([char]173)`;
            await execAsync(`powershell -c "${psCommand}"`);
            return level === 'mute' ? "Muting system volume." : "Unmuting system volume.";
        }
    } catch (error) {
        console.error('Volume Error:', error);
        return "Failed to adjust volume.";
    }
}

export async function adjustBrightness(level) {
    if (os.platform() !== 'win32') return "Brightness control is currently only supported on Windows.";
    
    try {
        const getCmd = `(Get-WmiObject -Namespace root/wmi -Class WmiMonitorBrightness).CurrentBrightness`;
        const { stdout } = await execAsync(`powershell -c "${getCmd}"`);
        let current = parseInt(stdout.trim());
        if (isNaN(current)) current = 50;

        let newBrightness = current;
        if (level === 'increase') {
            newBrightness = Math.min(100, current + 20);
        } else if (level === 'decrease') {
            newBrightness = Math.max(0, current - 20);
        }

        const setCmd = `(Get-WmiObject -Namespace root/wmi -Class WmiMonitorBrightnessMethods).WmiSetBrightness(1, ${newBrightness})`;
        await execAsync(`powershell -c "${setCmd}"`);
        return `${level === 'increase' ? 'Increasing' : 'Decreasing'} system brightness.`;
    } catch (error) {
        console.error('Brightness Error:', error);
        return "Failed to adjust brightness. Note: This only works on built-in laptop displays.";
    }
}

export async function lockSystem() {
    if (os.platform() === 'win32') {
        try {
            spawn('rundll32.exe', ['user32.dll,LockWorkStation'], { detached: true, stdio: 'ignore' }).unref();
            return "Locking the computer now.";
        } catch (error) {
            return "Failed to lock the system.";
        }
    }
    return "Locking is currently only supported on Windows.";
}

export async function sleepSystem() {
    if (os.platform() === 'win32') {
        try {
            const psCmd = `Add-Type -Assembly System.Windows.Forms; [System.Windows.Forms.Application]::SetSuspendState('PowerState.Suspend', $false, $false)`;
            spawn('powershell', ['-Command', psCmd], { detached: true, stdio: 'ignore' }).unref();
            return "Putting the system to sleep.";
        } catch (error) {
            return "Failed to sleep the system.";
        }
    }
    return "Sleep function is currently only supported on Windows.";
}

export async function restartSystem() {
    if (os.platform() === 'win32') {
        try {
            spawn('shutdown', ['/r', '/t', '0'], { detached: true, stdio: 'ignore' }).unref();
            return "Restarting the computer.";
        } catch (error) {
            return "Failed to restart the computer.";
        }
    }
    return "Restart function is currently only supported on Windows.";
}

export async function shutdownSystem() {
    if (os.platform() === 'win32') {
        try {
            spawn('shutdown', ['/s', '/t', '0'], { detached: true, stdio: 'ignore' }).unref();
            return "Shutting down the computer.";
        } catch (error) {
            return "Failed to shut down the computer.";
        }
    }
    return "Shutdown function is currently only supported on Windows.";
}

export async function executeCommand(commandStr) {
    const command = commandStr.toLowerCase();

    // Application Control
    if (command.includes('open chrome')) return await openApp('chrome');
    if (command.includes('open vs code') || command.includes('open vscode')) return await openApp('vs code');
    if (command.includes('open file explorer') || command.includes('open explorer')) return await openApp('file explorer');
    if (command.includes('open downloads')) return await openApp('downloads');
    if (command.includes('open documents')) return await openApp('documents');
    if (command.includes('open desktop')) return await openApp('desktop');

    // Volume Control
    if (command.includes('increase volume') || (command.includes('volume') && (command.includes('up') || command.includes('increase')))) return await adjustVolume('increase');
    if (command.includes('decrease volume') || (command.includes('volume') && (command.includes('down') || command.includes('decrease')))) return await adjustVolume('decrease');
    if (command.includes('unmute volume') || command.includes('unmute')) return await adjustVolume('unmute');
    if (command.includes('mute volume') || command.includes('mute')) return await adjustVolume('mute');

    // Brightness Control
    if (command.includes('increase brightness') || (command.includes('brightness') && (command.includes('up') || command.includes('increase')))) return await adjustBrightness('increase');
    if (command.includes('decrease brightness') || (command.includes('brightness') && (command.includes('down') || command.includes('decrease')))) return await adjustBrightness('decrease');

    // System Power Commands
    if (command.includes('lock the system') || command.includes('lock system') || command.includes('lock the pc') || command.includes('lock pc')) return await lockSystem();
    if (command.includes('put the computer to sleep') || (command.includes('sleep') && (command.includes('system') || command.includes('pc') || command.includes('computer')))) return await sleepSystem();
    if (command.includes('restart the computer') || command.includes('restart computer') || command.includes('restart system') || command.includes('restart pc')) return await restartSystem();
    if (command.includes('shut down the computer') || command.includes('shutdown the computer') || command.includes('shut down computer') || command.includes('shutdown computer') || command.includes('shutdown system') || command.includes('shut down system')) return await shutdownSystem();

    return false;
}
