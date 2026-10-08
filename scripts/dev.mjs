import { spawn } from 'node:child_process'

const procs = [
  spawn('node', ['server/index.mjs'], { stdio: 'inherit' }),
  spawn('pnpm', ['exec', 'vite'], { stdio: 'inherit' }),
]

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    for (const p of procs) p.kill(sig)
    process.exit(0)
  })
}

for (const p of procs) {
  p.on('exit', (code) => {
    if (code !== 0 && code !== null) process.exitCode = code
  })
}
