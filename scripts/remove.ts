import { rmSync } from 'fs';

const pathsToRemove = process.argv;

for (const path of pathsToRemove.slice(2)) {
  rmSync(path, { recursive: true, force: true, maxRetries: process.platform === 'win32' ? 10 : 0 });
}
