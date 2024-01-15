const { spawn } = require('child_process');

// Example: Running a shell command
const childProcess = spawn('ls', ['-l', '-a']);

// Listen for output events from the child process
childProcess.stdout.on('data', (data) => {
  console.log(`Child process output: ${data}`);
});

childProcess.stderr.on('data', (data) => {
  console.error(`Child process error: ${data}`);
});

// Listen for the exit event of the child process
childProcess.on('close', (code) => {
  console.log(`Child process exited with code ${code}`);
});
