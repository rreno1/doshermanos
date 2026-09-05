import assert from 'node:assert/strict';
import { existsSync, lstatSync, readFileSync, readdirSync, statSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(path, 'utf8');

function sourceFiles(directory) {
  if (!existsSync(directory)) return [];

  return readdirSync(directory).flatMap((name) => {
    const path = `${directory}/${name}`;
    const stats = lstatSync(path);
    if (stats.isSymbolicLink()) return [];
    if (stats.isDirectory()) return sourceFiles(path);
    return /\.(?:ts|tsx|js|jsx|mjs)$/.test(name) ? [path] : [];
  });
}

function symbolicLinks(directory) {
  if (!existsSync(directory)) return [];

  return readdirSync(directory).flatMap((name) => {
    const path = `${directory}/${name}`;
    const stats = lstatSync(path);
    if (stats.isSymbolicLink()) return [path];
    if (stats.isDirectory()) return symbolicLinks(path);
    return [];
  });
}

test('GSU architecture roots are the canonical frontend structure', () => {
  for (const path of [
    'src/App.tsx',
    'src/core/app/nav.ts',
    'src/core/app/navigation.tsx',
    'src/core/app/ManagementShell.tsx',
    'src/core/firebase',
    'src/modules',
    'src/shared/ui',
    'src/styles/index.css',
  ]) {
    assert.ok(existsSync(path), `Canonical GSU-style source path is missing: ${path}`);
  }

  for (const path of ['src/app', 'src/features', 'src/firebase']) {
    assert.equal(existsSync(path), false, `Legacy frontend path must be removed: ${path}`);
  }

  assert.deepEqual(symbolicLinks('src'), [], 'Canonical frontend source must not depend on compatibility symlinks.');
});

test('architectural imports communicate ownership through GSU aliases', () => {
  const viteConfig = read('vite.config.ts');
  const tsconfig = read('tsconfig.json');
  const appSource = read('src/App.tsx');
  const shellSource = read('src/core/app/ManagementShell.tsx');

  for (const alias of ['@core', '@modules', '@shared', '@styles']) {
    assert.match(viteConfig, new RegExp(alias));
    assert.match(tsconfig, new RegExp(alias));
  }

  assert.match(appSource, /from '@core\/app\/nav'/);
  assert.match(appSource, /from '@modules\/dashboard\/DashboardPanel'/);
  assert.match(shellSource, /from '@shared\/ui\/Header'/);
  assert.match(shellSource, /from '@core\/firebase\/firebase'/);
  assert.doesNotMatch(appSource, /\.\.\/features|\.\/app\//);
});

test('shared UI has one canonical implementation tree', () => {
  for (const name of [
    'Header.tsx',
    'NavigationOverlay.tsx',
    'AppBrand.tsx',
    'PrimaryNavigation.tsx',
    'AccountMenu.tsx',
    'ManagementControls.tsx',
    'ManagementSelect.tsx',
    'ResponsiveButtonContent.tsx',
    'TwoLineMenuIcon.tsx',
    'FilterIcon.tsx',
  ]) {
    assert.ok(existsSync(`src/shared/ui/${name}`), `Shared UI primitive missing: ${name}`);
  }

  assert.equal(
    existsSync('src/shared/ui/ToastProvider.tsx'),
    false,
    'ToastProvider belongs to core/app and must not have a duplicate shared implementation.',
  );
});

test('styles keep one imports-only ownership entrypoint with responsive rules last', () => {
  const styleIndex = read('src/styles/index.css');
  assert.doesNotMatch(styleIndex, /\{/);
  assert.match(styleIndex, /@import '\.\/responsive-contract\.css';\s*$/);

  for (const name of readdirSync('src/styles')) {
    const path = `src/styles/${name}`;
    if (!name.endsWith('.css')) continue;
    assert.ok(statSync(path).size < 36_000, `Style ownership file must stay below 36 KB: ${path}`);
  }
});

test('human-readable module files remain bounded and avoid deep cross-layer imports', () => {
  for (const path of sourceFiles('src/modules').filter((path) => path.endsWith('.tsx'))) {
    assert.ok(statSync(path).size < 36_000, `Module TSX file must stay below 36 KB: ${path}`);

    const source = read(path);
    assert.doesNotMatch(
      source,
      /from ['"]\.\.\/\.\.\/\.\.\//,
      `Module code must use architectural aliases instead of deep three-level imports: ${path}`,
    );
  }
});

test('modules no longer depend on legacy app features or root firebase paths', () => {
  const legacyImportPattern = /(?:from\s+['"]|import\s+['"])(?:\.\.\/)+(?:app|features|firebase)(?:\/|['"])/;
  const offenders = sourceFiles('src/modules')
    .filter((path) => legacyImportPattern.test(read(path)))
    .sort();

  assert.deepEqual(
    offenders,
    [],
    `Migrate these module imports to @core, @modules, @shared, or local module paths:\n${offenders.join('\n')}`,
  );
});

test('tests exercise canonical source paths instead of migration aliases', () => {
  const legacyTestPathPattern = /\.\.\/src\/(?:app|features|firebase)(?:\/|['"])/;
  const offenders = sourceFiles('tests')
    .filter((path) => legacyTestPathPattern.test(read(path)))
    .sort();

  assert.deepEqual(
    offenders,
    [],
    `Tests must target canonical source ownership:\n${offenders.join('\n')}`,
  );
});
