import { readdirSync } from 'node:fs';
import { extname, join } from 'node:path';
import { spawnSync } from 'node:child_process';

const ignoredDirectories = new Set(['.git', 'coverage', 'node_modules']);

const findJavaScriptFiles = (directory) => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const path = join(directory, entry.name);
  if (entry.isDirectory()) return ignoredDirectories.has(entry.name) ? [] : findJavaScriptFiles(path);
  return extname(entry.name) === '.js' ? [path] : [];
});

for (const file of findJavaScriptFiles(process.cwd())) {
  const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  if (result.status !== 0) process.exitCode = 1;
}
