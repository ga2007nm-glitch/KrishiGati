const { spawn } = require("node:child_process");

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const children = [
  ["backend", ["run", "dev:backend"]],
  ["frontend", ["run", "dev:frontend"]],
].map(([name, args]) => {
  const child = spawn(npmCommand, args, {
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
    windowsHide: false,
  });

  child.on("error", (error) => {
    console.error(`[${name}] ${error.message}`);
  });

  return { name, child };
});

function shutdown() {
  for (const { child } of children) {
    if (!child.killed) {
      child.kill();
    }
  }
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
process.on("exit", shutdown);

for (const { name, child } of children) {
  child.on("exit", (code, signal) => {
    if (code !== 0 && signal === null) {
      console.error(`[${name}] exited with code ${code}`);
      shutdown();
      process.exitCode = code || 1;
    }
  });
}
