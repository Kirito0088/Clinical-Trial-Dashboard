/* Tiny console logger with ANSI colour. Zero deps, readable in a lab terminal. */

const C = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
} as const;

const stamp = () => new Date().toISOString().slice(11, 19);

export const log = {
  info: (msg: string, ...rest: unknown[]) =>
    console.log(`${C.dim}${stamp()}${C.reset} ${C.blue}info${C.reset}  ${msg}`, ...rest),
  ok: (msg: string, ...rest: unknown[]) =>
    console.log(`${C.dim}${stamp()}${C.reset} ${C.green}ok${C.reset}    ${msg}`, ...rest),
  warn: (msg: string, ...rest: unknown[]) =>
    console.warn(`${C.dim}${stamp()}${C.reset} ${C.yellow}warn${C.reset}  ${msg}`, ...rest),
  error: (msg: string, ...rest: unknown[]) =>
    console.error(`${C.dim}${stamp()}${C.reset} ${C.red}error${C.reset} ${msg}`, ...rest),
  banner: (lines: string[]) => {
    const width = Math.max(...lines.map((l) => stripAnsi(l).length)) + 2;
    console.log(`${C.cyan}┌${'─'.repeat(width)}┐${C.reset}`);
    for (const line of lines) {
      const pad = ' '.repeat(width - stripAnsi(line).length - 1);
      console.log(`${C.cyan}│${C.reset} ${line}${pad}${C.cyan}│${C.reset}`);
    }
    console.log(`${C.cyan}└${'─'.repeat(width)}┘${C.reset}`);
  },
};

function stripAnsi(s: string): string {
  // eslint-disable-next-line no-control-regex
  return s.replace(/\x1b\[[0-9;]*m/g, '');
}

export const colors = C;
