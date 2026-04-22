import { spawn } from 'node:child_process'
import path from 'node:path'

const CLI = path.join(process.cwd(), 'legacy-src', 'padel_cli.py')
const DATA_DIR = process.env.PADEL_DATA_DIR ?? path.join(process.cwd(), 'public', 'padel-data')

export type PyResult = {
  status: number
  body: unknown
}

export function runPadelCli(
  subcommand: string,
  args: { stdin?: string; argv?: string[] } = {}
): Promise<PyResult> {
  return new Promise((resolve) => {
    const argv = ['python3', CLI, subcommand, ...(args.argv ?? [])]
    const child = spawn(argv[0], argv.slice(1), {
      env: { ...process.env, PADEL_DATA_DIR: DATA_DIR },
      stdio: ['pipe', 'pipe', 'pipe']
    })
    const out: Buffer[] = []
    const err: Buffer[] = []
    child.stdout.on('data', (b) => out.push(b))
    child.stderr.on('data', (b) => err.push(b))
    child.on('error', (e) => {
      resolve({ status: 500, body: { message: `spawn failed: ${e.message}` } })
    })
    child.on('close', (code) => {
      const stdout = Buffer.concat(out).toString('utf8').trim()
      const stderr = Buffer.concat(err).toString('utf8').trim()
      let parsed: unknown = null
      try { parsed = stdout ? JSON.parse(stdout) : null } catch { parsed = { message: stdout || stderr || 'Bad JSON from CLI' } }
      if (code === 0) return resolve({ status: 200, body: parsed })
      if (code === 1) return resolve({ status: 400, body: parsed })
      // codes 10..19 = 400..409 mapped; otherwise 500
      if (code && code >= 10 && code <= 19) return resolve({ status: 390 + code, body: parsed })
      console.error('[padel-cli]', code, stderr)
      return resolve({ status: 500, body: parsed ?? { message: 'Fallo interno en padel_cli' } })
    })
    if (args.stdin != null) child.stdin.end(args.stdin)
    else child.stdin.end()
  })
}
