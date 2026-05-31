import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { verifyD1MigrationSequence } from '../verify-d1-migration-sequence.mjs';

let tmpDir;

describe('verify-d1-migration-sequence.mjs', () => {
  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'd1-sequence-'));
  });

  after(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('passes when duplicate prefixes are documented exactly', async () => {
    await writeFixture({
      files: ['0001_init.sql', '0002_a.sql', '0002_b.sql'],
      exceptions: {
        duplicates: [
          {
            prefix: '0002',
            files: ['0002_b.sql', '0002_a.sql'],
            rationale: 'Documented historical duplicate prefix for compatibility.',
          },
        ],
      },
    });

    const result = await verifyD1MigrationSequence({
      cwd: tmpDir,
      migrationsDir: 'migrations',
      exceptionsFile: 'exceptions.json',
    });

    assert.equal(result.ok, true);
    assert.equal(result.duplicateGroups.length, 1);
  });

  it('fails for an undocumented duplicate prefix', async () => {
    await writeFixture({
      files: ['0001_init.sql', '0002_a.sql', '0002_b.sql'],
      exceptions: { duplicates: [] },
    });

    const result = await verifyD1MigrationSequence({
      cwd: tmpDir,
      migrationsDir: 'migrations',
      exceptionsFile: 'exceptions.json',
    });

    assert.equal(result.ok, false);
    assert.deepEqual(result.unregisteredDuplicates.map((group) => group.prefix), ['0002']);
  });

  it('fails for stale exceptions and invalid names', async () => {
    await writeFixture({
      files: ['0001_init.sql', '0002_a.sql', 'bad.sql'],
      exceptions: {
        duplicates: [
          {
            prefix: '0002',
            files: ['0002_a.sql', '0002_b.sql'],
            rationale: 'Documented historical duplicate prefix for compatibility.',
          },
        ],
      },
    });

    const result = await verifyD1MigrationSequence({
      cwd: tmpDir,
      migrationsDir: 'migrations',
      exceptionsFile: 'exceptions.json',
    });

    assert.equal(result.ok, false);
    assert.deepEqual(result.invalidNames, ['bad.sql']);
    assert.deepEqual(result.staleExceptions.map((entry) => entry.prefix), ['0002']);
  });

  it('fails when a documented duplicate has no rationale', async () => {
    await writeFixture({
      files: ['0001_init.sql', '0002_a.sql', '0002_b.sql'],
      exceptions: {
        duplicates: [
          {
            prefix: '0002',
            files: ['0002_a.sql', '0002_b.sql'],
            rationale: '   ',
          },
        ],
      },
    });

    const result = await verifyD1MigrationSequence({
      cwd: tmpDir,
      migrationsDir: 'migrations',
      exceptionsFile: 'exceptions.json',
    });

    assert.equal(result.ok, false);
    assert.deepEqual(result.missingRationale.map((entry) => entry.prefix), ['0002']);
  });
});

async function writeFixture({ files, exceptions }) {
  const migrationsDir = path.join(tmpDir, 'migrations');
  await fs.rm(migrationsDir, { recursive: true, force: true });
  await fs.mkdir(migrationsDir, { recursive: true });
  for (const fileName of files) {
    await fs.writeFile(path.join(migrationsDir, fileName), '-- fixture\n');
  }
  await fs.writeFile(path.join(tmpDir, 'exceptions.json'), JSON.stringify(exceptions, null, 2));
}
