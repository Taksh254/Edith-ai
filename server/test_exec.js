const { exec } = require('child_process');
console.log("Starting...");
exec('start chrome', (err) => {
    console.log("Done!", err);
    process.exit(0);
});
