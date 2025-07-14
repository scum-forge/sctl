import fs, { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
// eslint-disable-next-line import-x/no-extraneous-dependencies
import YAML from 'yaml';

const ymlFile = join(import.meta.dir, '..', 'locales', 'en-US.yml');
const outPath = join(import.meta.dir, '..', 'src', 'generated');
const outFile = join(outPath, 'en-US.json');

const raw = await fs.readFile(ymlFile, 'utf-8');
const parsed = YAML.parse(raw) as Record<string, unknown>;

await mkdir(outPath, { recursive: true });
await writeFile(outFile, JSON.stringify(parsed, undefined, 2));
console.log('Done.');
