import { executeCommand } from './commands.js';

async function test() {
    console.log("Testing open chrome...");
    const res = await executeCommand("open chrome");
    console.log("Result:", res);
}

test();
