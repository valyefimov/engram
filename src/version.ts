import { readFileSync } from 'node:fs';

/** Read from package.json at runtime so there is a single source of truth. */
export const VERSION: string = (() => {
  try {
    const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
    return String(pkg.version);
  } catch {
    return '0.0.0';
  }
})();
